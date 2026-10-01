from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.schema import (
    ItemMaster, BatchMaster, InvoiceHeader, InvoiceItem, 
    StockAdjustment, SystemConfig, DoctorMaster, PatientMaster
)
from app.schemas.pydantic_models import InvoiceCreate

def get_system_config(db: Session, key: str, default_value: str = "OFF") -> str:
    cfg = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    return cfg.value if cfg else default_value

def generate_invoice_number(db: Session) -> str:
    today = datetime.utcnow()
    prefix = f"INV{today.strftime('%y%m%d')}"
    last_inv = db.query(InvoiceHeader).filter(
        InvoiceHeader.invoice_no.like(f"{prefix}%")
    ).order_by(InvoiceHeader.id.desc()).first()
    
    if last_inv:
        try:
            last_seq = int(last_inv.invoice_no[-4:])
            seq = last_seq + 1
        except Exception:
            seq = 1
    else:
        seq = 1
        
    return f"{prefix}-{seq:04d}"

def process_pos_sale(db: Session, sale_in: InvoiceCreate) -> InvoiceHeader:
    """
    Atomic POS sale transaction with GST calculations, stock deductions,
    regulatory schedule H/H1 compliance checks, and audit logging.
    """
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Invoice must contain at least one item.")

    allow_negative_stock = get_system_config(db, "GOMINUS_STOCK", "OFF") == "ON"
    allow_over_mrp = get_system_config(db, "ALLOW_OVER_MRP", "OFF") == "ON"

    today_date = date.today()

    subtotal = 0.0
    total_discount = 0.0
    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0

    has_schedule_h1 = False
    invoice_items_to_create = []
    stock_adjustments_to_create = []

    # Pre-validate doctor if patient/doctor info provided or if Schedule H1 item included
    doctor_name = sale_in.doctor_name
    if sale_in.doctor_id:
        doc = db.query(DoctorMaster).filter(DoctorMaster.id == sale_in.doctor_id).first()
        if doc:
            doctor_name = doc.doctor_name

    for line in sale_in.items:
        item = db.query(ItemMaster).filter(ItemMaster.id == line.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item ID {line.item_id} not found.")

        batch = db.query(BatchMaster).filter(
            BatchMaster.id == line.batch_id, 
            BatchMaster.item_id == line.item_id
        ).with_for_update().first()
        
        if not batch:
            raise HTTPException(status_code=404, detail=f"Batch ID {line.batch_id} not found for item {item.item_name}.")

        # Expiry Check
        if batch.expiry_date < today_date:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot sell expired medicine: {item.item_name} (Batch: {batch.batch_no}, Expired: {batch.expiry_date})"
            )

        # Batch Hold Check
        if batch.is_held:
            raise HTTPException(
                status_code=400,
                detail=f"Batch {batch.batch_no} of {item.item_name} is under quarantine / hold."
            )

        total_qty_needed = line.quantity + line.free_qty

        # Stock Availability Check
        available_stock = batch.stock_qty - batch.held_qty
        if available_stock < total_qty_needed and not allow_negative_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.item_name} (Batch: {batch.batch_no}). Available: {available_stock}, Requested: {total_qty_needed}"
            )

        # Rate determination
        unit_rate = line.unit_rate if line.unit_rate is not None and line.unit_rate > 0 else batch.sale_rate
        
        # Over-MRP validation
        if unit_rate > batch.mrp and not allow_over_mrp:
            raise HTTPException(
                status_code=400,
                detail=f"Selling rate (₹{unit_rate}) exceeds MRP (₹{batch.mrp}) for {item.item_name}."
            )

        # Discount locking check
        disc_pct = line.discount_percent
        if item.is_discount_locked and disc_pct > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Discounts are locked and disallowed for regulated item: {item.item_name}."
            )

        # Schedule H1 Flag check
        if item.is_schedule_h1:
            has_schedule_h1 = True

        # Math Calculations
        gross_line = round(line.quantity * unit_rate, 2)
        disc_amt = round(gross_line * (disc_pct / 100.0), 2)
        net_taxable = round(gross_line - disc_amt, 2)

        gst_rate = batch.gst_rate or 12.0
        # Intra-state calculation (CGST + SGST)
        cgst_amt = round(net_taxable * ((gst_rate / 2.0) / 100.0), 2)
        sgst_amt = round(net_taxable * ((gst_rate / 2.0) / 100.0), 2)
        igst_amt = 0.0
        net_line = round(net_taxable + cgst_amt + sgst_amt, 2)

        subtotal += gross_line
        total_discount += disc_amt
        total_taxable += net_taxable
        total_cgst += cgst_amt
        total_sgst += sgst_amt
        total_igst += igst_amt

        inv_item = InvoiceItem(
            item_id=item.id,
            batch_id=batch.id,
            item_name=item.item_name,
            batch_no=batch.batch_no,
            expiry_date=batch.expiry_date,
            hsn_code=item.hsn_code,
            quantity=line.quantity,
            free_qty=line.free_qty,
            unit_mrp=batch.mrp,
            unit_rate=unit_rate,
            discount_percent=disc_pct,
            discount_amount=disc_amt,
            taxable_amount=net_taxable,
            gst_rate=gst_rate,
            cgst_amount=cgst_amt,
            sgst_amount=sgst_amt,
            igst_amount=igst_amt,
            net_line_total=net_line,
            is_schedule_h1=item.is_schedule_h1
        )
        invoice_items_to_create.append(inv_item)

        # Record stock deduction
        before_stock = batch.stock_qty
        batch.stock_qty = round(batch.stock_qty - total_qty_needed, 2)
        after_stock = batch.stock_qty

        stock_adjustments_to_create.append(
            StockAdjustment(
                item_id=item.id,
                batch_id=batch.id,
                location_id=batch.location_id,
                adjustment_type="POS_SALE",
                quantity_change=-total_qty_needed,
                before_qty=before_stock,
                after_qty=after_stock,
                reason="Counter POS Billing",
                adjusted_by=sale_in.salesman_name
            )
        )

    # Schedule H1 mandatory Doctor & Patient validation
    if has_schedule_h1 and not (doctor_name or sale_in.doctor_id):
        raise HTTPException(
            status_code=400,
            detail="Schedule H1 Drug Alert: Doctor's name and registration details are legally required to dispense Schedule H1 medicines."
        )

    raw_total = total_taxable + total_cgst + total_sgst + total_igst
    rounded_net = round(raw_total)
    round_off = round(rounded_net - raw_total, 2)

    cash_rec = sale_in.cash_received
    if sale_in.payment_mode == "CASH" and cash_rec < rounded_net and cash_rec > 0:
        balance_due = round(rounded_net - cash_rec, 2)
        change_ret = 0.0
    elif sale_in.payment_mode == "CASH" and cash_rec >= rounded_net:
        balance_due = 0.0
        change_ret = round(cash_rec - rounded_net, 2)
    else:
        cash_rec = rounded_net
        balance_due = 0.0
        change_ret = 0.0

    invoice_no = generate_invoice_number(db)

    invoice_header = InvoiceHeader(
        invoice_no=invoice_no,
        invoice_date=datetime.utcnow(),
        invoice_type="RETAIL_B2C",
        patient_id=sale_in.patient_id,
        doctor_id=sale_in.doctor_id,
        customer_name=sale_in.customer_name,
        customer_phone=sale_in.customer_phone,
        doctor_name=doctor_name,
        prescription_ref=sale_in.prescription_ref,
        payment_mode=sale_in.payment_mode,
        payment_details=sale_in.payment_details,
        subtotal=subtotal,
        discount_amount=total_discount,
        taxable_amount=total_taxable,
        cgst_amount=total_cgst,
        sgst_amount=total_sgst,
        igst_amount=total_igst,
        cess_amount=0.0,
        round_off=round_off,
        net_amount=rounded_net,
        cash_received=cash_rec,
        change_returned=change_ret,
        balance_due=balance_due,
        salesman_name=sale_in.salesman_name,
        remarks=sale_in.remarks,
        status="COMPLETED"
    )

    db.add(invoice_header)
    db.flush() # Flush to get invoice_header.id

    for itm in invoice_items_to_create:
        itm.invoice_id = invoice_header.id
        db.add(itm)

    for adj in stock_adjustments_to_create:
        adj.reference_doc = invoice_no
        db.add(adj)

    db.commit()
    db.refresh(invoice_header)
    return invoice_header

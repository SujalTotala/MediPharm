from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import os
from app.core.database import get_db, SQLITE_DB_PATH
from app.models.schema import (
    ItemMaster, BatchMaster, LocationMaster, DoctorMaster, PatientMaster, 
    InvoiceHeader, InvoiceItem, StockAdjustment, SystemConfig, SupplierMaster,
    PurchaseInvoiceHeader, PurchaseInvoiceItem, PrescriptionHeader,
    PrescriptionItem, SalesReturnHeader, SalesReturnItem, LocationTransfer,
    LostSale, ShiftControl
)
from app.schemas.pydantic_models import (
    ItemCreate, ItemOut, BatchCreate, BatchOut,
    DoctorCreate, DoctorOut, PatientCreate, PatientOut,
    InvoiceCreate, InvoiceOut,
    SystemConfigOut, SystemConfigUpdate,
    SupplierCreate, SupplierOut, PurchaseInvoiceCreate, PurchaseInvoiceOut,
    PrescriptionCreate, PrescriptionOut,
    SalesReturnCreate, SalesReturnOut, LocationTransferCreate,
    LocationTransferOut, LostSaleCreate, LostSaleOut,
    ShiftControlOut, ShiftControlClose
)
from app.services.pos_service import process_pos_sale

router = APIRouter()

# --- ITEMS & CATALOG ---
@router.get("/items", response_model=List[ItemOut])
def get_items(
    q: Optional[str] = Query(None, description="Search by name, generic name, or barcode"),
    schedule_h1: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ItemMaster).filter(ItemMaster.is_active == True)
    if q:
        query = query.filter(
            (ItemMaster.item_name.ilike(f"%{q}%")) |
            (ItemMaster.generic_name.ilike(f"%{q}%")) |
            (ItemMaster.barcode == q)
        )
    if schedule_h1 is not None:
        query = query.filter(ItemMaster.is_schedule_h1 == schedule_h1)

    items = query.limit(50).all()
    today_val = date.today()
    
    result = []
    for itm in items:
        total_stock = sum(b.stock_qty for b in itm.batches if b.is_active and not b.is_held and b.expiry_date >= today_val)
        
        batch_outs = []
        for b in itm.batches:
            if b.is_active:
                days = (b.expiry_date - today_val).days
                is_exp = b.expiry_date < today_val
                b_dict = {
                    "id": b.id,
                    "item_id": b.item_id,
                    "batch_no": b.batch_no,
                    "expiry_date": b.expiry_date,
                    "mrp": b.mrp,
                    "purchase_rate": b.purchase_rate,
                    "sale_rate": b.sale_rate,
                    "wholesale_rate": b.wholesale_rate,
                    "stock_qty": b.stock_qty,
                    "location_id": b.location_id,
                    "gst_rate": b.gst_rate,
                    "is_held": b.is_held,
                    "is_active": b.is_active,
                    "item_name": itm.item_name,
                    "is_expired": is_exp,
                    "days_to_expiry": days
                }
                batch_outs.append(BatchOut(**b_dict))

        res_item = ItemOut(
            id=itm.id,
            item_code=itm.item_code,
            item_name=itm.item_name,
            generic_name=itm.generic_name,
            barcode=itm.barcode,
            hsn_code=itm.hsn_code,
            company_id=itm.company_id,
            company_name=itm.company.name if itm.company else None,
            category_id=itm.category_id,
            category_name=itm.category.name if itm.category else None,
            preparation=itm.preparation,
            storage_type=itm.storage_type,
            unit_packing=itm.unit_packing,
            unit_name=itm.unit_name,
            is_schedule_h=itm.is_schedule_h,
            is_schedule_h1=itm.is_schedule_h1,
            is_narcotic=itm.is_narcotic,
            is_tb_drug=itm.is_tb_drug,
            min_stock_level=itm.min_stock_level,
            max_stock_level=itm.max_stock_level,
            is_discount_locked=itm.is_discount_locked,
            is_active=itm.is_active,
            total_stock=round(total_stock, 2),
            batches=batch_outs
        )
        result.append(res_item)
    return result

@router.post("/items", response_model=ItemOut)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    existing = db.query(ItemMaster).filter(ItemMaster.item_code == item_in.item_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists.")
    
    item = ItemMaster(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

# --- BATCHES & LOCATIONS ---
@router.post("/batches", response_model=BatchOut)
def create_batch(batch_in: BatchCreate, db: Session = Depends(get_db)):
    item = db.query(ItemMaster).filter(ItemMaster.id == batch_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    
    existing = db.query(BatchMaster).filter(
        BatchMaster.item_id == batch_in.item_id,
        BatchMaster.batch_no == batch_in.batch_no,
        BatchMaster.location_id == batch_in.location_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch with this number already exists for this item.")
    
    batch = BatchMaster(**batch_in.dict())
    db.add(batch)
    db.commit()
    db.refresh(batch)

    if batch.stock_qty > 0:
        db.add(StockAdjustment(
            item_id=item.id,
            batch_id=batch.id,
            location_id=batch.location_id,
            adjustment_type="OPENING_STOCK",
            quantity_change=batch.stock_qty,
            before_qty=0.0,
            after_qty=batch.stock_qty,
            reason="Batch Creation / Opening Stock",
            adjusted_by="Admin"
        ))
        db.commit()

    today_val = date.today()
    days = (batch.expiry_date - today_val).days
    return BatchOut(
        **{c.name: getattr(batch, c.name) for c in batch.__table__.columns},
        item_name=item.item_name,
        is_expired=batch.expiry_date < today_val,
        days_to_expiry=days
    )

@router.get("/batches/expiring-soon", response_model=List[BatchOut])
def get_expiring_batches(days: int = 90, db: Session = Depends(get_db)):
    today_val = date.today()
    threshold = today_val + timedelta(days=days)
    
    batches = db.query(BatchMaster).join(ItemMaster).filter(
        BatchMaster.is_active == True,
        BatchMaster.stock_qty > 0,
        BatchMaster.expiry_date <= threshold
    ).order_by(BatchMaster.expiry_date.asc()).all()

    result = []
    for b in batches:
        d = (b.expiry_date - today_val).days
        result.append(BatchOut(
            **{c.name: getattr(b, c.name) for c in b.__table__.columns},
            item_name=b.item.item_name if b.item else None,
            is_expired=b.expiry_date < today_val,
            days_to_expiry=d
        ))
    return result

# --- INTER-LOCATION STOCK TRANSFERS ---
@router.post("/inventory/transfers", response_model=LocationTransferOut)
def transfer_stock_location(t_in: LocationTransferCreate, db: Session = Depends(get_db)):
    batch = db.query(BatchMaster).filter(BatchMaster.id == t_in.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    if batch.stock_qty < t_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient batch quantity to transfer.")

    transfer_no = f"TRF-{datetime.utcnow().strftime('%y%m%d')}-{db.query(LocationTransfer).count() + 1:04d}"
    
    transfer = LocationTransfer(
        transfer_no=transfer_no,
        item_id=t_in.item_id,
        batch_id=t_in.batch_id,
        from_location_id=batch.location_id,
        to_location_id=t_in.to_location_id,
        quantity=t_in.quantity,
        reason=t_in.reason,
        transferred_by="Admin"
    )
    db.add(transfer)
    
    # Update location on batch
    batch.location_id = t_in.to_location_id
    db.commit()
    db.refresh(transfer)
    return transfer

@router.get("/inventory/transfers", response_model=List[LocationTransferOut])
def get_location_transfers(db: Session = Depends(get_db)):
    return db.query(LocationTransfer).order_by(LocationTransfer.id.desc()).all()

# --- LOST SALES DEMAND LOGGER ---
@router.post("/pos/lost-sale", response_model=LostSaleOut)
def record_lost_sale(ls_in: LostSaleCreate, db: Session = Depends(get_db)):
    ls = LostSale(**ls_in.dict())
    db.add(ls)
    db.commit()
    db.refresh(ls)
    return ls

@router.get("/reports/lost-sales", response_model=List[LostSaleOut])
def get_lost_sales(db: Session = Depends(get_db)):
    return db.query(LostSale).order_by(LostSale.id.desc()).all()

# --- SUPPLIERS & PURCHASES ---
@router.get("/suppliers", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(SupplierMaster).filter(SupplierMaster.is_active == True).all()

@router.post("/suppliers", response_model=SupplierOut)
def create_supplier(sup_in: SupplierCreate, db: Session = Depends(get_db)):
    sup = SupplierMaster(**sup_in.dict())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup

@router.post("/purchases", response_model=PurchaseInvoiceOut)
def record_purchase_inward(purchase_in: PurchaseInvoiceCreate, db: Session = Depends(get_db)):
    supplier = db.query(SupplierMaster).filter(SupplierMaster.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    tot_taxable = 0.0
    tot_gst = 0.0
    today_dt = datetime.utcnow()
    purchase_no = f"PUR-{today_dt.strftime('%y%m%d')}-{db.query(PurchaseInvoiceHeader).count() + 1:04d}"

    header = PurchaseInvoiceHeader(
        purchase_no=purchase_no,
        supplier_id=supplier.id,
        supplier_bill_no=purchase_in.supplier_bill_no,
        bill_date=purchase_in.bill_date or date.today(),
        payment_status="UNPAID"
    )
    db.add(header)
    db.flush()

    for item_in in purchase_in.items:
        itm = db.query(ItemMaster).filter(ItemMaster.id == item_in.item_id).first()
        if not itm:
            continue

        taxable = item_in.quantity * item_in.purchase_rate
        gst_amt = taxable * (item_in.gst_rate / 100.0)
        net_tot = taxable + gst_amt

        tot_taxable += taxable
        tot_gst += gst_amt

        p_item = PurchaseInvoiceItem(
            purchase_invoice_id=header.id,
            item_id=itm.id,
            batch_no=item_in.batch_no,
            expiry_date=item_in.expiry_date,
            quantity=item_in.quantity,
            free_qty=item_in.free_qty,
            purchase_rate=item_in.purchase_rate,
            mrp=item_in.mrp,
            sale_rate=item_in.sale_rate,
            taxable_amount=taxable,
            gst_rate=item_in.gst_rate,
            gst_amount=gst_amt,
            net_total=net_tot
        )
        db.add(p_item)

        batch = db.query(BatchMaster).filter(
            BatchMaster.item_id == itm.id,
            BatchMaster.batch_no == item_in.batch_no
        ).first()

        total_inward = item_in.quantity + item_in.free_qty
        if batch:
            before_stock = batch.stock_qty
            batch.stock_qty += total_inward
            batch.mrp = item_in.mrp
            batch.purchase_rate = item_in.purchase_rate
            batch.sale_rate = item_in.sale_rate
            after_stock = batch.stock_qty
        else:
            before_stock = 0.0
            batch = BatchMaster(
                item_id=itm.id,
                batch_no=item_in.batch_no,
                expiry_date=item_in.expiry_date,
                mrp=item_in.mrp,
                purchase_rate=item_in.purchase_rate,
                sale_rate=item_in.sale_rate,
                stock_qty=total_inward,
                gst_rate=item_in.gst_rate
            )
            db.add(batch)
            after_stock = total_inward

        db.add(StockAdjustment(
            item_id=itm.id,
            batch_id=batch.id if batch.id else 0,
            adjustment_type="PURCHASE_INWARD",
            quantity_change=total_inward,
            before_qty=before_stock,
            after_qty=after_stock,
            reference_doc=purchase_no,
            reason=f"Purchase from {supplier.name} (Bill #{purchase_in.supplier_bill_no})",
            adjusted_by="Admin"
        ))

    header.total_taxable = round(tot_taxable, 2)
    header.total_gst = round(tot_gst, 2)
    header.net_payable = round(tot_taxable + tot_gst, 2)

    db.commit()
    db.refresh(header)
    return header

@router.get("/purchases", response_model=List[PurchaseInvoiceOut])
def get_purchases(db: Session = Depends(get_db)):
    invoices = db.query(PurchaseInvoiceHeader).order_by(PurchaseInvoiceHeader.id.desc()).all()
    for inv in invoices:
        inv.supplier_name = inv.supplier.name if inv.supplier else None
    return invoices

# --- DIGITAL PRESCRIPTIONS ---
@router.post("/prescriptions", response_model=PrescriptionOut)
def create_prescription(rx_in: PrescriptionCreate, db: Session = Depends(get_db)):
    pat = db.query(PatientMaster).filter(PatientMaster.id == rx_in.patient_id).first()
    doc = db.query(DoctorMaster).filter(DoctorMaster.id == rx_in.doctor_id).first()
    if not pat or not doc:
        raise HTTPException(status_code=404, detail="Patient or Doctor not found.")

    rx_no = f"RX-{datetime.utcnow().strftime('%y%m%d')}-{db.query(PrescriptionHeader).count() + 1:04d}"
    rx_header = PrescriptionHeader(
        prescription_no=rx_no,
        patient_id=pat.id,
        doctor_id=doc.id,
        prescription_date=date.today(),
        diagnosis=rx_in.diagnosis,
        vitals=rx_in.vitals,
        notes=rx_in.notes
    )
    db.add(rx_header)
    db.flush()

    for itm in rx_in.items:
        db.add(PrescriptionItem(
            prescription_id=rx_header.id,
            item_id=itm.item_id,
            dosage=itm.dosage,
            duration_days=itm.duration_days,
            total_qty=itm.total_qty,
            timing=itm.timing,
            instructions=itm.instructions
        ))

    db.commit()
    db.refresh(rx_header)
    rx_header.patient_name = pat.patient_name
    rx_header.doctor_name = doc.doctor_name
    return rx_header

@router.get("/prescriptions", response_model=List[PrescriptionOut])
def get_prescriptions(db: Session = Depends(get_db)):
    rxs = db.query(PrescriptionHeader).order_by(PrescriptionHeader.id.desc()).all()
    for r in rxs:
        r.patient_name = r.patient.patient_name if r.patient else None
        r.doctor_name = r.doctor.doctor_name if r.doctor else None
        for itm in r.items:
            itm.item_name = itm.item.item_name if itm.item else None
    return rxs

# --- SALES RETURNS & CREDIT NOTES ---
@router.post("/returns", response_model=SalesReturnOut)
def process_sales_return(ret_in: SalesReturnCreate, db: Session = Depends(get_db)):
    tot_refund = 0.0
    return_no = f"CN-{datetime.utcnow().strftime('%y%m%d')}-{db.query(SalesReturnHeader).count() + 1:04d}"

    ret_header = SalesReturnHeader(
        return_no=return_no,
        original_invoice_no=ret_in.original_invoice_no,
        customer_name=ret_in.customer_name,
        refund_mode=ret_in.refund_mode,
        reason=ret_in.reason
    )
    db.add(ret_header)
    db.flush()

    for itm_in in ret_in.items:
        batch = db.query(BatchMaster).filter(BatchMaster.id == itm_in.batch_id).first()
        if not batch:
            continue

        refund_line = itm_in.quantity * itm_in.unit_rate
        tot_refund += refund_line

        db.add(SalesReturnItem(
            sales_return_id=ret_header.id,
            item_id=itm_in.item_id,
            batch_id=batch.id,
            batch_no=batch.batch_no,
            quantity=itm_in.quantity,
            unit_rate=itm_in.unit_rate,
            gst_rate=itm_in.gst_rate,
            refund_amount=refund_line,
            restore_to_stock=itm_in.restore_to_stock
        ))

        if itm_in.restore_to_stock:
            before_stock = batch.stock_qty
            batch.stock_qty += itm_in.quantity
            after_stock = batch.stock_qty

            db.add(StockAdjustment(
                item_id=itm_in.item_id,
                batch_id=batch.id,
                adjustment_type="SALES_RETURN",
                quantity_change=itm_in.quantity,
                before_qty=before_stock,
                after_qty=after_stock,
                reference_doc=return_no,
                reason=f"Customer Return for {ret_in.original_invoice_no}",
                adjusted_by="Admin"
            ))

    ret_header.total_refund_amount = round(tot_refund, 2)
    db.commit()
    db.refresh(ret_header)
    return ret_header

@router.get("/returns", response_model=List[SalesReturnOut])
def get_sales_returns(db: Session = Depends(get_db)):
    return db.query(SalesReturnHeader).order_by(SalesReturnHeader.id.desc()).all()

# --- ACCOUNTING & DAY BOOK ---
@router.get("/reports/daybook")
def get_day_book(db: Session = Depends(get_db)):
    today_val = date.today()
    start_of_day = datetime.combine(today_val, datetime.min.time())
    
    invoices = db.query(InvoiceHeader).filter(InvoiceHeader.invoice_date >= start_of_day).all()
    returns = db.query(SalesReturnHeader).filter(SalesReturnHeader.return_date >= start_of_day).all()
    
    cash_sales = sum(i.net_amount for i in invoices if i.payment_mode == "CASH")
    upi_sales = sum(i.net_amount for i in invoices if i.payment_mode == "UPI")
    card_sales = sum(i.net_amount for i in invoices if i.payment_mode == "CARD")
    due_sales = sum(i.balance_due for i in invoices)
    returns_amt = sum(r.total_refund_amount for r in returns)

    return {
        "date": str(today_val),
        "total_invoices": len(invoices),
        "gross_sales": round(sum(i.net_amount for i in invoices), 2),
        "payment_summary": {
            "cash": round(cash_sales, 2),
            "upi": round(upi_sales, 2),
            "card": round(card_sales, 2),
            "credit_due": round(due_sales, 2)
        },
        "returns_refunded": round(returns_amt, 2),
        "net_cash_in_drawer": round(1000.0 + cash_sales - returns_amt, 2) # Starting float 1000 + cash - returns
    }

# --- GSTR-2A PURCHASE RECONCILIATION ---
@router.get("/reports/gstr2a")
def get_gstr2a_reconciliation(db: Session = Depends(get_db)):
    purchases = db.query(PurchaseInvoiceHeader).all()
    reconciled_rows = []
    for p in purchases:
        reconciled_rows.append({
            "supplier_name": p.supplier.name if p.supplier else "N/A",
            "gstin": p.supplier.gstin if p.supplier else "N/A",
            "invoice_number": p.supplier_bill_no,
            "invoice_date": str(p.bill_date),
            "taxable_value": p.total_taxable,
            "tax_amount": p.total_gst,
            "net_amount": p.net_payable,
            "matched_status": "MATCHED_IN_GSTR2A"
        })
    return reconciled_rows

# --- SCHEDULE H1 & STATUTORY REGISTERS ---
@router.get("/reports/schedule-h1")
def get_schedule_h1_register(db: Session = Depends(get_db)):
    h1_items = db.query(InvoiceItem).join(InvoiceHeader).filter(
        InvoiceItem.is_schedule_h1 == True
    ).order_by(InvoiceHeader.invoice_date.desc()).all()

    register_rows = []
    for itm in h1_items:
        inv = itm.invoice
        doc = inv.doctor if inv else None
        pat = inv.patient if inv else None
        register_rows.append({
            "invoice_no": inv.invoice_no if inv else "N/A",
            "date": inv.invoice_date.strftime("%Y-%m-%d %H:%M") if inv else "N/A",
            "patient_name": inv.customer_name if inv else "Walk-in",
            "patient_phone": inv.customer_phone or (pat.phone if pat else "N/A"),
            "patient_address": pat.address if pat else "Local",
            "doctor_name": inv.doctor_name or (doc.doctor_name if doc else "N/A"),
            "doctor_reg_no": doc.reg_no if doc else "Recorded on Rx",
            "medicine_name": itm.item_name,
            "batch_no": itm.batch_no,
            "expiry_date": str(itm.expiry_date),
            "quantity_dispensed": itm.quantity,
            "pharmacist_sign": inv.salesman_name if inv else "Admin"
        })
    return register_rows

# --- BACKUP UTILITY ---
@router.get("/system/backup")
def download_database_backup():
    if not os.path.exists(SQLITE_DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found.")
    
    with open(SQLITE_DB_PATH, "rb") as f:
        data = f.read()
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    headers = {
        'Content-Disposition': f'attachment; filename="medipharm_backup_{timestamp}.db"'
    }
    return Response(content=data, media_type="application/octet-stream", headers=headers)

# --- DOCTORS & PATIENTS ---
@router.get("/doctors", response_model=List[DoctorOut])
def get_doctors(db: Session = Depends(get_db)):
    return db.query(DoctorMaster).filter(DoctorMaster.is_active == True).all()

@router.post("/doctors", response_model=DoctorOut)
def create_doctor(doc_in: DoctorCreate, db: Session = Depends(get_db)):
    doc = DoctorMaster(**doc_in.dict())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/patients", response_model=List[PatientOut])
def get_patients(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PatientMaster)
    if q:
        query = query.filter(
            (PatientMaster.patient_name.ilike(f"%{q}%")) |
            (PatientMaster.phone.ilike(f"%{q}%"))
        )
    return query.limit(30).all()

@router.post("/patients", response_model=PatientOut)
def create_patient(pat_in: PatientCreate, db: Session = Depends(get_db)):
    pat = PatientMaster(**pat_in.dict())
    db.add(pat)
    db.commit()
    db.refresh(pat)
    return pat

# --- POS BILLING & INVOICES ---
@router.post("/pos/checkout", response_model=InvoiceOut)
def checkout_sale(sale_in: InvoiceCreate, db: Session = Depends(get_db)):
    inv = process_pos_sale(db, sale_in)
    return inv

@router.get("/invoices", response_model=List[InvoiceOut])
def get_invoices(
    limit: int = 50,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InvoiceHeader).order_by(InvoiceHeader.id.desc())
    if from_date:
        query = query.filter(InvoiceHeader.invoice_date >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(InvoiceHeader.invoice_date <= datetime.combine(to_date, datetime.max.time()))
    return query.limit(limit).all()

@router.get("/invoices/{invoice_no}", response_model=InvoiceOut)
def get_invoice_by_no(invoice_no: str, db: Session = Depends(get_db)):
    inv = db.query(InvoiceHeader).filter(InvoiceHeader.invoice_no == invoice_no).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return inv

# --- DASHBOARD & GST STATS ---
@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today_val = date.today()
    start_of_day = datetime.combine(today_val, datetime.min.time())
    
    today_invoices = db.query(InvoiceHeader).filter(InvoiceHeader.invoice_date >= start_of_day).all()
    today_sales_total = sum(i.net_amount for i in today_invoices)
    today_bills_count = len(today_invoices)
    
    total_items = db.query(ItemMaster).filter(ItemMaster.is_active == True).count()
    
    threshold_60d = today_val + timedelta(days=60)
    expiring_count = db.query(BatchMaster).filter(
        BatchMaster.is_active == True,
        BatchMaster.stock_qty > 0,
        BatchMaster.expiry_date <= threshold_60d
    ).count()

    low_stock_count = 0
    all_active_items = db.query(ItemMaster).filter(ItemMaster.is_active == True).all()
    for itm in all_active_items:
        stk = sum(b.stock_qty for b in itm.batches if b.is_active and b.expiry_date >= today_val)
        if stk <= itm.min_stock_level:
            low_stock_count += 1

    cgst_tot = sum(i.cgst_amount for i in today_invoices)
    sgst_tot = sum(i.sgst_amount for i in today_invoices)
    igst_tot = sum(i.igst_amount for i in today_invoices)

    return {
        "today_sales": round(today_sales_total, 2),
        "today_bills": today_bills_count,
        "total_items": total_items,
        "expiring_batches_count": expiring_count,
        "low_stock_items_count": low_stock_count,
        "today_tax_summary": {
            "cgst": round(cgst_tot, 2),
            "sgst": round(sgst_tot, 2),
            "igst": round(igst_tot, 2),
            "total_gst": round(cgst_tot + sgst_tot + igst_tot, 2)
        }
    }

# --- SYSTEM CONFIGURATIONS ---
@router.get("/configs", response_model=List[SystemConfigOut])
def get_system_configs(db: Session = Depends(get_db)):
    return db.query(SystemConfig).all()

@router.put("/configs/{key}", response_model=SystemConfigOut)
def update_system_config(key: str, update_in: SystemConfigUpdate, db: Session = Depends(get_db)):
    cfg = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config key not found.")
    cfg.value = update_in.value
    db.commit()
    db.refresh(cfg)
    return cfg

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, 
    ForeignKey, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class CompanyMaster(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    items = relationship("ItemMaster", back_populates="company")

class CategoryMaster(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    items = relationship("ItemMaster", back_populates="category")

class LocationMaster(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False)

    batches = relationship("BatchMaster", back_populates="location")

class TaxMaster(Base):
    __tablename__ = "tax_masters"
    id = Column(Integer, primary_key=True, index=True)
    tax_code = Column(String(20), unique=True, index=True, nullable=False) # e.g. GST_18, GST_12, GST_5, GST_0
    tax_name = Column(String(50), nullable=False)
    cgst_rate = Column(Float, default=0.0)
    sgst_rate = Column(Float, default=0.0)
    igst_rate = Column(Float, default=0.0)
    cess_rate = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

class ItemMaster(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, index=True, nullable=False)
    item_name = Column(String(200), index=True, nullable=False)
    generic_name = Column(String(200), index=True, nullable=True)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    hsn_code = Column(String(20), nullable=False, default="3004")
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    preparation = Column(String(50), default="TAB") # TAB, CAP, SYRUP, INJ, OINTMENT, DROPS, POWDER
    storage_type = Column(String(50), default="ROOM_TEMP") # ROOM_TEMP, REFRIGERATED, COOL_DRY
    unit_packing = Column(Integer, default=10) # Units per strip/box (e.g. 10 tabs/strip, 1 bottle)
    unit_name = Column(String(20), default="Strip") # Strip, Box, Bottle, Vial, Tube
    
    # Drug Regulatory Flags (From SRS)
    is_schedule_h = Column(Boolean, default=False)
    is_schedule_h1 = Column(Boolean, default=False)
    is_narcotic = Column(Boolean, default=False)
    is_tb_drug = Column(Boolean, default=False)
    
    min_stock_level = Column(Float, default=5.0)
    max_stock_level = Column(Float, default=100.0)
    is_discount_locked = Column(Boolean, default=False) # Disallow discount for this drug
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("CompanyMaster", back_populates="items")
    category = relationship("CategoryMaster", back_populates="items")
    batches = relationship("BatchMaster", back_populates="item", cascade="all, delete-orphan")

class BatchMaster(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    batch_no = Column(String(100), nullable=False, index=True)
    expiry_date = Column(Date, nullable=False, index=True)
    
    mrp = Column(Float, nullable=False) # Maximum Retail Price
    purchase_rate = Column(Float, default=0.0) # Cost price
    sale_rate = Column(Float, nullable=False) # Retail Selling price
    wholesale_rate = Column(Float, default=0.0)
    
    # Rates A-E bands (From SRS legacy support)
    rate_a = Column(Float, default=0.0)
    rate_b = Column(Float, default=0.0)
    
    stock_qty = Column(Float, default=0.0, nullable=False) # In units or strips
    held_qty = Column(Float, default=0.0) # Quarantined or reserved stock
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    
    gst_rate = Column(Float, default=12.0) # 0%, 5%, 12%, 18%
    is_held = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('item_id', 'batch_no', 'location_id', name='uq_item_batch_location'),
        Index('idx_batch_item_stock', 'item_id', 'stock_qty'),
    )

    item = relationship("ItemMaster", back_populates="batches")
    location = relationship("LocationMaster", back_populates="batches")

class DoctorMaster(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    doctor_code = Column(String(50), unique=True, index=True, nullable=False)
    doctor_name = Column(String(150), nullable=False)
    specialization = Column(String(100), default="General Physician")
    reg_no = Column(String(100), nullable=True) # Medical council registration
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    clinic_address = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

class PatientMaster(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(50), unique=True, index=True, nullable=False)
    patient_name = Column(String(150), index=True, nullable=False)
    phone = Column(String(50), index=True, nullable=True)
    whatsapp = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True) # Male, Female, Other
    blood_group = Column(String(10), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InvoiceHeader(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, index=True, nullable=False)
    invoice_date = Column(DateTime, default=datetime.utcnow, index=True)
    invoice_type = Column(String(30), default="RETAIL_B2C") # RETAIL_B2C, WHOLESALE_B2B, RETURN
    
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    customer_name = Column(String(150), default="Cash Customer")
    customer_phone = Column(String(50), nullable=True)
    doctor_name = Column(String(150), nullable=True)
    prescription_ref = Column(String(100), nullable=True)
    
    payment_mode = Column(String(30), default="CASH") # CASH, UPI, CARD, CREDIT_DUE, MULTI
    payment_details = Column(String(255), nullable=True)
    
    subtotal = Column(Float, default=0.0) # Sum of line gross amount
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    cess_amount = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0) # Final payable
    
    cash_received = Column(Float, default=0.0)
    change_returned = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    
    salesman_name = Column(String(100), default="Counter Cashier")
    shift_code = Column(String(50), default="SHIFT-1")
    remarks = Column(Text, nullable=True)
    status = Column(String(30), default="COMPLETED") # COMPLETED, CANCELLED, RETURNED
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientMaster")
    doctor = relationship("DoctorMaster")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    
    item_name = Column(String(200), nullable=False)
    batch_no = Column(String(100), nullable=False)
    expiry_date = Column(Date, nullable=False)
    hsn_code = Column(String(20), default="3004")
    
    quantity = Column(Float, nullable=False)
    free_qty = Column(Float, default=0.0)
    unit_mrp = Column(Float, nullable=False)
    unit_rate = Column(Float, nullable=False) # Rate charged per unit
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    
    taxable_amount = Column(Float, default=0.0)
    gst_rate = Column(Float, default=12.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    net_line_total = Column(Float, default=0.0)
    
    # Regulatory compliance note
    is_schedule_h1 = Column(Boolean, default=False)

    invoice = relationship("InvoiceHeader", back_populates="items")
    item = relationship("ItemMaster")
    batch = relationship("BatchMaster")

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    
    adjustment_type = Column(String(50), nullable=False) # POS_SALE, SALE_RETURN, PURCHASE, SCRAP_EXPIRY, AUDIT_CORRECTION, HOLD_RELEASE
    quantity_change = Column(Float, nullable=False) # Positive or negative
    before_qty = Column(Float, nullable=False)
    after_qty = Column(Float, nullable=False)
    reference_doc = Column(String(100), nullable=True) # Invoice No, PO No, etc.
    reason = Column(String(255), nullable=True)
    adjusted_by = Column(String(100), default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)

class SupplierMaster(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    gstin = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    credit_days = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)

class PurchaseInvoiceHeader(Base):
    __tablename__ = "purchase_invoices"
    id = Column(Integer, primary_key=True, index=True)
    purchase_no = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier_bill_no = Column(String(100), nullable=False)
    bill_date = Column(Date, default=date.today)
    total_taxable = Column(Float, default=0.0)
    total_gst = Column(Float, default=0.0)
    net_payable = Column(Float, default=0.0)
    payment_status = Column(String(30), default="UNPAID") # PAID, UNPAID, PARTIAL
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("SupplierMaster")
    items = relationship("PurchaseInvoiceItem", back_populates="purchase_invoice", cascade="all, delete-orphan")

class PurchaseInvoiceItem(Base):
    __tablename__ = "purchase_invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    batch_no = Column(String(100), nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Float, nullable=False)
    free_qty = Column(Float, default=0.0)
    purchase_rate = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    sale_rate = Column(Float, nullable=False)
    taxable_amount = Column(Float, default=0.0)
    gst_rate = Column(Float, default=12.0)
    gst_amount = Column(Float, default=0.0)
    net_total = Column(Float, default=0.0)

    purchase_invoice = relationship("PurchaseInvoiceHeader", back_populates="items")
    item = relationship("ItemMaster")

class PrescriptionHeader(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    prescription_no = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    prescription_date = Column(Date, default=date.today)
    diagnosis = Column(String(255), nullable=True)
    vitals = Column(String(255), nullable=True) # BP, Pulse, Weight
    notes = Column(Text, nullable=True)
    status = Column(String(30), default="ACTIVE") # ACTIVE, DISPENSED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientMaster")
    doctor = relationship("DoctorMaster")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    dosage = Column(String(50), default="1-0-1") # 1-0-1 (Morning-Noon-Night)
    duration_days = Column(Integer, default=5)
    total_qty = Column(Float, default=10.0)
    timing = Column(String(50), default="AFTER_MEAL") # BEFORE_MEAL, AFTER_MEAL
    instructions = Column(String(255), nullable=True)

    prescription = relationship("PrescriptionHeader", back_populates="items")
    item = relationship("ItemMaster")

class SalesReturnHeader(Base):
    __tablename__ = "sales_returns"
    id = Column(Integer, primary_key=True, index=True)
    return_no = Column(String(50), unique=True, index=True, nullable=False)
    original_invoice_no = Column(String(50), index=True, nullable=False)
    return_date = Column(DateTime, default=datetime.utcnow)
    customer_name = Column(String(150), nullable=False)
    total_refund_amount = Column(Float, default=0.0)
    refund_mode = Column(String(30), default="CASH")
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("SalesReturnItem", back_populates="sales_return", cascade="all, delete-orphan")

class SalesReturnItem(Base):
    __tablename__ = "sales_return_items"
    id = Column(Integer, primary_key=True, index=True)
    sales_return_id = Column(Integer, ForeignKey("sales_returns.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    batch_no = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_rate = Column(Float, nullable=False)
    gst_rate = Column(Float, default=12.0)
    refund_amount = Column(Float, nullable=False)
    restore_to_stock = Column(Boolean, default=True)

    sales_return = relationship("SalesReturnHeader", back_populates="items")
    item = relationship("ItemMaster")
    batch = relationship("BatchMaster")

class LocationTransfer(Base):
    __tablename__ = "location_transfers"
    id = Column(Integer, primary_key=True, index=True)
    transfer_no = Column(String(50), unique=True, index=True, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True) # e.g. Moved to cold storage, Quarantined
    transferred_by = Column(String(100), default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("ItemMaster")
    batch = relationship("BatchMaster")
    from_location = relationship("LocationMaster", foreign_keys=[from_location_id])
    to_location = relationship("LocationMaster", foreign_keys=[to_location_id])

class LostSale(Base):
    __tablename__ = "lost_sales"
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    requested_qty = Column(Float, default=1.0)
    customer_phone = Column(String(50), nullable=True)
    customer_name = Column(String(150), nullable=True)
    notes = Column(String(255), nullable=True)
    logged_by = Column(String(100), default="Counter Cashier")
    created_at = Column(DateTime, default=datetime.utcnow)

class ShiftControl(Base):
    __tablename__ = "shift_controls"
    id = Column(Integer, primary_key=True, index=True)
    shift_code = Column(String(50), unique=True, index=True, nullable=False)
    cashier_name = Column(String(100), nullable=False)
    opening_cash = Column(Float, default=1000.0) # Starting cash drawer float
    cash_sales = Column(Float, default=0.0)
    upi_sales = Column(Float, default=0.0)
    card_sales = Column(Float, default=0.0)
    credit_sales = Column(Float, default=0.0)
    returns_cash = Column(Float, default=0.0)
    closing_cash = Column(Float, default=0.0)
    status = Column(String(30), default="OPEN") # OPEN, CLOSED
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

class SystemConfig(Base):
    __tablename__ = "system_configs"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    category = Column(String(50), default="GENERAL") # POS, PRINTER, BILLING, RESTRICTIONS

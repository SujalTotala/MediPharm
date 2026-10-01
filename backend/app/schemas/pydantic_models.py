from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

# Masters
class CompanyBase(BaseModel):
    code: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class CompanyOut(CompanyBase):
    id: int
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    code: str
    name: str
    is_default: bool = False

class LocationOut(LocationBase):
    id: int
    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    supplier_code: str
    name: str
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_days: int = 30
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: int
    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    doctor_code: str
    doctor_name: str
    specialization: Optional[str] = "General Physician"
    reg_no: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    clinic_address: Optional[str] = None
    is_active: bool = True

class DoctorCreate(DoctorBase):
    pass

class DoctorOut(DoctorBase):
    id: int
    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    patient_code: str
    patient_name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = "Male"
    blood_group: Optional[str] = None
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Batches
class BatchBase(BaseModel):
    item_id: int
    batch_no: str
    expiry_date: date
    mrp: float
    purchase_rate: float = 0.0
    sale_rate: float
    wholesale_rate: float = 0.0
    stock_qty: float = 0.0
    location_id: Optional[int] = None
    gst_rate: float = 12.0
    is_held: bool = False
    is_active: bool = True

class BatchCreate(BatchBase):
    pass

class BatchOut(BatchBase):
    id: int
    item_name: Optional[str] = None
    is_expired: Optional[bool] = False
    days_to_expiry: Optional[int] = None
    class Config:
        from_attributes = True

# Items
class ItemBase(BaseModel):
    item_code: str
    item_name: str
    generic_name: Optional[str] = None
    barcode: Optional[str] = None
    hsn_code: str = "3004"
    company_id: Optional[int] = None
    category_id: Optional[int] = None
    preparation: str = "TAB"
    storage_type: str = "ROOM_TEMP"
    unit_packing: int = 10
    unit_name: str = "Strip"
    is_schedule_h: bool = False
    is_schedule_h1: bool = False
    is_narcotic: bool = False
    is_tb_drug: bool = False
    min_stock_level: float = 5.0
    max_stock_level: float = 100.0
    is_discount_locked: bool = False
    is_active: bool = True

class ItemCreate(ItemBase):
    pass

class ItemOut(ItemBase):
    id: int
    company_name: Optional[str] = None
    category_name: Optional[str] = None
    total_stock: Optional[float] = 0.0
    batches: List[BatchOut] = []
    class Config:
        from_attributes = True

# POS Sale & Invoice
class InvoiceItemInput(BaseModel):
    item_id: int
    batch_id: int
    quantity: float
    free_qty: float = 0.0
    unit_rate: Optional[float] = None
    discount_percent: float = 0.0

class InvoiceCreate(BaseModel):
    customer_name: str = "Cash Customer"
    customer_phone: Optional[str] = None
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None
    prescription_ref: Optional[str] = None
    payment_mode: str = "CASH"
    payment_details: Optional[str] = None
    cash_received: float = 0.0
    remarks: Optional[str] = None
    salesman_name: str = "Counter Cashier"
    items: List[InvoiceItemInput]

class InvoiceItemOut(BaseModel):
    id: int
    item_id: int
    batch_id: int
    item_name: str
    batch_no: str
    expiry_date: date
    hsn_code: str
    quantity: float
    free_qty: float
    unit_mrp: float
    unit_rate: float
    discount_percent: float
    discount_amount: float
    taxable_amount: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    net_line_total: float
    is_schedule_h1: bool
    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: int
    invoice_no: str
    invoice_date: datetime
    invoice_type: str
    patient_id: Optional[int]
    doctor_id: Optional[int]
    customer_name: str
    customer_phone: Optional[str]
    doctor_name: Optional[str]
    prescription_ref: Optional[str]
    payment_mode: str
    subtotal: float
    discount_amount: float
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    cess_amount: float
    round_off: float
    net_amount: float
    cash_received: float
    change_returned: float
    balance_due: float
    salesman_name: str
    remarks: Optional[str]
    status: str
    items: List[InvoiceItemOut] = []
    class Config:
        from_attributes = True

# Purchase Invoice
class PurchaseItemInput(BaseModel):
    item_id: int
    batch_no: str
    expiry_date: date
    quantity: float
    free_qty: float = 0.0
    purchase_rate: float
    mrp: float
    sale_rate: float
    gst_rate: float = 12.0

class PurchaseInvoiceCreate(BaseModel):
    supplier_id: int
    supplier_bill_no: str
    bill_date: Optional[date] = None
    items: List[PurchaseItemInput]

class PurchaseInvoiceItemOut(BaseModel):
    id: int
    item_id: int
    batch_no: str
    expiry_date: date
    quantity: float
    free_qty: float
    purchase_rate: float
    mrp: float
    sale_rate: float
    taxable_amount: float
    gst_rate: float
    gst_amount: float
    net_total: float
    class Config:
        from_attributes = True

class PurchaseInvoiceOut(BaseModel):
    id: int
    purchase_no: str
    supplier_id: int
    supplier_bill_no: str
    bill_date: date
    total_taxable: float
    total_gst: float
    net_payable: float
    payment_status: str
    created_at: datetime
    supplier_name: Optional[str] = None
    items: List[PurchaseInvoiceItemOut] = []
    class Config:
        from_attributes = True

# Digital Prescription
class PrescriptionItemInput(BaseModel):
    item_id: int
    dosage: str = "1-0-1"
    duration_days: int = 5
    total_qty: float = 10.0
    timing: str = "AFTER_MEAL"
    instructions: Optional[str] = None

class PrescriptionCreate(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: Optional[str] = None
    vitals: Optional[str] = None
    notes: Optional[str] = None
    items: List[PrescriptionItemInput]

class PrescriptionItemOut(BaseModel):
    id: int
    item_id: int
    item_name: Optional[str] = None
    dosage: str
    duration_days: int
    total_qty: float
    timing: str
    instructions: Optional[str]
    class Config:
        from_attributes = True

class PrescriptionOut(BaseModel):
    id: int
    prescription_no: str
    patient_id: int
    doctor_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    prescription_date: date
    diagnosis: Optional[str]
    vitals: Optional[str]
    notes: Optional[str]
    status: str
    items: List[PrescriptionItemOut] = []
    class Config:
        from_attributes = True

# Sales Return & Credit Notes
class SalesReturnItemInput(BaseModel):
    item_id: int
    batch_id: int
    quantity: float
    unit_rate: float
    gst_rate: float = 12.0
    restore_to_stock: bool = True

class SalesReturnCreate(BaseModel):
    original_invoice_no: str
    customer_name: str
    refund_mode: str = "CASH"
    reason: Optional[str] = "Customer return"
    items: List[SalesReturnItemInput]

class SalesReturnOut(BaseModel):
    id: int
    return_no: str
    original_invoice_no: str
    return_date: datetime
    customer_name: str
    total_refund_amount: float
    refund_mode: str
    reason: Optional[str]
    class Config:
        from_attributes = True

# Stock Adjustment
class StockAdjustmentCreate(BaseModel):
    item_id: int
    batch_id: int
    location_id: Optional[int] = None
    adjustment_type: str
    quantity_change: float
    reason: str
    adjusted_by: str = "Admin"

# Location Transfers
class LocationTransferCreate(BaseModel):
    item_id: int
    batch_id: int
    from_location_id: Optional[int] = None
    to_location_id: int
    quantity: float
    reason: Optional[str] = "Stock Reallocation"

class LocationTransferOut(BaseModel):
    id: int
    transfer_no: str
    item_id: int
    batch_id: int
    from_location_id: Optional[int]
    to_location_id: Optional[int]
    quantity: float
    reason: Optional[str]
    transferred_by: str
    created_at: datetime
    class Config:
        from_attributes = True

# Lost Sales Tracker
class LostSaleCreate(BaseModel):
    item_name: str
    generic_name: Optional[str] = None
    requested_qty: float = 1.0
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None

class LostSaleOut(BaseModel):
    id: int
    item_name: str
    generic_name: Optional[str]
    requested_qty: float
    customer_phone: Optional[str]
    customer_name: Optional[str]
    notes: Optional[str]
    logged_by: str
    created_at: datetime
    class Config:
        from_attributes = True

# Shift & Day Control
class ShiftControlOut(BaseModel):
    id: int
    shift_code: str
    cashier_name: str
    opening_cash: float
    cash_sales: float
    upi_sales: float
    card_sales: float
    credit_sales: float
    returns_cash: float
    closing_cash: float
    status: str
    opened_at: datetime
    closed_at: Optional[datetime]
    class Config:
        from_attributes = True

class ShiftControlClose(BaseModel):
    closing_cash: float

# Configuration
class SystemConfigOut(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str]
    category: str
    class Config:
        from_attributes = True

class SystemConfigUpdate(BaseModel):
    value: str

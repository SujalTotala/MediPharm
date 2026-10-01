export interface Batch {
  id: number;
  item_id: number;
  batch_no: string;
  expiry_date: string;
  mrp: number;
  purchase_rate: number;
  sale_rate: number;
  wholesale_rate: number;
  stock_qty: number;
  location_id?: number | null;
  gst_rate: number;
  is_held: boolean;
  is_active: boolean;
  item_name?: string;
  is_expired?: boolean;
  days_to_expiry?: number;
}

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  generic_name?: string;
  barcode?: string;
  hsn_code: string;
  company_id?: number | null;
  company_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  preparation: string;
  storage_type: string;
  unit_packing: number;
  unit_name: string;
  is_schedule_h: boolean;
  is_schedule_h1: boolean;
  is_narcotic: boolean;
  is_tb_drug: boolean;
  min_stock_level: number;
  max_stock_level: number;
  is_discount_locked: boolean;
  is_active: boolean;
  total_stock: number;
  batches: Batch[];
}

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_days: number;
  is_active: boolean;
}

export interface Doctor {
  id: number;
  doctor_code: string;
  doctor_name: string;
  specialization?: string;
  reg_no?: string;
  phone?: string;
  email?: string;
  clinic_address?: string;
  is_active: boolean;
}

export interface Patient {
  id: number;
  patient_code: string;
  patient_name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  address?: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  item_id: number;
  batch_id: number;
  item_name: string;
  batch_no: string;
  expiry_date: string;
  hsn_code: string;
  quantity: number;
  free_qty: number;
  unit_mrp: number;
  unit_rate: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  net_line_total: number;
  is_schedule_h1: boolean;
  unit_packing?: number;
  unit_name?: string;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_type: string;
  patient_id?: number | null;
  doctor_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  doctor_name?: string | null;
  prescription_ref?: string | null;
  payment_mode: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  round_off: number;
  net_amount: number;
  cash_received: number;
  change_returned: number;
  balance_due: number;
  salesman_name: string;
  remarks?: string | null;
  status: string;
  items: InvoiceItem[];
}

export interface PurchaseItem {
  id?: number;
  item_id: number;
  item_name?: string;
  batch_no: string;
  expiry_date: string;
  quantity: number;
  free_qty: number;
  purchase_rate: number;
  mrp: number;
  sale_rate: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  net_total: number;
}

export interface PurchaseInvoice {
  id: number;
  purchase_no: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_bill_no: string;
  bill_date: string;
  total_taxable: number;
  total_gst: number;
  net_payable: number;
  payment_status: string;
  created_at: string;
  items: PurchaseItem[];
}

export interface PrescriptionItem {
  id?: number;
  item_id: number;
  item_name?: string;
  dosage: string;
  duration_days: number;
  total_qty: number;
  timing: string;
  instructions?: string;
}

export interface Prescription {
  id: number;
  prescription_no: string;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  prescription_date: string;
  diagnosis?: string;
  vitals?: string;
  notes?: string;
  status: string;
  items: PrescriptionItem[];
}

export interface SalesReturnItem {
  id?: number;
  item_id: number;
  batch_id: number;
  batch_no: string;
  quantity: number;
  unit_rate: number;
  gst_rate: number;
  refund_amount: number;
  restore_to_stock: boolean;
}

export interface SalesReturn {
  id: number;
  return_no: string;
  original_invoice_no: string;
  return_date: string;
  customer_name: string;
  total_refund_amount: number;
  refund_mode: string;
  reason?: string;
}

export interface LostSale {
  id: number;
  item_name: string;
  generic_name?: string;
  requested_qty: number;
  customer_phone?: string;
  customer_name?: string;
  notes?: string;
  logged_by: string;
  created_at: string;
}

export interface LocationTransfer {
  id: number;
  transfer_no: string;
  item_id: number;
  batch_id: number;
  from_location_id?: number;
  to_location_id?: number;
  quantity: number;
  reason?: string;
  transferred_by: string;
  created_at: string;
}

export interface ScheduleH1Record {
  invoice_no: string;
  date: string;
  patient_name: string;
  patient_phone: string;
  patient_address: string;
  doctor_name: string;
  doctor_reg_no: string;
  medicine_name: string;
  batch_no: string;
  expiry_date: string;
  quantity_dispensed: number;
  pharmacist_sign: string;
}

export interface DashboardStats {
  today_sales: number;
  today_bills: number;
  total_items: number;
  expiring_batches_count: number;
  low_stock_items_count: number;
  today_tax_summary: {
    cgst: number;
    sgst: number;
    igst: number;
    total_gst: number;
  };
}

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
}

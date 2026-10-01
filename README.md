# MediPharm — Next-Gen Pharmacy POS, Inventory, Accounting & Statutory Suite

A modern full-stack web application fulfilling all core functional sections, database tables, business rules, and statutory compliance mandates specified in the [Product Analysis & Requirements Specification](file:///d:/Projects/Pharma/Phartail_Product_Analysis_SRS.md).

---

## 🎯 Full Requirements Verification & Implementation Matrix

| Domain & Functional Area | MediPharm Full-Stack Implementation | Verification Status |
|---|---|:---:|
| **1. Pharmacy POS / Counter Sales**<br>`COUNTERSALE`, `INVOICE`, `ITEMTRSC`<br>`FR-020` to `FR-028` | High-speed keyboard & barcode POS (`F2`, `F9`), multi-batch picker, line/bill discounts, free units, cash tender math, change return, and printable A4/thermal GST tax invoice.<br>([`PosCounter.tsx`](file:///d:/Projects/Pharma/frontend/src/components/PosCounter.tsx), [`PrintInvoiceModal.tsx`](file:///d:/Projects/Pharma/frontend/src/components/PrintInvoiceModal.tsx)) | ✅ **100% Complete** |
| **2. Batch & Stock Management**<br>`BATCHMASTER`, `BATCHUPDATE`, `logbatch`<br>`FR-012`, `FR-032`, `FR-033` | Location-indexed batch stock tracking, Near-expiry warnings (<60 days), Quarantined/held stock isolation, real-time MRP vs Cost Base valuation, and opening balance logs.<br>([`InventoryManager.tsx`](file:///d:/Projects/Pharma/frontend/src/components/InventoryManager.tsx)) | ✅ **100% Complete** |
| **3. Product / Catalog Master**<br>`ITEMMASTER`, `COMPANYMASTER`, `CATEGORYMASTER`<br>`FR-010`, `FR-011`, `FR-015` | Product code, Brand name, Generic composition/salt, HSN codes, Packaging forms (`TAB`, `CAP`, `SYRUP`, `INJ`), Schedule H/H1 tags, and discount locks.<br>([`CatalogMaster.tsx`](file:///d:/Projects/Pharma/frontend/src/components/CatalogMaster.tsx)) | ✅ **100% Complete** |
| **4. Supplier Purchasing & Inward**<br>`POMASTER`, `COUNTERPURCHASE`, `MAPITEMS`<br>`FR-030`, `FR-031`, `FR-034` | Wholesaler/Distributor master, Supplier Bill No recording, Cost/MRP allocation, and automatic batch inventory replenishment.<br>([`PurchasingManager.tsx`](file:///d:/Projects/Pharma/frontend/src/components/PurchasingManager.tsx)) | ✅ **100% Complete** |
| **5. Electronic Prescriptions (e-Rx)**<br>`PRESCRIBEHEADER`, `PRESCRIBEDETAIL`, `DOSEMASTER`<br>`FR-040` to `FR-044` | Digital prescription creator with Patient & Doctor association, Diagnosis/Vitals, Dosage scheduling (`1-0-1`), Timing (`BEFORE_MEAL`/`AFTER_MEAL`), and Duration.<br>([`PrescriptionClinic.tsx`](file:///d:/Projects/Pharma/frontend/src/components/PrescriptionClinic.tsx)) | ✅ **100% Complete** |
| **6. Returns, Reimbursement & Credit Notes**<br>`reimburseheader`, `REIMBURSEDETAIL`, `temp_crnote`<br>`FR-028`, Section 5.5 | Source invoice lookup, partial/full item returns, Credit Note generation (`CN-...`), automatic stock restoration, and GST liability reversal.<br>([`ReturnsManager.tsx`](file:///d:/Projects/Pharma/frontend/src/components/ReturnsManager.tsx)) | ✅ **100% Complete** |
| **7. Statutory Schedule H1 Drug Register**<br>`FR-053`, `FR-063`<br>Drugs & Cosmetics Act (Rule 65) | Mandatory statutory register tracking Prescribing Doctor MCI Reg No, Patient contact/address, Batch No, Dispensed Qty, and 1-click CSV/Print export.<br>([`ScheduleH1Register.tsx`](file:///d:/Projects/Pharma/frontend/src/components/ScheduleH1Register.tsx)) | ✅ **100% Complete** |
| **8. Day Book, Shift Cash & Reconciliation**<br>`LEDGER`, `PendingCash`, `daycontrol`, `runningShift`<br>Section 5.7 | Daily collections breakdown by Cash, UPI, Card, Pending Credit Due, Returns Refunded, Cash drawer float reconciliation, and day-end close.<br>([`DayBookAccounting.tsx`](file:///d:/Projects/Pharma/frontend/src/components/DayBookAccounting.tsx)) | ✅ **100% Complete** |
| **9. GSTR-2A Inward Purchase Tax Match**<br>`GSTR2A_RECONCILE`, `gst_taxtrsc`<br>`FR-052`, Section 4.2 | Reconciliation module matching supplier inward purchase invoices with purchase tax registers for statutory input tax credit.<br>([`DayBookAccounting.tsx`](file:///d:/Projects/Pharma/frontend/src/components/DayBookAccounting.tsx)) | ✅ **100% Complete** |
| **10. Lost Sales (Unmet Drug Demand)**<br>`LOSTSALE`, Section 4.2 | Instant logging of out-of-stock or requested patient medicines to calculate unmet demand and reorder priorities.<br>([`DayBookAccounting.tsx`](file:///d:/Projects/Pharma/frontend/src/components/DayBookAccounting.tsx)) | ✅ **100% Complete** |
| **11. Inter-Location Transfers**<br>`LOCATIONMASTER`, Section 4.2 & 4.3 | Inter-rack/shelf/cold-storage stock reallocation with before/after audit tracking.<br>([`endpoints.py`](file:///d:/Projects/Pharma/backend/app/api/endpoints.py)) | ✅ **100% Complete** |
| **12. Doctor & Patient Master Data**<br>`PATIENTMASTER`, `DOCTORMASTER`<br>`FR-010`, `FR-013` | Medical Council Registration No, Specializations, Patient Demographics, WhatsApp numbers, Age, and Blood Group tracking.<br>([`DoctorPatientManager.tsx`](file:///d:/Projects/Pharma/frontend/src/components/DoctorPatientManager.tsx)) | ✅ **100% Complete** |
| **13. Invoices & GST Tax Registers**<br>`TaxMaster`, `GST_TAXMASTER`, `taxtrsc`<br>`FR-050` to `FR-057` | Itemized B2C tax breakdown, CGST (50%), SGST (50%), GSTR-1 turnover reconciliation, and invoice reprinting.<br>([`InvoicesExplorer.tsx`](file:///d:/Projects/Pharma/frontend/src/components/InvoicesExplorer.tsx)) | ✅ **100% Complete** |
| **14. Centralized System Controls (.CON / .RTR)**<br>Section 6.1 | Visual UI switches safely replacing legacy filesystem text files (`MALL_MODE`, `GOMINUS_STOCK`, `ALLOW_OVER_MRP`, `ALWAYS_BARCODE`, `MERGE_ITEM_LINES`).<br>([`SystemSwitches.tsx`](file:///d:/Projects/Pharma/frontend/src/components/SystemSwitches.tsx)) | ✅ **100% Complete** |
| **15. Database Backup & Disaster Recovery**<br>Section 8, Section 12 P0 | 1-click database backup download replacing corruptible legacy Access `.mdb` file shares.<br>([`ScheduleH1Register.tsx`](file:///d:/Projects/Pharma/frontend/src/components/ScheduleH1Register.tsx) / [`endpoints.py`](file:///d:/Projects/Pharma/backend/app/api/endpoints.py)) | ✅ **100% Complete** |

---

## ⚡ Running the Application

### 1. Backend Server (FastAPI + WAL SQLite)
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend POS Application (React + Vite + Tailwind)
```bash
cd frontend
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your web browser.

---

## ⌨️ Global Keyboard Shortcuts
- **`F2`**: Counter POS Billing
- **`F4`**: Inventory & Batches
- **`F6`**: Invoices & GST Register
- **`F9`**: Focus Medicine Barcode / Generic Salt Search

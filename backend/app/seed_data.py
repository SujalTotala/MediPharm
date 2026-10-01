from datetime import date, timedelta
from app.core.database import SessionLocal, engine, Base
from app.models.schema import (
    CompanyMaster, CategoryMaster, LocationMaster, TaxMaster,
    ItemMaster, BatchMaster, DoctorMaster, PatientMaster, SystemConfig
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(ItemMaster).first():
        print("Database already has data. Skipping seed.")
        db.close()
        return

    print("Seeding Phartail database...")

    # 1. Companies
    c1 = CompanyMaster(code="SUN", name="Sun Pharmaceutical Industries", contact_person="Ramesh Gupta", phone="9876543210")
    c2 = CompanyMaster(code="CIPLA", name="Cipla Ltd", contact_person="Anil Mehta", phone="9876543211")
    c3 = CompanyMaster(code="DRREDDY", name="Dr. Reddy's Laboratories", contact_person="Suresh Rao", phone="9876543212")
    c4 = CompanyMaster(code="MANKIND", name="Mankind Pharma Ltd", contact_person="Deepak Verma", phone="9876543213")
    c5 = CompanyMaster(code="ABBOTT", name="Abbott Healthcare Pvt Ltd", contact_person="Vikram Singh", phone="9876543214")
    c6 = CompanyMaster(code="GSK", name="GlaxoSmithKline Pharmaceuticals", contact_person="Pooja Sharma", phone="9876543215")
    db.add_all([c1, c2, c3, c4, c5, c6])
    db.flush()

    # 1b. Suppliers / Wholesalers (From SRS purchasing evidence)
    s1 = SupplierMaster(supplier_code="SUP001", name="Mahaveer Medico Distributors", gstin="27AAACM1234F1Z1", phone="9823011223", email="orders@mahaveermed.com", address="B-12, Wholesale Drug Market")
    s2 = SupplierMaster(supplier_code="SUP002", name="Apollo Central Drug Agency", gstin="27BBCDA5678H1Z4", phone="9823044556", email="supply@apollocentral.com", address="Plot 44, Pharma Zone")
    db.add_all([s1, s2])
    db.flush()

    # 2. Categories
    cat1 = CategoryMaster(code="ANTIBIOTIC", name="Antibiotics & Antimicrobials", description="Prescription antibacterial drugs")
    cat2 = CategoryMaster(code="ANALGESIC", name="Analgesics & Antipyretics", description="Pain relief and fever reducers")
    cat3 = CategoryMaster(code="GASTRO", name="Gastrointestinal & Antacids", description="Acid reflux, PPIs and digestion")
    cat4 = CategoryMaster(code="DIABETIC", name="Antidiabetics & Endocrine", description="Blood glucose regulation")
    cat5 = CategoryMaster(code="CARDIO", name="Cardiovascular & Hypertensives", description="Blood pressure and cardiac care")
    cat6 = CategoryMaster(code="RESPIRATORY", name="Respiratory & Cough", description="Cough syrups and inhalers")
    cat7 = CategoryMaster(code="VITAMINS", name="Vitamins & Minerals", description="Nutritional supplements")
    db.add_all([cat1, cat2, cat3, cat4, cat5, cat6, cat7])
    db.flush()

    # 3. Locations
    loc1 = LocationMaster(code="RACK-A1", name="Counter Display Rack A1", is_default=True)
    loc2 = LocationMaster(code="RACK-B2", name="General Shelves Rack B2", is_default=False)
    loc3 = LocationMaster(code="COLD-01", name="Vaccine Cold Storage 2-8°C", is_default=False)
    loc4 = LocationMaster(code="LOCK-H1", name="Schedule H1 Locked Cupboard", is_default=False)
    db.add_all([loc1, loc2, loc3, loc4])
    db.flush()

    # 4. Tax Masters
    t0 = TaxMaster(tax_code="GST_0", tax_name="GST 0% (Exempted)", cgst_rate=0, sgst_rate=0, igst_rate=0)
    t5 = TaxMaster(tax_code="GST_5", tax_name="GST 5% (Life Saving)", cgst_rate=2.5, sgst_rate=2.5, igst_rate=5.0)
    t12 = TaxMaster(tax_code="GST_12", tax_name="GST 12% (Standard Pharma)", cgst_rate=6.0, sgst_rate=6.0, igst_rate=12.0)
    t18 = TaxMaster(tax_code="GST_18", tax_name="GST 18% (Supplements & Cosmetics)", cgst_rate=9.0, sgst_rate=9.0, igst_rate=18.0)
    db.add_all([t0, t5, t12, t18])
    db.flush()

    # 5. System Configurations (modernizing legacy .CON / .RTR switches)
    configs = [
        SystemConfig(key="MALL_MODE", value="OFF", description="Fast barcode-only POS terminal mode without extra popups", category="POS"),
        SystemConfig(key="GOMINUS_STOCK", value="OFF", description="Allow stock quantity to go negative upon cash sales", category="BILLING"),
        SystemConfig(key="ALLOW_OVER_MRP", value="OFF", description="Permit selling item above printed Maximum Retail Price", category="BILLING"),
        SystemConfig(key="ALWAYS_BARCODE", value="ON", description="Enable instant barcode scanner focus on invoice entry", category="POS"),
        SystemConfig(key="MERGE_ITEM_LINES", value="ON", description="Auto-increment quantity when scanning existing item line", category="POS"),
        SystemConfig(key="PRINT_PATIENT_PHONE", value="ON", description="Print customer mobile number on invoice bill", category="PRINTER"),
        SystemConfig(key="SCHEDULE_H1_STRICT", value="ON", description="Block checkout of Schedule H1 items without Doctor Reg No", category="RESTRICTIONS"),
    ]
    db.add_all(configs)
    db.flush()

    # 6. Doctors
    d1 = DoctorMaster(
        doctor_code="DOC001", 
        doctor_name="Dr. Rajesh K. Varma, MD", 
        specialization="Cardiologist & Internal Medicine",
        reg_no="MCI-184920",
        phone="9822011223",
        clinic_address="Apollo Clinic, Sector 14"
    )
    d2 = DoctorMaster(
        doctor_code="DOC002", 
        doctor_name="Dr. Priya Deshmukh, MBBS, DCH", 
        specialization="Pediatrician",
        reg_no="MCI-224911",
        phone="9822044556",
        clinic_address="Mother & Child Hospital, MG Road"
    )
    d3 = DoctorMaster(
        doctor_code="DOC003", 
        doctor_name="Dr. Arvind Narang, MS (Ortho)", 
        specialization="Orthopedic Surgeon",
        reg_no="MCI-994321",
        phone="9822077889",
        clinic_address="City Bone & Joint Care"
    )
    db.add_all([d1, d2, d3])
    db.flush()

    # 7. Patients
    p1 = PatientMaster(
        patient_code="PAT001",
        patient_name="Vijay Shekhar Sharma",
        phone="9810012345",
        whatsapp="9810012345",
        age=48,
        gender="Male",
        blood_group="B+",
        address="Flat 402, Green Valley Apartments"
    )
    p2 = PatientMaster(
        patient_code="PAT002",
        patient_name="Sunita Deshpande",
        phone="9810067890",
        whatsapp="9810067890",
        age=35,
        gender="Female",
        blood_group="O+",
        address="House 12B, Model Town"
    )
    db.add_all([p1, p2])
    db.flush()

    # 8. Items & Batches
    today = date.today()

    items_data = [
        {
            "item_code": "AUG625",
            "item_name": "Augmentin 625 Duo Tablet",
            "generic_name": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
            "barcode": "890123456001",
            "hsn_code": "3004",
            "company_id": c6.id,
            "category_id": cat1.id,
            "preparation": "TAB",
            "storage_type": "COOL_DRY",
            "unit_packing": 10,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": False,
            "min_stock_level": 10,
            "batches": [
                {
                    "batch_no": "AUG24A01",
                    "expiry_date": today + timedelta(days=420),
                    "mrp": 223.50,
                    "purchase_rate": 160.00,
                    "sale_rate": 201.15,
                    "stock_qty": 45.0,
                    "gst_rate": 12.0,
                    "location_id": loc1.id
                },
                {
                    "batch_no": "AUG24B02",
                    "expiry_date": today + timedelta(days=45), # Near expiry test
                    "mrp": 220.00,
                    "purchase_rate": 155.00,
                    "sale_rate": 198.00,
                    "stock_qty": 12.0,
                    "gst_rate": 12.0,
                    "location_id": loc1.id
                }
            ]
        },
        {
            "item_code": "DOLO650",
            "item_name": "Dolo 650mg Tablet",
            "generic_name": "Paracetamol (650mg)",
            "barcode": "890123456002",
            "hsn_code": "3004",
            "company_id": c2.id,
            "category_id": cat2.id,
            "preparation": "TAB",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 15,
            "unit_name": "Strip",
            "is_schedule_h": False,
            "is_schedule_h1": False,
            "min_stock_level": 20,
            "batches": [
                {
                    "batch_no": "DL650-24",
                    "expiry_date": today + timedelta(days=600),
                    "mrp": 33.60,
                    "purchase_rate": 22.50,
                    "sale_rate": 30.24,
                    "stock_qty": 120.0,
                    "gst_rate": 12.0,
                    "location_id": loc1.id
                }
            ]
        },
        {
            "item_code": "PAND",
            "item_name": "Pan-D Capsule",
            "generic_name": "Pantoprazole (40mg) + Domperidone (30mg)",
            "barcode": "890123456003",
            "hsn_code": "3004",
            "company_id": c5.id,
            "category_id": cat3.id,
            "preparation": "CAP",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 15,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": False,
            "min_stock_level": 15,
            "batches": [
                {
                    "batch_no": "PND9912",
                    "expiry_date": today + timedelta(days=500),
                    "mrp": 199.00,
                    "purchase_rate": 140.00,
                    "sale_rate": 179.10,
                    "stock_qty": 65.0,
                    "gst_rate": 12.0,
                    "location_id": loc2.id
                }
            ]
        },
        {
            "item_code": "TELMA40",
            "item_name": "Telma 40mg Tablet",
            "generic_name": "Telmisartan (40mg)",
            "barcode": "890123456004",
            "hsn_code": "3004",
            "company_id": c1.id,
            "category_id": cat5.id,
            "preparation": "TAB",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 30,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": False,
            "min_stock_level": 10,
            "batches": [
                {
                    "batch_no": "TLM40-09",
                    "expiry_date": today + timedelta(days=400),
                    "mrp": 245.00,
                    "purchase_rate": 175.00,
                    "sale_rate": 220.50,
                    "stock_qty": 35.0,
                    "gst_rate": 12.0,
                    "location_id": loc2.id
                }
            ]
        },
        {
            "item_code": "GLYGP2",
            "item_name": "Glycomet GP 2 Tablet",
            "generic_name": "Glimepiride (2mg) + Metformin (500mg)",
            "barcode": "890123456005",
            "hsn_code": "3004",
            "company_id": c4.id,
            "category_id": cat4.id,
            "preparation": "TAB",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 15,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": False,
            "min_stock_level": 10,
            "batches": [
                {
                    "batch_no": "GP2-789",
                    "expiry_date": today + timedelta(days=365),
                    "mrp": 140.00,
                    "purchase_rate": 95.00,
                    "sale_rate": 126.00,
                    "stock_qty": 50.0,
                    "gst_rate": 12.0,
                    "location_id": loc2.id
                }
            ]
        },
        {
            "item_code": "AZITH500",
            "item_name": "Azithral 500mg Tablet",
            "generic_name": "Azithromycin (500mg)",
            "barcode": "890123456006",
            "hsn_code": "3004",
            "company_id": c3.id,
            "category_id": cat1.id,
            "preparation": "TAB",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 5,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": False,
            "min_stock_level": 15,
            "batches": [
                {
                    "batch_no": "AZT500-24",
                    "expiry_date": today + timedelta(days=480),
                    "mrp": 119.50,
                    "purchase_rate": 82.00,
                    "sale_rate": 107.55,
                    "stock_qty": 40.0,
                    "gst_rate": 12.0,
                    "location_id": loc1.id
                }
            ]
        },
        {
            "item_code": "ALPR05",
            "item_name": "Alprax 0.5mg Tablet (Schedule H1)",
            "generic_name": "Alprazolam (0.5mg)",
            "barcode": "890123456007",
            "hsn_code": "3004",
            "company_id": c1.id,
            "category_id": cat2.id,
            "preparation": "TAB",
            "storage_type": "COOL_DRY",
            "unit_packing": 15,
            "unit_name": "Strip",
            "is_schedule_h": True,
            "is_schedule_h1": True, # Strict Schedule H1 drug
            "is_discount_locked": True,
            "min_stock_level": 5,
            "batches": [
                {
                    "batch_no": "ALPX-H1-01",
                    "expiry_date": today + timedelta(days=700),
                    "mrp": 65.00,
                    "purchase_rate": 45.00,
                    "sale_rate": 65.00,
                    "stock_qty": 25.0,
                    "gst_rate": 12.0,
                    "location_id": loc4.id
                }
            ]
        },
        {
            "item_code": "BENADRYL",
            "item_name": "Benadryl Cough Syrup 100ml",
            "generic_name": "Diphenhydramine + Ammonium Chloride + Sodium Citrate",
            "barcode": "890123456008",
            "hsn_code": "3004",
            "company_id": c5.id,
            "category_id": cat6.id,
            "preparation": "SYRUP",
            "storage_type": "ROOM_TEMP",
            "unit_packing": 1,
            "unit_name": "Bottle",
            "is_schedule_h": False,
            "is_schedule_h1": False,
            "min_stock_level": 8,
            "batches": [
                {
                    "batch_no": "BND100-24",
                    "expiry_date": today + timedelta(days=300),
                    "mrp": 125.00,
                    "purchase_rate": 88.00,
                    "sale_rate": 112.50,
                    "stock_qty": 30.0,
                    "gst_rate": 12.0,
                    "location_id": loc1.id
                }
            ]
        }
    ]

    for item_data in items_data:
        batches_data = item_data.pop("batches")
        itm = ItemMaster(**item_data)
        db.add(itm)
        db.flush()

        for b_data in batches_data:
            batch = BatchMaster(item_id=itm.id, **b_data)
            db.add(batch)

    db.commit()
    print("Database successfully seeded with realistic pharmacy data!")
    db.close()

if __name__ == "__main__":
    seed_database()

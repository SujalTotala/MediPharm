from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.endpoints import router as api_router
from app.seed_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediPharm Pharmacy Management & POS API",
    version="2.0.0",
    description="Modern relational REST API with atomic GST billing, batch tracking, prescription management, and regulatory compliance."
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    seed_database()

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "MediPharm Pharmacy Management System",
        "version": "2.0.0 (Modernized Edition)",
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

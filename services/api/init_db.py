"""
Database initialization script.
Run this to create all tables.
"""
from database import engine, Base
from models import Submission  # Import all models to register them

def init_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()

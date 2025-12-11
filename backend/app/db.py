# app/db.py
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Database path relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'wardrobe.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, index=True)
    class_name = Column(String, index=True)
    confidence = Column(Float)
    color_hex = Column(String)
    thickness = Column(String)
    meta = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)


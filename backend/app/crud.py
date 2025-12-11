# app/crud.py
from .db import SessionLocal, WardrobeItem
from sqlalchemy.orm import Session
import uuid

def create_item(filename, class_name, confidence, color_hex, thickness, meta=None):
    db: Session = SessionLocal()
    item = WardrobeItem(
        id = uuid.uuid4().hex,
        filename = filename,
        class_name = class_name,
        confidence = confidence,
        color_hex = color_hex,
        thickness = thickness,
        meta = meta or {}
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()
    return item

def list_items(limit=100):
    db = SessionLocal()
    items = db.query(WardrobeItem).order_by(WardrobeItem.created_at.desc()).limit(limit).all()
    db.close()
    return items

def get_item(item_id):
    db = SessionLocal()
    item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id).first()
    db.close()
    return item

def get_items_by_class_name(class_name: str, limit: int = 10):
    """Get wardrobe items by class name (case-insensitive partial match)"""
    db = SessionLocal()
    items = db.query(WardrobeItem).filter(
        WardrobeItem.class_name.ilike(f"%{class_name}%")
    ).order_by(WardrobeItem.confidence.desc()).limit(limit).all()
    db.close()
    return items


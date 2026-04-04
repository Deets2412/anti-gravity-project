from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Dashboard stats: total posts, drafts, approved, persona count."""
    total = db.query(models.Post).count()
    drafts = db.query(models.Post).filter(models.Post.status == "draft").count()
    review = db.query(models.Post).filter(models.Post.status == "review").count()
    approved = db.query(models.Post).filter(models.Post.status == "approved").count()
    personas = db.query(models.Persona).count()
    return {
        "total": total,
        "drafts": drafts,
        "review": review,
        "approved": approved,
        "personas": personas,
    }

@router.post("/", response_model=schemas.PostResponse)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    persona = db.query(models.Persona).filter(models.Persona.id == post.persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    db_post = models.Post(
        platform=post.platform,
        persona_id=post.persona_id,
        status=post.status,
        content=post.content.model_dump(),
        media_instructions=post.media_instructions.model_dump(),
        metadata_field=post.metadata_field.model_dump()
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/", response_model=List[schemas.PostResponse])
def read_posts(
    skip: int = 0,
    limit: int = 100,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Post)
    if platform:
        query = query.filter(models.Post.platform == platform)
    if status:
        query = query.filter(models.Post.status == status)
    posts = query.order_by(models.Post.id.desc()).offset(skip).limit(limit).all()
    return posts

@router.get("/{post_id}", response_model=schemas.PostResponse)
def read_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/{post_id}", response_model=schemas.PostResponse)
def update_post(post_id: str, post_update: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    db_post.platform = post_update.platform
    db_post.persona_id = post_update.persona_id
    db_post.status = post_update.status
    db_post.content = post_update.content.model_dump()
    db_post.media_instructions = post_update.media_instructions.model_dump()
    db_post.metadata_field = post_update.metadata_field.model_dump()

    db.commit()
    db.refresh(db_post)
    return db_post

@router.patch("/{post_id}/status", response_model=schemas.PostResponse)
def update_post_status(post_id: str, status: str, db: Session = Depends(get_db)):
    """Quick status update: draft | review | approved"""
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    db_post.status = status
    db.commit()
    db.refresh(db_post)
    return db_post

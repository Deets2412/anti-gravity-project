from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/personas",
    tags=["personas"],
)

@router.post("/", response_model=schemas.PersonaResponse)
def create_persona(persona: schemas.PersonaCreate, db: Session = Depends(get_db)):
    db_persona = models.Persona(**persona.model_dump())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.get("/", response_model=List[schemas.PersonaResponse])
def read_personas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    personas = db.query(models.Persona).offset(skip).limit(limit).all()
    return personas

@router.get("/{persona_id}", response_model=schemas.PersonaResponse)
def read_persona(persona_id: str, db: Session = Depends(get_db)):
    persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if persona is None:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona

@router.delete("/{persona_id}", response_model=dict)
def delete_persona(persona_id: str, db: Session = Depends(get_db)):
    persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if persona is None:
        raise HTTPException(status_code=404, detail="Persona not found")
    db.delete(persona)
    db.commit()
    return {"message": "Persona deleted successfully"}

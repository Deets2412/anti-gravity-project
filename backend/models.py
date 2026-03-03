from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Persona(Base):
    __tablename__ = "personas"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    tone = Column(String)
    vocabulary = Column(String)
    pillars = Column(JSON) # List of strings

    posts = relationship("Post", back_populates="persona")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    platform = Column(String, index=True) # "instagram", "linkedin", "tiktok"
    persona_id = Column(String, ForeignKey("personas.id"))
    status = Column(String, default="draft", index=True)  # draft | review | approved

    # Stored as JSON
    content = Column(JSON)
    media_instructions = Column(JSON)
    metadata_field = Column(JSON) # "metadata" is reserved by SQLAlchemy

    persona = relationship("Persona", back_populates="posts")

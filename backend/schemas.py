from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PersonaBase(BaseModel):
    name: str
    tone: str
    vocabulary: str
    pillars: List[str]

class PersonaCreate(PersonaBase):
    pass

class PersonaResponse(PersonaBase):
    id: str

    class Config:
        from_attributes = True

class PostContent(BaseModel):
    hook: Optional[str] = None
    body: str
    cta: Optional[str] = None
    hashtags: List[str]

class MediaInstructions(BaseModel):
    type: str # "image" | "video"
    prompt: str
    aspect_ratio: str

class PostMetadata(BaseModel):
    tone_score: Optional[float] = None
    target_audience: Optional[str] = None
    audience_generation: Optional[str] = None  # e.g. "Gen Z", "Baby Boomer"
    life_event: Optional[str] = None            # e.g. "Retirement", "Widowed"

class PostBase(BaseModel):
    platform: str
    persona_id: str
    status: str = "draft"
    content: PostContent
    media_instructions: MediaInstructions
    metadata_field: PostMetadata

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: str

    class Config:
        from_attributes = True

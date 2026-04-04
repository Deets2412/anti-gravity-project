from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import json

import models, schemas
from database import get_db

try:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))
except ImportError:
    client = None

router = APIRouter(prefix="/content", tags=["content"])

# ─── Generation cohort guidance ────────────────────────────────────────────────
GENERATION_CONTEXT = {
    "Gen Z": {
        "born": "1997–2012",
        "style": "Ultra-concise, visually driven, authentic and unfiltered. Uses humour, memes, and cultural references. Highly sceptical of corporate speak — speaks peer-to-peer. Short sentences. Emoji and slang acceptable. Platform native: TikTok, Instagram Reels, YouTube Shorts.",
        "trust_signals": "Authenticity, social proof from real people, transparency about flaws, user-generated content.",
        "avoid": "Formal language, corporate jargon, long paragraphs, overly polished or salesy tone.",
    },
    "Millennial": {
        "born": "1981–1996",
        "style": "Story-driven and value-led. Speaks to purpose, experience, and identity. Blend of professional and conversational. Comfortable with long-form and short-form. Responds well to nostalgia with a modern twist.",
        "trust_signals": "Brand values alignment, reviews, transparency, social impact, FOMO-driven urgency.",
        "avoid": "Patronising tone, overly formal language, ignoring lifestyle context.",
    },
    "Gen X": {
        "born": "1965–1980",
        "style": "Direct, sceptical, and self-reliant. Appreciates straight talk — cut the fluff. Values practicality and efficiency. Subtle wit works well. Comfortable with both digital and traditional formats.",
        "trust_signals": "Credibility, evidence, expert opinion, peer recommendations, ROI-focused messaging.",
        "avoid": "Hype, empty buzzwords, being talked down to, excessive enthusiasm.",
    },
    "Baby Boomer": {
        "born": "1946–1964",
        "style": "Detailed, relationship-first, and trust-focused. Values expertise and authority. Responds to clear benefits and outcomes. Comfortable with longer copy. Warm but professional tone.",
        "trust_signals": "Expert endorsements, track record, security, legacy, reliable institutions.",
        "avoid": "Too much slang, rapidly changing topics, overly casual tone, tech-heavy jargon.",
    },
    "Silent Generation": {
        "born": "1928–1945",
        "style": "Formal, respectful, and relationship-based. Values tradition, loyalty, and duty. Prefers comprehensive information before deciding. Responds to heritage and proven reliability.",
        "trust_signals": "Long track record, institutional reputation, personal relationships, face-to-face or phone follow-up.",
        "avoid": "Slang, overly casual tone, pressure tactics, rapid or disruptive framing.",
    },
}

# ─── Life event emotional framing ──────────────────────────────────────────────
LIFE_EVENT_CONTEXT = {
    "Retirement": "This person has just retired or is approaching retirement. They are navigating a major identity shift — from define-by-career to a life of freedom and purpose. Key emotions: excitement mixed with uncertainty, legacy thinking, time-richness, health consciousness. Frame content around possibilities, financial peace of mind, and the rewards of a life well-lived.",
    "Recently Divorced": "This person is going through or has recently completed a divorce. Key emotions: rebuilding personal identity, financial reset, newfound independence, vulnerability. Frame with empowerment, practical next steps, and forward momentum. Avoid anything that sounds like a sales pitch — lead with empathy and useful information.",
    "Widowed": "This person has recently lost their partner. Key emotions: grief, disorientation, loneliness, the need to make important decisions while emotionally depleted. Frame with extreme sensitivity, compassion, and patience. Avoid urgency. Focus on support, clarity, and long-term wellbeing.",
    "Inheritance Received": "This person has recently received a significant inheritance. Key emotions: responsibility, guilt, opportunity, uncertainty about what to do with newfound wealth. Frame around thoughtful stewardship, honouring legacy, and making wise long-term decisions. Avoid anything that feels rushed or opportunistic.",
    "Career Change": "This person is pivoting their career — either by choice or circumstance. Key emotions: excitement, anxiety, reinvention energy, identity uncertainty. Frame with possibility, transferable strengths, and a path forward.",
    "Recently Married": "This person has recently married. Key emotions: optimism, partnership, shared future planning, financial and lifestyle merging. Frame around building a shared life, protection, and growth together.",
    "New Parent": "This person has recently had or adopted a child. Key emotions: joy, exhaustion, protectiveness, financial urgency, long-term thinking. Frame around security, legacy, time efficiency, and providing the best for their family.",
    "First Home Purchase": "This person has just bought their first home. Key emotions: pride, financial stretch, nesting instinct, long-term commitment. Frame around milestone celebration, smart homeownership, and building equity.",
    "New Graduate": "This person has just completed their education. Key emotions: ambition, uncertainty, eagerness to prove themselves, financial pressure. Frame around opportunity, first steps, and building a strong foundation.",
    "Business Owner / Entrepreneur": "This person runs their own business. Key emotions: control, risk awareness, growth focus, time scarcity. Frame around leverage, efficiency, growth, and protecting what they've built.",
    "Health Diagnosis": "This person has recently received a significant health diagnosis. Key emotions: fear, urgency, the desire to get affairs in order, heightened awareness of mortality. Frame with care, clarity, and practical support. Avoid anything alarmist or pressure-driven.",
}


def build_audience_context(generation: Optional[str], life_event: Optional[str]) -> str:
    parts = []
    if generation and generation in GENERATION_CONTEXT:
        g = GENERATION_CONTEXT[generation]
        parts.append(f"""
TARGET GENERATION: {generation} (born {g['born']})
Communication style: {g['style']}
Trust signals that work: {g['trust_signals']}
Avoid: {g['avoid']}""")

    if life_event and life_event in LIFE_EVENT_CONTEXT:
        parts.append(f"""
LIFE EVENT OVERLAY: {life_event}
{LIFE_EVENT_CONTEXT[life_event]}""")

    if parts:
        return "\n\nAUDIENCE TARGETING:\n" + "\n".join(parts)
    return ""


class GenerateRequest(BaseModel):
    persona_id: str
    platform: str
    topic: str
    audience_generation: Optional[str] = None
    life_event: Optional[str] = None


@router.post("/generate", response_model=schemas.PostCreate)
def generate_content(req: GenerateRequest, db: Session = Depends(get_db)):
    persona = db.query(models.Persona).filter(models.Persona.id == req.persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    # Build audience description for display
    audience_parts = []
    if req.audience_generation:
        audience_parts.append(req.audience_generation)
    if req.life_event:
        audience_parts.append(req.life_event)
    audience_label = " · ".join(audience_parts) if audience_parts else "General audience"

    if not client or os.getenv("OPENAI_API_KEY", "dummy_key") == "dummy_key":
        # Audience-aware mock response
        body_lines = [
            f"Content about {req.topic} — written in the voice of {persona.name} (tone: {persona.tone}).",
        ]
        if req.audience_generation:
            g = GENERATION_CONTEXT.get(req.audience_generation, {})
            body_lines.append(f"Crafted for {req.audience_generation}: {g.get('style', '')[:120]}…")
        if req.life_event:
            body_lines.append(f"Framed for the life moment of '{req.life_event}': {LIFE_EVENT_CONTEXT.get(req.life_event, '')[:140]}…")

        return schemas.PostCreate(
            platform=req.platform,
            persona_id=req.persona_id,
            content=schemas.PostContent(
                hook=f"🎯 {req.topic}: what every {req.audience_generation or 'person'} needs to know right now.",
                body="\n\n".join(body_lines),
                cta="Drop a comment — what's your experience?",
                hashtags=["#mock", f"#{req.platform.lower()}", f"#{(req.audience_generation or '').replace(' ', '')}"],
            ),
            media_instructions=schemas.MediaInstructions(
                type="image",
                prompt=f"A warm, emotionally resonant illustration representing {req.topic} for a {audience_label} audience. Modern, authentic style.",
                aspect_ratio="1:1" if req.platform.lower() == "instagram" else "16:9",
            ),
            metadata_field=schemas.PostMetadata(
                tone_score=0.95,
                target_audience=audience_label,
                audience_generation=req.audience_generation,
                life_event=req.life_event,
            ),
        )

    # ── Real OpenAI generation ──────────────────────────────────────────────────
    audience_context = build_audience_context(req.audience_generation, req.life_event)

    system_prompt = f"""You are an expert social media strategist and copywriter.

BRAND PERSONA:
Name: {persona.name}
Tone: {persona.tone}
Vocabulary style: {persona.vocabulary}
Content pillars: {', '.join(persona.pillars) if persona.pillars else 'general'}
{audience_context}

TASK: Write a {req.platform} post about '{req.topic}'.

Your copy must authentically reflect both the brand persona AND the audience targeting above.
Adapt language, emotional framing, trust signals, and call-to-action style to suit the generation and life event context.

Output ONLY valid JSON matching this schema exactly:
{{
  "content": {{
    "hook": "Opening line that instantly grabs this specific audience",
    "body": "Main content body — 2-4 paragraphs, written in persona voice, audience-aware framing",
    "cta": "Call to action appropriate for this audience's trust level and emotional state",
    "hashtags": ["#relevant", "#hashtags", "#max8"]
  }},
  "media_instructions": {{
    "type": "image or video",
    "prompt": "Detailed image generation prompt reflecting the audience and topic",
    "aspect_ratio": "1:1 for Instagram, 16:9 for LinkedIn/Twitter, 9:16 for TikTok"
  }},
  "metadata": {{
    "tone_score": 0.0,
    "target_audience": "{audience_label}"
  }}
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate the {req.platform} post now."},
            ],
            response_format={"type": "json_object"},
        )
        result_json = json.loads(response.choices[0].message.content)

        return schemas.PostCreate(
            platform=req.platform,
            persona_id=req.persona_id,
            content=schemas.PostContent(**result_json.get("content", {})),
            media_instructions=schemas.MediaInstructions(**result_json.get("media_instructions", {})),
            metadata_field=schemas.PostMetadata(
                **result_json.get("metadata", {}),
                audience_generation=req.audience_generation,
                life_event=req.life_event,
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

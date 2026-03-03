from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Create tables (new columns added in schema will be caught by drop_all run once manually)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Persona-Driven Content Workflow Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import routes.personas
import routes.content
import routes.posts

app.include_router(routes.personas.router)
app.include_router(routes.content.router)
app.include_router(routes.posts.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Persona-Driven Content Workflow Engine API"}

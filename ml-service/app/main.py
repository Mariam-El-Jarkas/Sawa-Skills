import sys
import os

# Allow imports from the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from model.classifier import SkillPostMatcher

app = FastAPI(
    title="Sawa Skills ML Service",
    description="Ranks community posts by relevance to a user's skill set.",
    version="1.0.0",
)

matcher = SkillPostMatcher(score_threshold=0.05, max_results=10)


# ── Request / Response models ─────────────────────────────────────────────────

class PostInput(BaseModel):
    id: int
    content: str


class ScoreRequest(BaseModel):
    skills: List[str]
    posts: List[PostInput]


class ScoreResult(BaseModel):
    id: int
    score: float


class MatchingSkillsRequest(BaseModel):
    post_content: str
    skills: List[str]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "sawa-ml"}


@app.post("/score-posts", response_model=List[ScoreResult])
def score_posts(request: ScoreRequest):
    """
    Accepts a user's skill list and a list of posts.
    Returns posts sorted by relevance score (highest first).
    Only posts above the relevance threshold are returned.
    """
    if not request.skills:
        raise HTTPException(status_code=400, detail="skills must not be empty")
    if not request.posts:
        return []

    posts_data = [{"id": p.id, "content": p.content} for p in request.posts]
    results = matcher.score_posts(request.skills, posts_data)
    return [ScoreResult(id=r["id"], score=r["score"]) for r in results]


@app.post("/matching-skills", response_model=List[str])
def matching_skills(request: MatchingSkillsRequest):
    """
    Returns which skills from the provided list appear in the post content.
    Used by the backend to generate ML-match notification messages.
    """
    return matcher.find_matching_skill(request.post_content, request.skills)

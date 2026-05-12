from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI(title="AI Team Intelligence Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────── Models ────────────────

class CompletionInput(BaseModel):
    complexity: str  # low | medium | high
    teamSize: int
    estimatedHours: float
    avgActual: float

class UserInfo(BaseModel):
    name: str
    role: str
    performanceScore: float
    tasksCompleted: int
    department: Optional[str] = None
    experience: Optional[int] = 0

class TeamInput(BaseModel):
    skills: List[str]
    projectType: str
    users: List[UserInfo]

# ──────────────── Endpoints ────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict/completion")
def predict_completion(data: CompletionInput):
    complexity_map = {"low": 1.0, "medium": 1.3, "high": 1.7}
    factor = complexity_map.get(data.complexity, 1.3)

    # Linear regression style heuristic
    base_days = (data.estimatedHours / max(data.teamSize, 1)) / 8
    adjusted = base_days * factor * (data.avgActual / max(data.estimatedHours, 1))
    predicted = max(1, round(adjusted))

    # Confidence based on how close estimate was to actual history
    ratio = data.avgActual / max(data.estimatedHours, 1)
    confidence = round(max(0.5, 1 - abs(1 - ratio) * 0.4), 2)

    return {
        "predictedDays": predicted,
        "confidence": confidence,
        "breakdown": {
            "baseDays": round(base_days, 1),
            "complexityFactor": factor,
            "adjustedDays": adjusted,
        },
        "source": "ai",
    }

@app.post("/recommend/team")
def recommend_team(data: TeamInput):
    scored = []
    for u in data.users:
        score = u.performanceScore * 0.6 + min(u.tasksCompleted, 50) * 0.4 + (u.experience or 0) * 0.5
        scored.append({"user": u.dict(), "score": round(score, 2)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    top5 = scored[:5]

    return {
        "recommended": [r["user"] for r in top5],
        "scores": [r["score"] for r in top5],
        "source": "ai",
    }

@app.post("/analyze/performance")
def analyze_performance(users: List[UserInfo]):
    result = []
    for u in users:
        promo_score = u.performanceScore * 0.5 + min(u.tasksCompleted, 50) + (u.experience or 0) * 2
        label = "Promote" if promo_score >= 80 else "Review" if promo_score >= 50 else "Monitor"
        result.append({
            "name": u.name,
            "promotionScore": round(promo_score, 1),
            "recommendation": label,
        })
    result.sort(key=lambda x: x["promotionScore"], reverse=True)
    return {"data": result, "source": "ai"}

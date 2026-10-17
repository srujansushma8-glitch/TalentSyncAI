from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.project import Project
from backend.app.models.employee import Employee
from backend.app.schemas.matching import ProjectMatchingResult, MatchingWeights
from backend.app.services.matching_engine import calculate_candidate_match
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/matching", tags=["Matching Engine"])


@router.get("/{project_id}", response_model=ProjectMatchingResult)
def get_project_matches(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    employees = db.query(Employee).filter(Employee.is_active == True).all()

    default_weights = MatchingWeights()
    candidates = []
    for emp in employees:
        score_obj = calculate_candidate_match(emp, project, weights=default_weights)
        candidates.append(score_obj)

    # Sort candidates by:
    # 1. No hard constraint violation first
    # 2. Highest match_score descending
    candidates.sort(
        key=lambda c: (not c.has_hard_constraint_violation, c.match_score),
        reverse=True
    )

    eligible_count = len([c for c in candidates if not c.has_hard_constraint_violation])

    return ProjectMatchingResult(
        project_id=project.id,
        project_name=project.name,
        weights_used=default_weights,
        total_candidates_evaluated=len(candidates),
        eligible_candidates_count=eligible_count,
        candidates=candidates
    )


@router.post("/{project_id}/custom-weights", response_model=ProjectMatchingResult)
def get_custom_weighted_matches(
    project_id: int,
    weights: MatchingWeights,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    weight_sum = weights.skill_weight + weights.experience_weight + weights.availability_weight + weights.proficiency_weight
    if abs(weight_sum - 1.0) > 0.001:
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0 (100%). Received sum: {weight_sum:.2f}"
        )

    employees = db.query(Employee).filter(Employee.is_active == True).all()
    candidates = [calculate_candidate_match(e, project, weights=weights) for e in employees]

    candidates.sort(
        key=lambda c: (not c.has_hard_constraint_violation, c.match_score),
        reverse=True
    )

    eligible_count = len([c for c in candidates if not c.has_hard_constraint_violation])

    return ProjectMatchingResult(
        project_id=project.id,
        project_name=project.name,
        weights_used=weights,
        total_candidates_evaluated=len(candidates),
        eligible_candidates_count=eligible_count,
        candidates=candidates
    )

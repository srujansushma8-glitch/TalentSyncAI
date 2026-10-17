from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.employee import Employee
from backend.app.models.project import Project
from backend.app.models.skill import Skill
from backend.app.models.training import TrainingResource, TrainingRecommendation
from backend.app.schemas.training import (
    TrainingResourceOut,
    TrainingResourceCreate,
    TrainingRecommendationOut,
    UpdateTrainingStatus,
)
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/training", tags=["Training & Upskilling"])


@router.get("/resources", response_model=List[TrainingResourceOut])
def list_training_resources(
    skill_id: Optional[int] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TrainingResource)
    if skill_id:
        query = query.filter(TrainingResource.skill_id == skill_id)
    if level:
        query = query.filter(TrainingResource.level == level)

    resources = query.all()
    results = []
    for r in resources:
        results.append({
            "id": r.id,
            "skill_id": r.skill_id,
            "title": r.title,
            "provider": r.provider,
            "url": r.url,
            "level": r.level,
            "estimated_hours": r.estimated_hours,
            "description": r.description,
            "skill_name": r.skill.name if r.skill else f"Skill #{r.skill_id}",
            "skill_category": r.skill.category if r.skill else "General",
        })
    return results


@router.post("/resources", response_model=TrainingResourceOut, status_code=status.HTTP_201_CREATED)
def create_training_resource(
    res_data: TrainingResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR])),
):
    skill = db.query(Skill).filter(Skill.id == res_data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    res = TrainingResource(**res_data.model_dump())
    db.add(res)
    db.commit()
    db.refresh(res)

    return {
        "id": res.id,
        "skill_id": res.skill_id,
        "title": res.title,
        "provider": res.provider,
        "url": res.url,
        "level": res.level,
        "estimated_hours": res.estimated_hours,
        "description": res.description,
        "skill_name": skill.name,
        "skill_category": skill.category,
    }


@router.get("/recommendations", response_model=List[TrainingRecommendationOut])
def get_recommendations(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TrainingRecommendation)

    # If employee role, filter to own profile
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(TrainingRecommendation.employee_id == emp.id)
    elif employee_id:
        query = query.filter(TrainingRecommendation.employee_id == employee_id)

    recs = query.order_by(TrainingRecommendation.created_at.desc()).all()
    results = []
    for idx, r in enumerate(recs, 1):
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": r.employee.name if r.employee else f"Employee #{r.employee_id}",
            "resource_id": r.resource_id,
            "resource_title": r.resource.title if r.resource else "Course",
            "resource_provider": r.resource.provider if r.resource else "Platform",
            "resource_url": r.resource.url if r.resource else "#",
            "level": r.resource.level if r.resource else "Intermediate",
            "estimated_hours": r.resource.estimated_hours if r.resource else 20.0,
            "target_skill_name": r.target_skill.name if r.target_skill else (r.resource.skill.name if r.resource and r.resource.skill else "General"),
            "reason": r.reason,
            "sequence_order": idx,
            "priority": "HIGH" if "critical" in r.reason.lower() or "missing" in r.reason.lower() else "MEDIUM",
            "status": r.status,
            "created_at": r.created_at,
        })
    return results


@router.post("/recommendations/generate")
def auto_generate_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR, UserRole.PM])),
):
    """
    Scans project requirements and employee skills to generate personalized upskilling pathways.
    """
    projects = db.query(Project).filter(Project.status.in_(["planning", "in_progress"])).all()
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    resources = db.query(TrainingResource).all()

    generated_count = 0
    for p in projects:
        for req in p.required_skills:
            # Find matching training resource for this skill
            course = next((c for c in resources if c.skill_id == req.skill_id), None)
            if not course:
                continue

            for emp in employees:
                # Check employee skill
                emp_skill = next((es for es in emp.skills if es.skill_id == req.skill_id), None)
                needs_upskilling = False
                reason = ""

                if not emp_skill and req.is_mandatory:
                    needs_upskilling = True
                    reason = f"Mandatory skill required for {p.name}. Upskilling will unlock project eligibility."
                elif emp_skill and emp_skill.proficiency_level < req.min_proficiency:
                    needs_upskilling = True
                    reason = f"Proficiency boost needed for {p.name} (Current: L{emp_skill.proficiency_level}, Required: L{req.min_proficiency})."

                if needs_upskilling:
                    # Check if already recommended
                    existing = db.query(TrainingRecommendation).filter(
                        TrainingRecommendation.employee_id == emp.id,
                        TrainingRecommendation.resource_id == course.id
                    ).first()

                    if not existing:
                        rec = TrainingRecommendation(
                            employee_id=emp.id,
                            resource_id=course.id,
                            target_skill_id=req.skill_id,
                            reason=reason,
                            status="recommended"
                        )
                        db.add(rec)
                        generated_count += 1

    db.commit()
    return {"message": f"Generated {generated_count} new targeted learning recommendations.", "new_count": generated_count}


@router.put("/recommendations/{recommendation_id}/status")
def update_recommendation_status(
    recommendation_id: int,
    status_data: UpdateTrainingStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.query(TrainingRecommendation).filter(TrainingRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = status_data.status
    db.commit()
    return {"success": True, "status": rec.status}

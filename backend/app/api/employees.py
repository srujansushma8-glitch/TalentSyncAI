from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.skill import Skill, EmployeeSkill
from backend.app.schemas.employee import (
    EmployeeOut,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeSkillUpdate,
    SkillBase,
    EmployeeSkillOut,
    AssignmentBrief,
)
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/employees", tags=["Employees"])


def format_employee_out(emp: Employee) -> dict:
    skills_out = []
    for es in emp.skills:
        if es.skill:
            skills_out.append({
                "skill_id": es.skill_id,
                "name": es.skill.name,
                "category": es.skill.category,
                "proficiency_level": es.proficiency_level,
                "is_verified": es.is_verified,
            })

    assignments_out = []
    for a in emp.assignments:
        if a.status == "active":
            assignments_out.append({
                "id": a.id,
                "project_id": a.project_id,
                "project_name": a.project.name if a.project else f"Project #{a.project_id}",
                "assigned_weekly_hours": a.assigned_weekly_hours,
                "role_in_project": a.role_in_project,
                "status": a.status,
            })

    return {
        "id": emp.id,
        "employee_code": emp.employee_code,
        "name": emp.name,
        "email": emp.email,
        "department": emp.department,
        "job_title": emp.job_title,
        "years_of_experience": emp.years_of_experience,
        "weekly_working_hours": emp.weekly_working_hours,
        "availability_status": emp.availability_status.value,
        "learning_interests": emp.learning_interests,
        "is_active": emp.is_active,
        "committed_hours": emp.committed_hours,
        "remaining_capacity": emp.remaining_capacity,
        "utilization_percent": emp.utilization_percent,
        "skills": skills_out,
        "assignments": assignments_out,
    }


@router.get("", response_model=List[EmployeeOut])
def list_employees(
    search: Optional[str] = None,
    department: Optional[str] = None,
    availability: Optional[str] = None,
    skill_id: Optional[int] = None,
    min_experience: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Employee).filter(Employee.is_active == True)

    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (Employee.name.ilike(search_fmt)) |
            (Employee.employee_code.ilike(search_fmt)) |
            (Employee.email.ilike(search_fmt)) |
            (Employee.job_title.ilike(search_fmt))
        )

    if department:
        query = query.filter(Employee.department == department)

    if availability:
        query = query.filter(Employee.availability_status == availability)

    if min_experience is not None:
        query = query.filter(Employee.years_of_experience >= min_experience)

    employees = query.all()

    if skill_id:
        employees = [
            e for e in employees
            if any(es.skill_id == skill_id for es in e.skills)
        ]

    return [format_employee_out(e) for e in employees]


@router.get("/skills/catalog", response_model=List[SkillBase])
def get_skills_catalog(db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.category, Skill.name).all()
    return [{"id": s.id, "name": s.name, "category": s.category} for s in skills]


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return format_employee_out(emp)


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR])),
):
    existing = db.query(Employee).filter(Employee.email == emp_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee email already exists")

    # Generate next code
    count = db.query(Employee).count()
    code = f"EMP-{count + 101:03d}"

    emp = Employee(
        employee_code=code,
        name=emp_data.name,
        email=emp_data.email,
        department=emp_data.department,
        job_title=emp_data.job_title,
        years_of_experience=emp_data.years_of_experience,
        weekly_working_hours=emp_data.weekly_working_hours,
        availability_status=emp_data.availability_status,
        learning_interests=emp_data.learning_interests,
        is_active=True
    )
    db.add(emp)
    db.flush()

    if emp_data.skills:
        for s in emp_data.skills:
            es = EmployeeSkill(
                employee_id=emp.id,
                skill_id=s.skill_id,
                proficiency_level=s.proficiency_level,
                is_verified=False
            )
            db.add(es)

    db.commit()
    db.refresh(emp)
    return format_employee_out(emp)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    update_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Permissions check: Admin, HR or self
    if current_user.role not in [UserRole.ADMIN, UserRole.HR]:
        if not (emp.user_id and emp.user_id == current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to edit this profile")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return format_employee_out(emp)


@router.post("/{employee_id}/skills", response_model=EmployeeOut)
def upsert_employee_skill(
    employee_id: int,
    skill_update: EmployeeSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    es = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == skill_update.skill_id
    ).first()

    if es:
        es.proficiency_level = skill_update.proficiency_level
    else:
        es = EmployeeSkill(
            employee_id=employee_id,
            skill_id=skill_update.skill_id,
            proficiency_level=skill_update.proficiency_level,
            is_verified=False
        )
        db.add(es)

    db.commit()
    db.refresh(emp)
    return format_employee_out(emp)


@router.delete("/{employee_id}/skills/{skill_id}", response_model=EmployeeOut)
def remove_employee_skill(
    employee_id: int,
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    es = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == skill_id
    ).first()
    if es:
        db.delete(es)
        db.commit()

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    return format_employee_out(emp)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR])),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    db.commit()
    return None

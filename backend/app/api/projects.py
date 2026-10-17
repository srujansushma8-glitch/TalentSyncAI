from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.project import Project, ProjectStatus, ProjectPriority, ProjectRequiredSkill
from backend.app.models.employee import Employee
from backend.app.models.assignment import Assignment
from backend.app.models.audit import AuditLog
from backend.app.schemas.project import (
    ProjectOut,
    ProjectCreate,
    ProjectUpdate,
    ProjectRequiredSkillBase,
)
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/projects", tags=["Projects"])


def format_project_out(p: Project) -> dict:
    req_skills = []
    for r in p.required_skills:
        req_skills.append({
            "id": r.id,
            "skill_id": r.skill_id,
            "skill_name": r.skill.name if r.skill else f"Skill #{r.skill_id}",
            "category": r.skill.category if r.skill else "General",
            "min_proficiency": r.min_proficiency,
            "is_mandatory": r.is_mandatory,
        })

    assignments = []
    for a in p.assignments:
        if a.status == "active":
            assignments.append({
                "id": a.id,
                "employee_id": a.employee_id,
                "employee_name": a.employee.name if a.employee else f"Employee #{a.employee_id}",
                "assigned_weekly_hours": a.assigned_weekly_hours,
                "role_in_project": a.role_in_project,
                "status": a.status,
            })

    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "department": p.department,
        "status": p.status.value,
        "priority": p.priority.value,
        "required_team_size": p.required_team_size,
        "estimated_weekly_hours": p.estimated_weekly_hours,
        "min_experience": p.min_experience,
        "start_date": p.start_date,
        "deadline": p.deadline,
        "created_at": p.created_at,
        "assigned_count": p.assigned_count,
        "staffing_fulfillment_percent": p.staffing_fulfillment_percent,
        "required_skills": req_skills,
        "assignments": assignments,
    }


@router.get("", response_model=List[ProjectOut])
def list_projects(
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if department:
        query = query.filter(Project.department == department)
    if priority:
        query = query.filter(Project.priority == priority)

    projects = query.order_by(Project.created_at.desc()).all()
    return [format_project_out(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return format_project_out(p)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    proj_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM, UserRole.HR])),
):
    project = Project(
        name=proj_data.name,
        description=proj_data.description,
        department=proj_data.department,
        status=proj_data.status,
        priority=proj_data.priority,
        required_team_size=proj_data.required_team_size,
        estimated_weekly_hours=proj_data.estimated_weekly_hours,
        min_experience=proj_data.min_experience,
        start_date=proj_data.start_date,
        deadline=proj_data.deadline,
        project_manager_id=current_user.id
    )
    db.add(project)
    db.flush()

    for s in proj_data.required_skills:
        req = ProjectRequiredSkill(
            project_id=project.id,
            skill_id=s.skill_id,
            min_proficiency=s.min_proficiency,
            is_mandatory=s.is_mandatory
        )
        db.add(req)

    # Log audit
    audit = AuditLog(
        action="PROJECT_CREATED",
        entity_type="Project",
        entity_id=project.id,
        performed_by_id=current_user.id,
        details=f"Created project '{project.name}' with {len(proj_data.required_skills)} required skills."
    )
    db.add(audit)

    db.commit()
    db.refresh(project)
    return format_project_out(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    update_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM, UserRole.HR])),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    data = update_data.model_dump(exclude_unset=True)
    required_skills_data = data.pop("required_skills", None)

    for field, value in data.items():
        setattr(project, field, value)

    if required_skills_data is not None:
        # Replace existing requirements
        db.query(ProjectRequiredSkill).filter(ProjectRequiredSkill.project_id == project_id).delete()
        for s in required_skills_data:
            req = ProjectRequiredSkill(
                project_id=project.id,
                skill_id=s["skill_id"],
                min_proficiency=s.get("min_proficiency", 2),
                is_mandatory=s.get("is_mandatory", True)
            )
            db.add(req)

    db.commit()
    db.refresh(project)
    return format_project_out(project)


@router.post("/{project_id}/assign", response_model=ProjectOut)
def assign_employee_to_project(
    project_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM, UserRole.HR])),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    employee_id = payload.get("employee_id")
    assigned_hours = float(payload.get("assigned_weekly_hours", 15.0))
    role_in_project = payload.get("role_in_project", "Team Member")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check for existing active assignment
    existing = db.query(Assignment).filter(
        Assignment.project_id == project_id,
        Assignment.employee_id == employee_id,
        Assignment.status == "active"
    ).first()

    if existing:
        existing.assigned_weekly_hours = assigned_hours
        existing.role_in_project = role_in_project
    else:
        asgn = Assignment(
            project_id=project_id,
            employee_id=employee_id,
            assigned_weekly_hours=assigned_hours,
            role_in_project=role_in_project,
            status="active",
            approved_by_id=current_user.id
        )
        db.add(asgn)

    # Record Audit Log
    audit = AuditLog(
        action="ASSIGNMENT_APPROVED",
        entity_type="Assignment",
        entity_id=project_id,
        performed_by_id=current_user.id,
        details=f"Assigned {emp.name} ({assigned_hours}h/wk) to {project.name} by {current_user.full_name}."
    )
    db.add(audit)

    db.commit()
    db.refresh(project)
    return format_project_out(project)


@router.delete("/{project_id}/assignments/{assignment_id}", response_model=ProjectOut)
def remove_assignment(
    project_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM, UserRole.HR])),
):
    asgn = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.project_id == project_id).first()
    if not asgn:
        raise HTTPException(status_code=404, detail="Assignment not found")

    emp_name = asgn.employee.name if asgn.employee else f"Employee #{asgn.employee_id}"
    db.delete(asgn)

    audit = AuditLog(
        action="ASSIGNMENT_REMOVED",
        entity_type="Assignment",
        entity_id=project_id,
        performed_by_id=current_user.id,
        details=f"Removed {emp_name} from Project #{project_id}."
    )
    db.add(audit)

    db.commit()
    project = db.query(Project).filter(Project.id == project_id).first()
    return format_project_out(project)

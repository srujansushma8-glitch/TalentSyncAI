from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.project import Project
from backend.app.models.skill import Skill
from backend.app.models.audit import AuditLog
from backend.app.schemas.dashboard import (
    DashboardAnalyticsResponse,
    DashboardKPIs,
    UtilizationDistributionPoint,
    DepartmentCapacityPoint,
    SkillDistributionPoint,
    ProjectStaffingPoint,
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])


@router.get("", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    projects = db.query(Project).all()
    skills = db.query(Skill).all()

    total_emps = len(employees)
    active_projects = [p for p in projects if p.status in ["planning", "in_progress"]]
    total_active_proj = len(active_projects)

    available_emps_count = 0
    overloaded_count = 0
    underutilized_count = 0
    total_util_sum = 0.0

    # Utilization distribution buckets
    bucket_counts = {"<50%": 0, "50-70%": 0, "70-100%": 0, ">100% (Overloaded)": 0}

    # Department aggregation
    dept_map: Dict[str, Dict[str, float]] = {}

    for emp in employees:
        u = emp.utilization_percent
        total_util_sum += u

        if u > 100.0:
            overloaded_count += 1
            bucket_counts[">100% (Overloaded)"] += 1
        elif u >= 70.0:
            bucket_counts["70-100%"] += 1
        elif u >= 50.0:
            underutilized_count += 1
            bucket_counts["50-70%"] += 1
        else:
            underutilized_count += 1
            bucket_counts["<50%"] += 1

        if emp.remaining_capacity >= 15.0 and emp.availability_status == AvailabilityStatus.AVAILABLE:
            available_emps_count += 1

        d = emp.department
        if d not in dept_map:
            dept_map[d] = {"headcount": 0, "capacity": 0.0, "allocated": 0.0}
        dept_map[d]["headcount"] += 1
        dept_map[d]["capacity"] += emp.weekly_working_hours
        dept_map[d]["allocated"] += emp.committed_hours

    avg_util = round(total_util_sum / total_emps, 1) if total_emps else 0.0

    # Staffing gaps and overall coverage
    projects_with_gaps = 0
    total_req_skills = 0
    covered_req_skills = 0

    project_staffing_points: List[ProjectStaffingPoint] = []
    for p in projects:
        assigned = p.assigned_count
        req_size = p.required_team_size
        has_gap = assigned < req_size
        if has_gap and p.status in ["planning", "in_progress"]:
            projects_with_gaps += 1

        project_staffing_points.append(ProjectStaffingPoint(
            project_id=p.id,
            project_name=p.name,
            priority=p.priority.value,
            required_team_size=req_size,
            assigned_count=assigned,
            fulfillment_percent=p.staffing_fulfillment_percent,
            has_gaps=has_gap
        ))

        # Check skill coverage across active projects
        for req in p.required_skills:
            total_req_skills += 1
            # Check if any assigned member satisfies it
            assigned_emp_ids = {a.employee_id for a in p.assignments if a.status == "active"}
            satisfied = any(
                any(es.skill_id == req.skill_id and es.proficiency_level >= req.min_proficiency for es in emp.skills)
                for emp in employees if emp.id in assigned_emp_ids
            )
            if satisfied:
                covered_req_skills += 1

    overall_coverage = round((covered_req_skills / total_req_skills) * 100.0, 1) if total_req_skills else 100.0

    kpis = DashboardKPIs(
        total_employees=total_emps,
        active_projects=total_active_proj,
        available_employees=available_emps_count,
        projects_with_staffing_gaps=projects_with_gaps,
        overloaded_employees=overloaded_count,
        underutilized_employees=underutilized_count,
        average_workforce_utilization=avg_util,
        overall_skill_coverage_percent=overall_coverage
    )

    util_dist = []
    for tier, count in bucket_counts.items():
        pct = round((count / total_emps) * 100.0, 1) if total_emps else 0.0
        util_dist.append(UtilizationDistributionPoint(tier=tier, count=count, percentage=pct))

    dept_caps = []
    for d, data in dept_map.items():
        u_rate = round((data["allocated"] / data["capacity"]) * 100.0, 1) if data["capacity"] else 0.0
        dept_caps.append(DepartmentCapacityPoint(
            department=d,
            total_headcount=int(data["headcount"]),
            total_capacity_hours=round(data["capacity"], 1),
            allocated_hours=round(data["allocated"], 1),
            utilization_rate=u_rate
        ))

    # Skill distribution
    cat_counts: Dict[str, List[int]] = {}
    for s in skills:
        cat = s.category or "General"
        if cat not in cat_counts:
            cat_counts[cat] = []
        for es in s.employee_skills:
            cat_counts[cat].append(es.proficiency_level)

    skill_dist = []
    for cat, profs in cat_counts.items():
        avg_p = round(sum(profs) / len(profs), 1) if profs else 0.0
        skill_dist.append(SkillDistributionPoint(
            category=cat,
            employee_count=len(profs),
            avg_proficiency=avg_p
        ))

    # Recent Audit Log Activity
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
    activity = []
    for log in recent_logs:
        activity.append({
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
        })

    return DashboardAnalyticsResponse(
        kpis=kpis,
        utilization_distribution=util_dist,
        department_capacities=dept_caps,
        skill_distributions=skill_dist,
        project_staffing=project_staffing_points,
        recent_activity=activity
    )

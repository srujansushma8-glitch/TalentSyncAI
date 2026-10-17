import csv
import io
from typing import List
from backend.app.models.employee import Employee
from backend.app.models.project import Project
from backend.app.models.skill import Skill
from backend.app.models.training import TrainingResource
from backend.app.services.workload_service import calculate_workforce_workload
from backend.app.services.skill_gap_service import analyze_org_skill_gaps


def export_employees_skills_csv(employees: List[Employee]) -> str:
    """Exports all employees and their skills with proficiency levels to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Code", "Name", "Email", "Department", "Job Title",
        "Experience (Years)", "Weekly Hours", "Committed Hours",
        "Remaining Capacity", "Utilization %", "Availability Status",
        "Skills Inventory"
    ])

    for emp in employees:
        skills_str = "; ".join(
            f"{es.skill.name} (L{es.proficiency_level})" for es in emp.skills if es.skill
        )
        writer.writerow([
            emp.employee_code, emp.name, emp.email, emp.department, emp.job_title,
            emp.years_of_experience, emp.weekly_working_hours, emp.committed_hours,
            emp.remaining_capacity, f"{emp.utilization_percent:.1f}%",
            emp.availability_status.value, skills_str
        ])

    return output.getvalue()


def export_projects_csv(projects: List[Project]) -> str:
    """Exports projects, staffing progress, and required skills to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Project ID", "Name", "Department", "Status", "Priority",
        "Required Team Size", "Assigned Team Count", "Staffing %",
        "Weekly Project Hours", "Min Experience (Years)", "Required Skills"
    ])

    for p in projects:
        reqs_str = "; ".join(
            f"{req.skill.name} (Min L{req.min_proficiency}, {'Mandatory' if req.is_mandatory else 'Optional'})"
            for req in p.required_skills if req.skill
        )
        writer.writerow([
            p.id, p.name, p.department, p.status.value, p.priority.value,
            p.required_team_size, p.assigned_count, f"{p.staffing_fulfillment_percent:.1f}%",
            p.estimated_weekly_hours, p.min_experience, reqs_str
        ])

    return output.getvalue()


def export_workload_csv(employees: List[Employee]) -> str:
    """Exports workforce workload utilization and capacity breakdown to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee ID", "Code", "Name", "Department", "Job Title",
        "Weekly Capacity (Hours)", "Committed Hours", "Remaining Hours",
        "Utilization %", "Status", "Active Assignments Count"
    ])

    summary = calculate_workforce_workload(employees)
    for w in summary.all_employees:
        writer.writerow([
            w.employee_id, w.employee_code, w.employee_name, w.department, w.job_title,
            w.weekly_working_hours, w.committed_hours, w.remaining_capacity,
            f"{w.utilization_percent:.1f}%", w.status, w.active_assignments_count
        ])

    return output.getvalue()


def export_skill_gaps_csv(projects: List[Project], employees: List[Employee], skills: List[Skill]) -> str:
    """Exports organization skill gap analysis to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Skill ID", "Skill Name", "Category", "Projects Requiring",
        "Employees with Skill", "Proficient Staff (L3+)", "Shortage Gap", "Severity"
    ])

    org_report = analyze_org_skill_gaps(projects, employees, skills)
    for g in org_report.top_demanded_skills:
        writer.writerow([
            g.skill_id, g.skill_name, g.category, g.total_required_in_projects,
            g.total_employees_with_skill, g.proficient_employees_count,
            g.shortage_gap, g.severity
        ])

    return output.getvalue()

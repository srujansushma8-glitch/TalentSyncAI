import pytest
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.skill import Skill, EmployeeSkill
from backend.app.models.project import Project, ProjectRequiredSkill
from backend.app.services.team_optimizer import optimize_project_team


def test_team_optimizer_covers_mandatory_skills():
    s_backend = Skill(id=1, name="BackendDev", category="Backend")
    s_frontend = Skill(id=2, name="FrontendDev", category="Frontend")

    emp1 = Employee(
        id=1, name="Dev Backend", employee_code="E1", email="e1@test.com",
        department="Engineering", job_title="Backend Eng", years_of_experience=4.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    emp1.skills = [EmployeeSkill(employee_id=1, skill_id=1, proficiency_level=3, skill=s_backend)]
    emp1.assignments = []

    emp2 = Employee(
        id=2, name="Dev Frontend", employee_code="E2", email="e2@test.com",
        department="Engineering", job_title="Frontend Eng", years_of_experience=4.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    emp2.skills = [EmployeeSkill(employee_id=2, skill_id=2, proficiency_level=3, skill=s_frontend)]
    emp2.assignments = []

    proj = Project(
        id=1, name="Cross Platform", department="Engineering",
        required_team_size=2, estimated_weekly_hours=30.0, min_experience=1.0
    )
    proj.required_skills = [
        ProjectRequiredSkill(project_id=1, skill_id=1, min_proficiency=2, is_mandatory=True, skill=s_backend),
        ProjectRequiredSkill(project_id=1, skill_id=2, min_proficiency=2, is_mandatory=True, skill=s_frontend),
    ]

    res = optimize_project_team(proj, [emp1, emp2])
    assert res.is_fully_feasible is True
    assert res.recommended_team.skill_coverage_percent == 100.0
    assert len(res.recommended_team.members) == 2
    assert len(res.recommended_team.uncovered_mandatory_skills) == 0


def test_team_optimizer_detects_infeasible():
    s_ai = Skill(id=3, name="Quantum Computing", category="AI")
    emp = Employee(
        id=1, name="Standard Dev", employee_code="E1", email="e1@test.com",
        department="Engineering", job_title="Dev", years_of_experience=2.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    emp.skills = []
    emp.assignments = []

    proj = Project(
        id=2, name="Quantum Project", department="Research",
        required_team_size=1, estimated_weekly_hours=20.0, min_experience=2.0
    )
    proj.required_skills = [
        ProjectRequiredSkill(project_id=2, skill_id=3, min_proficiency=3, is_mandatory=True, skill=s_ai)
    ]

    res = optimize_project_team(proj, [emp])
    assert res.is_fully_feasible is False
    assert "Quantum Computing" in res.recommended_team.uncovered_mandatory_skills

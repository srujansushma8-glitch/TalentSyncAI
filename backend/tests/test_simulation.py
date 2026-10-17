import pytest
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.skill import Skill, EmployeeSkill
from backend.app.models.project import Project, ProjectRequiredSkill
from backend.app.services.simulation_service import run_what_if_simulation
from backend.app.schemas.simulation import SimulationParams, CandidateOverride


def test_simulation_does_not_mutate_live_data():
    s_py = Skill(id=1, name="Python", category="Backend")
    emp1 = Employee(
        id=1, name="Emp One", employee_code="E1", email="e1@test.com",
        department="Engineering", job_title="Dev", years_of_experience=4.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    emp1.skills = [EmployeeSkill(employee_id=1, skill_id=1, proficiency_level=3, skill=s_py)]
    emp1.assignments = []

    proj = Project(
        id=1, name="Proj Live", department="Engineering",
        required_team_size=1, estimated_weekly_hours=20.0, min_experience=1.0
    )
    proj.required_skills = [
        ProjectRequiredSkill(project_id=1, skill_id=1, min_proficiency=2, is_mandatory=True, skill=s_py)
    ]

    # Run simulation simulating candidate as EXCLUDED
    params = SimulationParams(
        project_id=1,
        adjusted_team_size=1,
        candidate_overrides=[CandidateOverride(employee_id=1, is_excluded=True)]
    )

    comparison = run_what_if_simulation(proj, [emp1], params)

    # In simulation, emp1 was excluded so simulated team has no members
    assert len(comparison.simulated_members) == 0

    # Live model MUST remain untouched!
    assert emp1.availability_status == AvailabilityStatus.AVAILABLE
    assert emp1.is_active is True
    assert len(emp1.assignments) == 0
    assert proj.required_team_size == 1

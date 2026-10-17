import pytest
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.skill import Skill, EmployeeSkill
from backend.app.models.project import Project, ProjectRequiredSkill, ProjectPriority, ProjectStatus
from backend.app.services.matching_engine import calculate_candidate_match
from backend.app.schemas.matching import MatchingWeights


def test_exact_weights_validation():
    emp = Employee(
        id=999,
        name="Test Dev",
        employee_code="EMP-999",
        email="test@example.com",
        department="Engineering",
        job_title="Developer",
        years_of_experience=5.0,
        weekly_working_hours=40.0,
        availability_status=AvailabilityStatus.AVAILABLE,
        is_active=True
    )
    emp.skills = []
    emp.assignments = []

    proj = Project(
        name="Test Proj",
        department="Engineering",
        required_team_size=2,
        estimated_weekly_hours=20.0,
        min_experience=2.0
    )
    proj.required_skills = []

    # Valid default weights: 0.40 + 0.20 + 0.25 + 0.15 = 1.00
    weights = MatchingWeights()
    match = calculate_candidate_match(emp, proj, weights=weights)
    assert match.match_score >= 0.0

    # Invalid weights not summing to 1.0 should raise ValueError
    invalid_weights = MatchingWeights(skill_weight=0.5, experience_weight=0.5, availability_weight=0.5, proficiency_weight=0.5)
    with pytest.raises(ValueError):
        calculate_candidate_match(emp, proj, weights=invalid_weights)


def test_matching_formula_calculation():
    # Setup skills
    s_python = Skill(id=1, name="Python", category="Backend")
    s_react = Skill(id=2, name="React", category="Frontend")

    emp = Employee(
        id=1,
        name="Alice Dev",
        employee_code="EMP-001",
        email="alice@example.com",
        department="Engineering",
        job_title="Full Stack Engineer",
        years_of_experience=5.0,
        weekly_working_hours=40.0,
        availability_status=AvailabilityStatus.AVAILABLE,
        is_active=True
    )
    emp.skills = [
        EmployeeSkill(employee_id=1, skill_id=1, proficiency_level=3, skill=s_python),
        EmployeeSkill(employee_id=1, skill_id=2, proficiency_level=2, skill=s_react),
    ]
    emp.assignments = []

    proj = Project(
        id=1,
        name="AI Platform",
        department="Engineering",
        required_team_size=2,
        estimated_weekly_hours=20.0,  # 10h per member
        min_experience=3.0
    )
    proj.required_skills = [
        ProjectRequiredSkill(project_id=1, skill_id=1, min_proficiency=3, is_mandatory=True, skill=s_python),
        ProjectRequiredSkill(project_id=1, skill_id=2, min_proficiency=3, is_mandatory=False, skill=s_react),
    ]

    match = calculate_candidate_match(emp, proj)

    # Weights: 40% skill, 20% experience, 25% availability, 15% proficiency
    # Both skills matched: skill_score = 100.0
    assert match.skill_score == 100.0
    # Availability: 40h available >= 10h proposed -> availability_score = 100.0
    assert match.availability_score == 100.0
    # Experience: 5.0 >= 3.0 min exp -> 80 + (2.0/5.0)*20 = 88.0
    assert match.experience_score == 88.0
    # Proficiency: Python: 3/3 (100%), React: 2/3 (66.67%) -> Avg = 83.33%
    assert round(match.proficiency_score, 1) == 83.3

    # Total score formula:
    expected_match = 0.40 * 100.0 + 0.20 * 88.0 + 0.25 * 100.0 + 0.15 * 83.333
    assert abs(match.match_score - expected_match) < 0.5
    assert not match.has_hard_constraint_violation


def test_hard_constraints_override():
    # Candidate with high skills but UNAVAILABLE status
    s_python = Skill(id=1, name="Python", category="Backend")
    emp = Employee(
        id=2,
        name="Bob Busy",
        employee_code="EMP-002",
        email="bob@example.com",
        department="Engineering",
        job_title="Architect",
        years_of_experience=10.0,
        weekly_working_hours=40.0,
        availability_status=AvailabilityStatus.UNAVAILABLE,
        is_active=True
    )
    emp.skills = [EmployeeSkill(employee_id=2, skill_id=1, proficiency_level=4, skill=s_python)]
    emp.assignments = []

    proj = Project(
        id=1,
        name="Critical Proj",
        department="Engineering",
        required_team_size=1,
        estimated_weekly_hours=20.0,
        min_experience=2.0
    )
    proj.required_skills = [
        ProjectRequiredSkill(project_id=1, skill_id=1, min_proficiency=3, is_mandatory=True, skill=s_python)
    ]

    match = calculate_candidate_match(emp, proj)
    # Availability score must drop to 0 because status is UNAVAILABLE
    assert match.availability_score == 0.0
    assert match.has_hard_constraint_violation is True
    assert any("Unavailable" in v for v in match.violations)

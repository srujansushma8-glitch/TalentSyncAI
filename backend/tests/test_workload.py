import pytest
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.assignment import Assignment
from backend.app.models.project import Project
from backend.app.services.workload_service import calculate_workforce_workload


def test_workload_and_capacity_calculations():
    # 1. Overloaded employee (48h committed / 40h capacity = 120%)
    emp_over = Employee(
        id=1, name="Overloaded Dev", employee_code="E1", email="e1@test.com",
        department="Engineering", job_title="Tech Lead", years_of_experience=8.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    p1 = Project(id=1, name="Project Alpha", department="Engineering")
    p1.required_skills = []
    asgn1 = Assignment(id=1, project_id=1, employee_id=1, assigned_weekly_hours=48.0, status="active", project=p1)
    emp_over.assignments = [asgn1]
    emp_over.skills = []

    # 2. Underutilized employee (10h committed / 40h capacity = 25%)
    emp_under = Employee(
        id=2, name="Underutilized Dev", employee_code="E2", email="e2@test.com",
        department="Engineering", job_title="Junior Dev", years_of_experience=2.0,
        weekly_working_hours=40.0, availability_status=AvailabilityStatus.AVAILABLE, is_active=True
    )
    asgn2 = Assignment(id=2, project_id=1, employee_id=2, assigned_weekly_hours=10.0, status="active", project=p1)
    emp_under.assignments = [asgn2]
    emp_under.skills = []

    res = calculate_workforce_workload([emp_over, emp_under])

    assert res.overloaded_count == 1
    assert res.underutilized_count == 1
    assert emp_over.committed_hours == 48.0
    assert emp_over.remaining_capacity == 0.0
    assert emp_over.utilization_percent == 120.0

    assert emp_under.committed_hours == 10.0
    assert emp_under.remaining_capacity == 30.0
    assert emp_under.utilization_percent == 25.0

    # Rebalance suggestion should suggest transferring hours from emp_over to emp_under
    assert len(res.rebalance_suggestions) > 0
    sugg = res.rebalance_suggestions[0]
    assert sugg.overloaded_employee_id == 1
    assert sugg.candidate_recipient_id == 2

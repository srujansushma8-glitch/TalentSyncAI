from typing import List, Dict
from backend.app.models.employee import Employee
from backend.app.schemas.workload import (
    EmployeeWorkloadItem,
    WorkloadSummaryResponse,
    RebalanceSuggestion,
)


def calculate_workforce_workload(all_employees: List[Employee]) -> WorkloadSummaryResponse:
    """
    Computes capacity, utilization, and identifies overload risks with redistribution suggestions.
    """
    workload_items: List[EmployeeWorkloadItem] = []
    overloaded: List[EmployeeWorkloadItem] = []
    underutilized: List[EmployeeWorkloadItem] = []
    optimal_count = 0

    total_util = 0.0
    active_employees = [e for e in all_employees if e.is_active]

    for emp in active_employees:
        comm = emp.committed_hours
        cap = max(0.0, emp.weekly_working_hours - comm)
        u_pct = emp.utilization_percent

        if u_pct > 100.0:
            status = "OVERLOADED"
            item = EmployeeWorkloadItem(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                employee_name=emp.name,
                department=emp.department,
                job_title=emp.job_title,
                weekly_working_hours=emp.weekly_working_hours,
                committed_hours=comm,
                remaining_capacity=cap,
                utilization_percent=u_pct,
                status=status,
                active_assignments_count=len([a for a in emp.assignments if a.status == "active"])
            )
            overloaded.append(item)
            workload_items.append(item)
        elif u_pct < 70.0:
            status = "UNDERUTILIZED"
            item = EmployeeWorkloadItem(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                employee_name=emp.name,
                department=emp.department,
                job_title=emp.job_title,
                weekly_working_hours=emp.weekly_working_hours,
                committed_hours=comm,
                remaining_capacity=cap,
                utilization_percent=u_pct,
                status=status,
                active_assignments_count=len([a for a in emp.assignments if a.status == "active"])
            )
            underutilized.append(item)
            workload_items.append(item)
        else:
            status = "OPTIMAL"
            optimal_count += 1
            item = EmployeeWorkloadItem(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                employee_name=emp.name,
                department=emp.department,
                job_title=emp.job_title,
                weekly_working_hours=emp.weekly_working_hours,
                committed_hours=comm,
                remaining_capacity=cap,
                utilization_percent=u_pct,
                status=status,
                active_assignments_count=len([a for a in emp.assignments if a.status == "active"])
            )
            workload_items.append(item)

        total_util += u_pct

    avg_util = round(total_util / len(active_employees), 1) if active_employees else 0.0

    # Build Rebalancing Suggestions
    rebalance_suggestions: List[RebalanceSuggestion] = []
    # For each overloaded employee, inspect their active assignments
    for ov_emp_item in overloaded:
        # Find the Employee model
        emp_model = next((e for e in active_employees if e.id == ov_emp_item.employee_id), None)
        if not emp_model:
            continue

        active_asgns = [a for a in emp_model.assignments if a.status == "active"]
        for asgn in active_asgns:
            project = asgn.project
            if not project:
                continue

            # Look for an underutilized employee in the same department or with compatible skills
            for un_emp_item in underutilized:
                un_emp_model = next((e for e in active_employees if e.id == un_emp_item.employee_id), None)
                if not un_emp_model or un_emp_model.id == emp_model.id:
                    continue

                # Check if un_emp has available hours
                needed_hours = min(asgn.assigned_weekly_hours, ov_emp_item.committed_hours - ov_emp_item.weekly_working_hours)
                if needed_hours <= 0:
                    needed_hours = min(10.0, asgn.assigned_weekly_hours)

                if un_emp_model.remaining_capacity >= needed_hours:
                    # Check skill overlap with project
                    project_skill_ids = {r.skill_id for r in project.required_skills}
                    un_skill_ids = {es.skill_id for es in un_emp_model.skills}
                    overlap = project_skill_ids.intersection(un_skill_ids)

                    if overlap or un_emp_model.department == project.department:
                        new_recipient_hours = un_emp_model.committed_hours + needed_hours
                        new_recipient_u = round((new_recipient_hours / un_emp_model.weekly_working_hours) * 100.0, 1)

                        rebalance_suggestions.append(RebalanceSuggestion(
                            overloaded_employee_id=emp_model.id,
                            overloaded_employee_name=emp_model.name,
                            target_project_id=project.id,
                            target_project_name=project.name,
                            current_assigned_hours=asgn.assigned_weekly_hours,
                            suggested_hours_to_transfer=round(needed_hours, 1),
                            candidate_recipient_id=un_emp_model.id,
                            candidate_recipient_name=un_emp_model.name,
                            candidate_current_utilization=un_emp_item.utilization_percent,
                            candidate_projected_utilization=new_recipient_u,
                            justification=f"Relieves {emp_model.name}'s overload ({ov_emp_item.utilization_percent:.0f}%) by transferring {needed_hours:.0f}h to {un_emp_model.name} ({un_emp_item.utilization_percent:.0f}% -> {new_recipient_u:.0f}% utilization)."
                        ))
                        break  # Found a good recipient for this assignment

    # Sort workload items: Overloaded first, then Underutilized, then Optimal
    status_order = {"OVERLOADED": 0, "UNDERUTILIZED": 1, "OPTIMAL": 2}
    workload_items.sort(key=lambda x: (status_order.get(x.status, 3), -x.utilization_percent))

    return WorkloadSummaryResponse(
        total_employees=len(active_employees),
        average_utilization_percent=avg_util,
        overloaded_count=len(overloaded),
        optimal_count=optimal_count,
        underutilized_count=len(underutilized),
        overloaded_employees=overloaded,
        underutilized_employees=underutilized,
        all_employees=workload_items,
        rebalance_suggestions=rebalance_suggestions
    )

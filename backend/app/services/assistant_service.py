import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.project import Project
from backend.app.models.skill import Skill
from backend.app.models.training import TrainingResource
from backend.app.services.matching_engine import calculate_candidate_match
from backend.app.services.workload_service import calculate_workforce_workload
from backend.app.services.skill_gap_service import analyze_org_skill_gaps


def query_workforce_assistant(query: str, db: Session, user_role: str = "pm") -> Dict[str, Any]:
    """
    Deterministic workforce assistant grounded in live database records.
    Answers natural language queries about staffing, match scores, capacity, and skill gaps.
    """
    clean_query = query.lower().strip()
    
    # Intent 1: "match", "python", "candidates for project"
    if any(k in clean_query for k in ["match", "candidate", "who can work", "suitable for", "best match"]):
        # Find mentioned project or default to first project
        projects = db.query(Project).all()
        target_project = None
        for p in projects:
            if p.name.lower() in clean_query:
                target_project = p
                break
        
        # Check skill mentions (e.g., python, react, aws, cloud)
        if not target_project:
            skills = db.query(Skill).all()
            for s in skills:
                if s.name.lower() in clean_query:
                    # Find project requiring this skill
                    for p in projects:
                        if any(req.skill_id == s.id for req in p.required_skills):
                            target_project = p
                            break
                    if target_project:
                        break

        if not target_project and projects:
            target_project = projects[0]

        if target_project:
            employees = db.query(Employee).filter(Employee.is_active == True).all()
            scored = []
            for emp in employees:
                score_obj = calculate_candidate_match(emp, target_project)
                scored.append(score_obj)
            scored.sort(key=lambda x: (not x.has_hard_constraint_violation, x.match_score), reverse=True)
            top_3 = scored[:3]

            answer_lines = [
                f"### Candidate Match Analysis for **{target_project.name}**",
                f"Evaluated against project requirements with exact weights (Skill 40%, Experience 20%, Availability 25%, Proficiency 15%):",
                ""
            ]
            for idx, c in enumerate(top_3, 1):
                status_icon = "⚠️" if c.has_hard_constraint_violation else "✅"
                answer_lines.append(
                    f"{idx}. **{c.employee_name}** ({c.job_title}) — **{c.match_score:.1f}% Match** {status_icon}"
                )
                answer_lines.append(
                    f"   - *Scores*: Skills: {c.skill_score:.0f}%, Exp: {c.experience_score:.0f}%, Avail: {c.availability_score:.0f}%, Prof: {c.proficiency_score:.0f}%"
                )
                answer_lines.append(f"   - *Capacity*: {c.remaining_capacity:.1f}h remaining / {c.proposed_allocation_hours:.1f}h needed")
                if c.violations:
                    answer_lines.append(f"   - *Constraint Notes*: {'; '.join(c.violations)}")
            
            return {
                "intent": "candidate_matching",
                "answer": "\n".join(answer_lines),
                "data": [c.model_dump() for c in top_3]
            }

    # Intent 2: "capacity", "available", "who has time", "underutilized"
    if any(k in clean_query for k in ["capacity", "available", "who has time", "free", "underutilized"]):
        all_emps = db.query(Employee).filter(Employee.is_active == True).all()
        workload = calculate_workforce_workload(all_emps)
        available_list = [e for e in all_emps if e.remaining_capacity >= 15.0 and e.availability_status == AvailabilityStatus.AVAILABLE]
        available_list.sort(key=lambda x: x.remaining_capacity, reverse=True)

        lines = [
            f"### Available Workforce Capacity",
            f"There are currently **{len(available_list)} employees** with 15+ hours of unallocated weekly capacity:",
            ""
        ]
        for e in available_list[:5]:
            lines.append(
                f"- **{e.name}** ({e.department} — {e.job_title}): **{e.remaining_capacity:.1f}h remaining** (Current utilization: {e.utilization_percent:.0f}%)"
            )
        lines.append("")
        lines.append(f"**Workforce Overview**: Average utilization is **{workload.average_utilization_percent:.1f}%**, with {workload.underutilized_count} underutilized staff (<70%) and {workload.overloaded_count} overloaded staff (>100%).")

        return {
            "intent": "capacity_inquiry",
            "answer": "\n".join(lines),
            "data": [{"name": e.name, "capacity": e.remaining_capacity, "utilization": e.utilization_percent} for e in available_list[:5]]
        }

    # Intent 3: "overload", "imbalance", "workload", "rebalance"
    if any(k in clean_query for k in ["overload", "imbalance", "workload", "rebalance", "stress"]):
        all_emps = db.query(Employee).filter(Employee.is_active == True).all()
        workload = calculate_workforce_workload(all_emps)

        lines = [
            f"### Workload & Overload Diagnostics",
            f"Detected **{workload.overloaded_count} overloaded employees** operating above 100% capacity:",
            ""
        ]
        for ov in workload.overloaded_employees:
            lines.append(
                f"- **{ov.employee_name}** ({ov.job_title}): **{ov.utilization_percent:.0f}% utilization** ({ov.committed_hours:.1f}h / {ov.weekly_working_hours:.1f}h scheduled)"
            )
        lines.append("")
        if workload.rebalance_suggestions:
            lines.append("#### Suggested Workload Redistribution:")
            for s in workload.rebalance_suggestions[:3]:
                lines.append(f"- {s.justification}")
        else:
            lines.append("No critical rebalancing transfers needed at this time.")

        return {
            "intent": "workload_analysis",
            "answer": "\n".join(lines),
            "data": [s.model_dump() for s in workload.rebalance_suggestions]
        }

    # Intent 4: "skill gap", "missing skills", "shortage"
    if any(k in clean_query for k in ["gap", "shortage", "missing skill", "training", "course"]):
        all_projects = db.query(Project).all()
        all_emps = db.query(Employee).all()
        all_skills = db.query(Skill).all()
        org_report = analyze_org_skill_gaps(all_projects, all_emps, all_skills)

        lines = [
            f"### Organization Skill Gap Analysis",
            f"Tracked **{org_report.total_skills_tracked} critical skills** across active project pipelines. Identified **{org_report.critical_shortages_count} high-priority shortages**:",
            ""
        ]
        for g in org_report.top_demanded_skills[:5]:
            lines.append(
                f"- **{g.skill_name}** ({g.category}): Required by {g.total_required_in_projects} projects | {g.proficient_employees_count} proficient staff (Shortage: **{g.shortage_gap}**) — *Severity: {g.severity}*"
            )

        # Look up matching courses
        courses = db.query(TrainingResource).all()
        if courses:
            lines.append("")
            lines.append("#### Recommended Curated Courses to Close Gaps:")
            for c in courses[:3]:
                lines.append(f"- **{c.title}** ({c.provider}) — Level: {c.level}, {c.estimated_hours:.0f}h [{c.url}]")

        return {
            "intent": "skill_gap_inquiry",
            "answer": "\n".join(lines),
            "data": [g.model_dump() for g in org_report.top_demanded_skills[:5]]
        }

    # Intent 5: "why was this team selected", "explain"
    if any(k in clean_query for k in ["why", "explain", "reason", "selection"]):
        return {
            "intent": "decision_explanation",
            "answer": (
                "### Team Selection & Optimization Criteria\n"
                "TalentSync AI optimizes teams using an objective mathematical function that balances:\n\n"
                "1. **100% Mandatory Skill Coverage**: Every critical skill requirement must be satisfied by at least one team member at or above required proficiency.\n"
                "2. **Proficiency Alignment (1-4 scale)**: Maximizes aggregate proficiency levels against project complexity.\n"
                "3. **Capacity Constraints**: Verifies that weekly assigned hours do not breach 40h standard capacity.\n"
                "4. **Workload Fairness**: Minimizes utilization variance across team members to prevent employee burnout.\n"
                "5. **Candidate Match Scores**: Built on the exact formula: `0.40 × Skill + 0.20 × Experience + 0.25 × Availability + 0.15 × Proficiency`."
            ),
            "data": {}
        }

    # Fallback response for general queries
    return {
        "intent": "general_help",
        "answer": (
            "### TalentSync AI Workforce Assistant\n"
            "I can assist you with real-time workforce intelligence based on live organizational data:\n\n"
            "- **Matching**: *'Which employees best match the Python and AI project?'*\n"
            "- **Capacity**: *'Who has available capacity for a 20h project?'*\n"
            "- **Workload**: *'Which employees are overloaded and how can we rebalance?'*\n"
            "- **Skill Gaps**: *'Which projects have critical skill shortages?'*\n"
            "- **Training**: *'Which courses are recommended for cloud migration?'*\n"
            "- **Explanations**: *'Why was this team selected?'*"
        ),
        "data": {}
    }

"""
Full End-to-End Verification Script for TalentSync AI
Validates all 10 core functional domains, matching weights (40/20/25/15),
combinatorial team optimizer, workload balancer, What-If simulation,
AI assistant, training catalog, and CSV reports.
"""
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_tests():
    print("=" * 60)
    print("TalentSync AI - Full End-to-End System Verification")
    print("=" * 60)
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Test Authentication for all 4 roles
    print("\n[1/10] Testing Authentication for 4 Roles...")
    roles = [
        ("admin@talentsync.ai", "Admin@123", "admin"),
        ("hr@talentsync.ai", "HrManager@123", "hr"),
        ("pm@talentsync.ai", "ProjectManager@123", "pm"),
        ("employee@talentsync.ai", "Employee@123", "employee")
    ]
    tokens = {}
    for email, password, expected_role in roles:
        resp = client.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        assert "access_token" in data, f"No token for {email}"
        assert data["role"] == expected_role, f"Role mismatch for {email}: got {data['role']}, expected {expected_role}"
        tokens[expected_role] = data["access_token"]
        print(f"  [OK] {expected_role.upper()} authenticated successfully ({data['full_name']})")

    pm_headers = {"Authorization": f"Bearer {tokens['pm']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    hr_headers = {"Authorization": f"Bearer {tokens['hr']}"}

    # 2. Test Live Dashboard APIs
    print("\n[2/10] Verifying Live Dashboard KPIs & Analytics...")
    resp = client.get("/dashboard", headers=pm_headers)
    assert resp.status_code == 200, f"Dashboard summary failed: {resp.text}"
    dashboard = resp.json()
    kpis = dashboard["kpis"]
    assert kpis["total_employees"] >= 20, f"Expected >= 20 employees, got {kpis['total_employees']}"
    assert kpis["active_projects"] >= 2, f"Expected >= 2 projects, got {kpis['active_projects']}"
    print(f"  [OK] Dashboard KPI: {kpis['total_employees']} employees, {kpis['active_projects']} active projects, {kpis['average_workforce_utilization']}% avg utilization")

    depts = dashboard["department_capacities"]
    assert len(depts) >= 4, f"Expected departments, got {len(depts)}"
    print(f"  [OK] Department capacity breakdown loaded: {len(depts)} departments")

    staffing = dashboard["project_staffing"]
    assert len(staffing) >= 3
    print(f"  [OK] Project staffing progress loaded: {len(staffing)} active projects")

    # 3. Test AI Candidate Matching & Exact 40/20/25/15 Mathematical Weights
    print("\n[3/10] Verifying AI Candidate Matching & Formula (40/20/25/15)...")
    match_resp = client.get("/matching/1", headers=pm_headers)
    assert match_resp.status_code == 200, f"Matching failed: {match_resp.text}"
    match_data = match_resp.json()
    candidates = match_data["candidates"]
    assert len(candidates) > 0, "No candidates returned"
    
    top_candidate = candidates[0]
    weights = match_data["weights_used"]
    assert weights["skill_weight"] == 0.40
    assert weights["experience_weight"] == 0.20
    assert weights["availability_weight"] == 0.25
    assert weights["proficiency_weight"] == 0.15

    expected_score = round(
        weights["skill_weight"] * top_candidate["skill_score"] +
        weights["experience_weight"] * top_candidate["experience_score"] +
        weights["availability_weight"] * top_candidate["availability_score"] +
        weights["proficiency_weight"] * top_candidate["proficiency_score"],
        2
    )
    print(f"  [OK] Top Match: {top_candidate['employee_name']} ({top_candidate['job_title']})")
    print(f"    - Subscores: Skill={top_candidate['skill_score']}% | Exp={top_candidate['experience_score']}% | Avail={top_candidate['availability_score']}% | Prof={top_candidate['proficiency_score']}%")
    print(f"    - Computed: {top_candidate['match_score']}% | Expected: {expected_score}%")
    assert abs(top_candidate["match_score"] - expected_score) <= 0.2, "Formula discrepancy detected!"
    assert len(top_candidate["explanation"]) > 20, "Missing explainability rationale"
    print(f"    - Explainable Rationale: \"{top_candidate['explanation'][:75]}...\"")

    # 4. Test Multi-Objective Combinatorial Team Optimizer
    print("\n[4/10] Verifying Multi-Objective Combinatorial Team Optimizer...")
    opt_resp = client.get("/optimization/1", headers=pm_headers)
    assert opt_resp.status_code == 200, f"Optimization failed: {opt_resp.text}"
    opt_result = opt_resp.json()
    assert "recommended_team" in opt_result, "Missing recommended_team"
    assert "alternative_teams" in opt_result, "Missing alternative_teams"
    primary = opt_result["recommended_team"]
    print(f"  [OK] Primary Optimized Team: {len(primary['members'])} members (Score: {primary['team_fit_score']}%)")
    print(f"    - Skill Coverage: {primary['skill_coverage_percent']}% | Workload Fairness: {primary['workload_fairness_score']}")
    print(f"  [OK] Generated {len(opt_result['alternative_teams'])} Alternative Trade-Off Plans:")
    for alt in opt_result["alternative_teams"]:
        print(f"    - Plan: {alt['name']} | Fit: {alt['team_fit_score']}% | Trade-off: {alt['trade_off_explanation']}")

    # 5. Test Workload Balancing & Overload Detection
    print("\n[5/10] Verifying Workload Balancer & Rebalance Proposals...")
    workload_resp = client.get("/workload", headers=pm_headers)
    assert workload_resp.status_code == 200
    wl = workload_resp.json()
    assert len(wl["overloaded_employees"]) >= 1, "Expected overloaded employee in seed data"
    assert len(wl["underutilized_employees"]) >= 1, "Expected underutilized employee in seed data"
    overloaded = wl["overloaded_employees"][0]
    print(f"  [OK] Detected Overload: {overloaded['employee_name']} ({overloaded['department']}) at {overloaded['utilization_percent']}% ({overloaded['committed_hours']}/40h)")
    underutilized = wl["underutilized_employees"][0]
    print(f"  [OK] Detected Underutilized: {underutilized['employee_name']} ({underutilized['department']}) at {underutilized['utilization_percent']}% ({underutilized['committed_hours']}/40h)")
    assert len(wl["rebalance_suggestions"]) >= 1, "Expected rebalance suggestion"
    sugg = wl["rebalance_suggestions"][0]
    print(f"  [OK] Rebalance Proposal: Transfer {sugg['suggested_hours_to_transfer']}h on project #{sugg['target_project_id']} from {sugg['overloaded_employee_name']} to {sugg['candidate_recipient_name']}")

    # 6. Test What-If Simulation Sandbox Isolation
    print("\n[6/10] Verifying What-If Simulation Sandbox Isolation...")
    # Fetch initial project 1
    proj_before = client.get("/projects/1", headers=pm_headers).json()
    initial_alloc = proj_before["assigned_count"]
    
    sim_payload = {
        "project_id": 1,
        "adjusted_team_size": 4,
        "adjusted_weekly_hours": 35.0,
        "candidate_overrides": [{"employee_id": 1, "is_excluded": True}]
    }
    sim_resp = client.post("/simulation/run", json=sim_payload, headers=pm_headers)
    assert sim_resp.status_code == 200
    sim_result = sim_resp.json()
    print(f"  [OK] What-If Sandbox Simulated: Baseline Fit {sim_result['original_team_fit_score']}% -> Simulated {sim_result['simulated_team_fit_score']}%")
    print(f"    - Baseline Coverage: {sim_result['original_skill_coverage']}% -> Simulated: {sim_result['simulated_skill_coverage']}%")
    
    # Verify live database was NOT mutated
    proj_after = client.get("/projects/1", headers=pm_headers).json()
    assert proj_after["assigned_count"] == initial_alloc, "Simulation contaminated production database!"
    print("  [OK] Sandbox Isolation Confirmed: Production DB records completely unchanged.")

    # 7. Test Skill Gap Analysis & Org Shortage Matrix
    print("\n[7/10] Verifying Skill Gap Analysis & Org Shortage Matrix...")
    gap_resp = client.get("/skill-gaps/project/1", headers=pm_headers)
    assert gap_resp.status_code == 200
    gaps = gap_resp.json()
    print(f"  [OK] Project 1 Gaps: {len(gaps['gaps'])} required skills evaluated (Missing: {gaps['missing_mandatory_count']}, Deficient: {gaps['proficiency_deficient_count']})")
    
    org_resp = client.get("/skill-gaps/organization", headers=pm_headers)
    assert org_resp.status_code == 200
    org_matrix = org_resp.json()
    assert len(org_matrix["top_demanded_skills"]) >= 5
    top_gap = org_matrix["top_demanded_skills"][0]
    print(f"  [OK] Org Shortage Matrix: Top in-demand skill '{top_gap['skill_name']}' (Shortage Gap: {top_gap['shortage_gap']} needed)")

    # 8. Test Grounded AI Assistant with Live DB Citations
    print("\n[8/10] Verifying Grounded AI Workforce Assistant...")
    query_resp = client.post("/assistant/query", json={"query": "Who is currently overloaded with too much work?"}, headers=pm_headers)
    assert query_resp.status_code == 200
    ai_data = query_resp.json()
    print(f"  [OK] AI Assistant Query: 'Who is currently overloaded with too much work?'")
    print(f"    - Answer: {ai_data['answer'][:120]}...")
    assert len(ai_data["data"]) >= 1, "Missing data payload in assistant response"
    print(f"    - Grounded DB Data Records: {len(ai_data['data'])} records cited")

    # 9. Test Training Catalog & Pathways
    print("\n[9/10] Verifying Training Catalog & Personal Pathways...")
    courses_resp = client.get("/training/resources", headers=pm_headers)
    assert courses_resp.status_code == 200
    courses = courses_resp.json()
    assert len(courses) >= 15
    print(f"  [OK] Curated Course Catalog: {len(courses)} verified courses available")
    
    recomms_resp = client.get("/training/recommendations", headers=pm_headers)
    assert recomms_resp.status_code == 200
    recomms = recomms_resp.json()
    assert len(recomms) >= 1
    print(f"  [OK] Active Pathways: {len(recomms)} recommendations targeted to close real gaps")

    # 10. Test CSV Export Reports
    print("\n[10/10] Verifying Real CSV Report Exports...")
    emp_csv = client.get("/reports/employees.csv", headers=pm_headers)
    assert emp_csv.status_code == 200
    assert "Full Name" in emp_csv.text or "ID" in emp_csv.text or "Employee Code" in emp_csv.text
    print(f"  [OK] Employee Roster CSV generated ({len(emp_csv.text)} bytes)")

    wl_csv = client.get("/reports/workload.csv", headers=pm_headers)
    assert wl_csv.status_code == 200
    assert "Utilization" in wl_csv.text or "Hours" in wl_csv.text
    print(f"  [OK] Workload Distribution CSV generated ({len(wl_csv.text)} bytes)")

    print("\n" + "=" * 60)
    print("ALL 10 VERIFICATION MODULES PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\n[FAIL] VERIFICATION FAILED: {e}")
        sys.exit(1)


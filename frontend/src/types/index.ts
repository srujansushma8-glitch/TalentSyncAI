export type UserRole = 'admin' | 'hr' | 'pm' | 'employee';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
  email: string;
  user_id: number;
}

export interface EmployeeSkill {
  skill_id: number;
  name: string;
  category: string;
  proficiency_level: number; // 1 to 4
  is_verified: boolean;
}

export interface EmployeeAssignmentBrief {
  id: number;
  project_id: number;
  project_name: string;
  assigned_weekly_hours: number;
  role_in_project: string;
  status: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  department: string;
  job_title: string;
  years_of_experience: number;
  weekly_working_hours: number;
  availability_status: 'available' | 'partially_available' | 'unavailable';
  learning_interests?: string;
  is_active: boolean;
  committed_hours: number;
  remaining_capacity: number;
  utilization_percent: number;
  skills: EmployeeSkill[];
  assignments: EmployeeAssignmentBrief[];
}

export interface SkillCatalogItem {
  id: number;
  name: string;
  category: string;
}

export interface ProjectRequiredSkill {
  id?: number;
  skill_id: number;
  skill_name?: string;
  category?: string;
  min_proficiency: number;
  is_mandatory: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  department: string;
  status: 'draft' | 'planning' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  required_team_size: number;
  estimated_weekly_hours: number;
  min_experience: number;
  start_date?: string;
  deadline?: string;
  created_at: string;
  assigned_count: number;
  staffing_fulfillment_percent: number;
  required_skills: ProjectRequiredSkill[];
  assignments: Array<{
    id: number;
    employee_id: number;
    employee_name: string;
    assigned_weekly_hours: number;
    role_in_project: string;
    status: string;
  }>;
}

export interface MatchedSkillDetail {
  skill_id: number;
  skill_name: string;
  employee_proficiency: number;
  required_proficiency: number;
  is_mandatory: boolean;
  meets_proficiency: boolean;
}

export interface MissingSkillDetail {
  skill_id: number;
  skill_name: string;
  required_proficiency: number;
  is_mandatory: boolean;
}

export interface CandidateMatchScore {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  job_title: string;
  years_of_experience: number;
  availability_status: string;
  weekly_working_hours: number;
  committed_hours: number;
  remaining_capacity: number;
  proposed_allocation_hours: number;
  match_score: number;
  skill_score: number;
  experience_score: number;
  availability_score: number;
  proficiency_score: number;
  matched_skills: MatchedSkillDetail[];
  missing_skills: MissingSkillDetail[];
  proficiency_mismatches: MatchedSkillDetail[];
  has_hard_constraint_violation: boolean;
  violations: string[];
  warnings: string[];
  explanation: string;
}

export interface MatchingWeights {
  skill_weight: number;
  experience_weight: number;
  availability_weight: number;
  proficiency_weight: number;
}

export interface ProjectMatchingResult {
  project_id: number;
  project_name: string;
  weights_used: MatchingWeights;
  total_candidates_evaluated: number;
  eligible_candidates_count: number;
  candidates: CandidateMatchScore[];
}

export interface TeamMemberAllocation {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  job_title: string;
  assigned_hours: number;
  current_committed_hours: number;
  new_total_committed_hours: number;
  new_utilization_percent: number;
  remaining_capacity: number;
  covered_skills: string[];
}

export interface TeamOption {
  id: string;
  name: string;
  team_fit_score: number;
  is_feasible: boolean;
  skill_coverage_percent: number;
  proficiency_coverage_percent: number;
  workload_fairness_score: number;
  uncovered_mandatory_skills: string[];
  uncovered_optional_skills: string[];
  members: TeamMemberAllocation[];
  trade_off_explanation: string;
}

export interface OptimizationResponse {
  project_id: number;
  project_name: string;
  required_team_size: number;
  estimated_weekly_hours: number;
  is_fully_feasible: boolean;
  recommended_team: TeamOption;
  alternative_teams: TeamOption[];
  feasibility_notes: string[];
  solver_used: string;
}

export interface SkillGapItem {
  skill_id: number;
  skill_name: string;
  category: string;
  is_mandatory: boolean;
  required_proficiency: number;
  current_highest_proficiency: number;
  status: 'satisfied' | 'deficient_proficiency' | 'missing_completely';
  severity: 'CRITICAL' | 'MODERATE' | 'LOW' | 'NONE';
  recommended_action: string;
  viable_trainees: Array<{
    employee_id: number;
    employee_name: string;
    current_proficiency: number;
    target_proficiency: number;
    learning_effort_hours: number;
  }>;
}

export interface ProjectSkillGapReport {
  project_id: number;
  project_name: string;
  overall_health: 'HEALTHY' | 'RISK' | 'CRITICAL_GAP';
  required_skills_count: number;
  satisfied_skills_count: number;
  missing_mandatory_count: number;
  proficiency_deficient_count: number;
  gaps: SkillGapItem[];
}

export interface OrgSkillGapItem {
  skill_id: number;
  skill_name: string;
  category: string;
  total_required_in_projects: number;
  total_employees_with_skill: number;
  proficient_employees_count: number;
  shortage_gap: number;
  severity: string;
}

export interface OrgSkillGapReport {
  total_skills_tracked: number;
  critical_shortages_count: number;
  top_demanded_skills: OrgSkillGapItem[];
}

export interface TrainingResource {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_category: string;
  title: string;
  provider: string;
  url: string;
  level: string;
  estimated_hours: number;
  description: string;
}

export interface TrainingRecommendation {
  id: number;
  employee_id: number;
  employee_name: string;
  resource_id: number;
  resource_title: string;
  resource_provider: string;
  resource_url: string;
  level: string;
  estimated_hours: number;
  target_skill_name: string;
  reason: string;
  sequence_order: number;
  priority: string;
  status: 'recommended' | 'enrolled' | 'completed';
  created_at: string;
}

export interface EmployeeWorkloadItem {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  job_title: string;
  weekly_working_hours: number;
  committed_hours: number;
  remaining_capacity: number;
  utilization_percent: number;
  status: 'OVERLOADED' | 'OPTIMAL' | 'UNDERUTILIZED';
  active_assignments_count: number;
}

export interface RebalanceSuggestion {
  overloaded_employee_id: number;
  overloaded_employee_name: string;
  target_project_id: number;
  target_project_name: string;
  current_assigned_hours: number;
  suggested_hours_to_transfer: number;
  candidate_recipient_id: number;
  candidate_recipient_name: string;
  candidate_current_utilization: number;
  candidate_projected_utilization: number;
  justification: string;
}

export interface WorkloadSummaryResponse {
  total_employees: number;
  average_utilization_percent: number;
  overloaded_count: number;
  optimal_count: number;
  underutilized_count: number;
  overloaded_employees: EmployeeWorkloadItem[];
  underutilized_employees: EmployeeWorkloadItem[];
  all_employees: EmployeeWorkloadItem[];
  rebalance_suggestions: RebalanceSuggestion[];
}

export interface SimulationMemberDiff {
  employee_id: number;
  employee_name: string;
  status: 'retained' | 'added' | 'removed';
  allocated_hours: number;
  utilization_before: number;
  utilization_after: number;
}

export interface SimulationComparison {
  project_id: number;
  project_name: string;
  simulation_id: string;
  original_team_size: number;
  simulated_team_size: number;
  original_weekly_hours: number;
  simulated_weekly_hours: number;
  original_skill_coverage: number;
  simulated_skill_coverage: number;
  original_team_fit_score: number;
  simulated_team_fit_score: number;
  original_members: TeamMemberAllocation[];
  simulated_members: TeamMemberAllocation[];
  member_diffs: SimulationMemberDiff[];
  resolved_gaps: string[];
  new_capacity_warnings: string[];
  trade_off_summary: string;
}

export interface DashboardAnalytics {
  kpis: {
    total_employees: number;
    active_projects: number;
    available_employees: number;
    projects_with_staffing_gaps: number;
    overloaded_employees: number;
    underutilized_employees: number;
    average_workforce_utilization: number;
    overall_skill_coverage_percent: number;
  };
  utilization_distribution: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  department_capacities: Array<{
    department: string;
    total_headcount: number;
    total_capacity_hours: number;
    allocated_hours: number;
    utilization_rate: number;
  }>;
  skill_distributions: Array<{
    category: string;
    employee_count: number;
    avg_proficiency: number;
  }>;
  project_staffing: Array<{
    project_id: number;
    project_name: string;
    priority: string;
    required_team_size: number;
    assigned_count: number;
    fulfillment_percent: number;
    has_gaps: boolean;
  }>;
  recent_activity: Array<{
    id: number;
    action: string;
    details: string;
    timestamp: string;
  }>;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

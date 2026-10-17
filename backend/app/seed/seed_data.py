import datetime
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, Base, engine
from backend.app.models.user import User, UserRole
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.skill import Skill, EmployeeSkill
from backend.app.models.project import Project, ProjectStatus, ProjectPriority, ProjectRequiredSkill
from backend.app.models.assignment import Assignment
from backend.app.models.training import TrainingResource, TrainingRecommendation
from backend.app.models.notification import Notification
from backend.app.models.audit import AuditLog
from backend.app.services.auth_service import hash_password


def seed_database(db: Session = None):
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        # Clear existing tables cleanly
        db.query(AuditLog).delete()
        db.query(Notification).delete()
        db.query(TrainingRecommendation).delete()
        db.query(TrainingResource).delete()
        db.query(Assignment).delete()
        db.query(ProjectRequiredSkill).delete()
        db.query(Project).delete()
        db.query(EmployeeSkill).delete()
        db.query(Employee).delete()
        db.query(Skill).delete()
        db.query(User).delete()
        db.commit()

        # 1. Create Core Demo Users
        users = [
            User(
                email="admin@talentsync.ai",
                hashed_password=hash_password("Admin@123"),
                full_name="Sarah Jenkins (Admin)",
                role=UserRole.ADMIN,
                is_active=True
            ),
            User(
                email="hr@talentsync.ai",
                hashed_password=hash_password("HrManager@123"),
                full_name="Marcus Vance (HR Director)",
                role=UserRole.HR,
                is_active=True
            ),
            User(
                email="pm@talentsync.ai",
                hashed_password=hash_password("ProjectManager@123"),
                full_name="Elena Rostova (Lead PM)",
                role=UserRole.PM,
                is_active=True
            ),
            User(
                email="employee@talentsync.ai",
                hashed_password=hash_password("Employee@123"),
                full_name="Alex Chen (Senior AI Engineer)",
                role=UserRole.EMPLOYEE,
                is_active=True
            ),
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)

        admin_user = users[0]
        pm_user = users[2]
        employee_user = users[3]

        # 2. Seed Skills (Categorized)
        skills_data = [
            # Backend
            ("Python", "Backend", "Core Python, asyncio, data processing"),
            ("FastAPI", "Backend", "Modern high-performance asynchronous API framework"),
            ("Node.js", "Backend", "Server-side JavaScript and event-driven runtime"),
            ("Go", "Backend", "Concurrent microservices and distributed tooling"),
            ("Java", "Backend", "Enterprise microservices and Spring framework"),
            # Frontend
            ("React", "Frontend", "Component-driven UI architecture and state hooks"),
            ("TypeScript", "Frontend", "Static typing for modern enterprise web applications"),
            ("Tailwind CSS", "Frontend", "Utility-first design system styling"),
            ("Next.js", "Frontend", "React server components and web platform framework"),
            # AI / ML & Data
            ("PyTorch", "AI/ML", "Deep learning neural network modeling and training"),
            ("TensorFlow", "AI/ML", "Production machine learning pipelines and inference"),
            ("NLP & LLMs", "AI/ML", "Prompt engineering, embeddings, and fine-tuning"),
            ("Data Modeling", "Data", "Dimensional modeling, ETL pipelines, and warehousing"),
            ("SQL", "Data", "Complex relational queries, indexing, and optimization"),
            ("PowerBI", "Data", "Business intelligence dashboards and enterprise reporting"),
            # Cloud & DevOps
            ("AWS", "Cloud", "EC2, S3, ECS, Lambda, IAM, and serverless architecture"),
            ("Docker", "DevOps", "Containerization, image builds, and multi-stage pipelines"),
            ("Kubernetes", "DevOps", "Orchestration, Helm charts, ingress, and auto-scaling"),
            ("Terraform", "DevOps", "Infrastructure as code and multi-cloud provisioning"),
            ("CI/CD", "DevOps", "GitHub Actions, automated testing, and release delivery"),
            # Security
            ("Network Security", "Security", "Firewall rules, zero-trust network access, and VPNs"),
            ("Penetration Testing", "Security", "Vulnerability assessment, OWASP top 10 auditing"),
            ("Compliance & SOC2", "Security", "Security compliance standards and security policies"),
        ]

        skills_dict = {}
        for name, cat, desc in skills_data:
            s = Skill(name=name, category=cat, description=desc)
            db.add(s)
            skills_dict[name] = s
        db.commit()
        for s in skills_dict.values():
            db.refresh(s)

        # 3. Seed 22 Synthetic Employees with Varied Capacity & Skills
        employees_spec = [
            # 1. Alex Chen (Linked to employee demo account) - AI/ML Specialist, balanced
            ("Alex Chen", "alex.chen@talentsync.ai", "Data & AI", "Senior AI Engineer", 6.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("Python", 4), ("PyTorch", 4), ("NLP & LLMs", 4), ("FastAPI", 3), ("SQL", 3)], employee_user.id),

            # 2. Maya Lin - Cloud/DevOps Lead, heavily committed (overloaded scenario)
            ("Maya Lin", "maya.lin@talentsync.ai", "Cloud & DevOps", "Principal Cloud Architect", 9.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("AWS", 4), ("Kubernetes", 4), ("Docker", 4), ("Terraform", 4), ("CI/CD", 3)], None),

            # 3. David Kumar - Full Stack Web, available
            ("David Kumar", "david.kumar@talentsync.ai", "Engineering", "Senior Full-Stack Engineer", 5.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("React", 4), ("TypeScript", 4), ("Node.js", 3), ("Tailwind CSS", 4), ("SQL", 2)], None),

            # 4. Rachel Green - Frontend Developer, underutilized
            ("Rachel Green", "rachel.green@talentsync.ai", "Engineering", "Frontend Engineer", 2.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("React", 3), ("TypeScript", 3), ("Tailwind CSS", 3), ("Next.js", 2)], None),

            # 5. Samuel Taylor - DevOps Engineer, partially available
            ("Samuel Taylor", "samuel.taylor@talentsync.ai", "Cloud & DevOps", "DevOps Engineer", 3.5, 40.0, AvailabilityStatus.PARTIALLY_AVAILABLE,
             [("Docker", 3), ("Kubernetes", 2), ("AWS", 3), ("CI/CD", 3), ("Python", 2)], None),

            # 6. Priya Sharma - Data Analyst, available
            ("Priya Sharma", "priya.sharma@talentsync.ai", "Data & AI", "Lead Data Analyst", 7.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("SQL", 4), ("PowerBI", 4), ("Data Modeling", 4), ("Python", 3)], None),

            # 7. James Wilson - Security Specialist, available
            ("James Wilson", "james.wilson@talentsync.ai", "Cybersecurity", "Senior Security Analyst", 8.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Network Security", 4), ("Penetration Testing", 4), ("Compliance & SOC2", 3)], None),

            # 8. Sophia Martinez - Security Engineer, currently unavailable (Hard constraint test)
            ("Sophia Martinez", "sophia.martinez@talentsync.ai", "Cybersecurity", "Compliance Specialist", 4.0, 40.0, AvailabilityStatus.UNAVAILABLE,
             [("Compliance & SOC2", 4), ("Network Security", 2)], None),

            # 9. Carlos Rossi - Backend Engineer, available
            ("Carlos Rossi", "carlos.rossi@talentsync.ai", "Engineering", "Backend Engineer", 4.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("Python", 3), ("FastAPI", 4), ("SQL", 3), ("Docker", 2)], None),

            # 10. Emily Watson - Machine Learning Engineer, available
            ("Emily Watson", "emily.watson@talentsync.ai", "Data & AI", "ML Engineer", 3.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Python", 3), ("TensorFlow", 3), ("PyTorch", 2), ("Data Modeling", 2)], None),

            # 11. Liam O'Connor - Cloud Engineer, available
            ("Liam O'Connor", "liam.oconnor@talentsync.ai", "Cloud & DevOps", "Cloud Solutions Architect", 6.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("AWS", 3), ("Terraform", 3), ("Docker", 3), ("Python", 2)], None),

            # 12. Olivia Zhao - Junior Full-Stack, underutilized
            ("Olivia Zhao", "olivia.zhao@talentsync.ai", "Engineering", "Junior Full-Stack Developer", 1.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("React", 2), ("TypeScript", 2), ("Node.js", 2), ("Tailwind CSS", 3)], None),

            # 13. Ethan Patel - Senior Backend, heavily committed
            ("Ethan Patel", "ethan.patel@talentsync.ai", "Engineering", "Staff Backend Engineer", 10.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Go", 4), ("Java", 4), ("Python", 3), ("Docker", 3), ("SQL", 4)], None),

            # 14. Chloe Martin - Data Engineer, available
            ("Chloe Martin", "chloe.martin@talentsync.ai", "Data & AI", "Senior Data Engineer", 5.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("SQL", 4), ("Data Modeling", 4), ("Python", 3), ("AWS", 2)], None),

            # 15. Daniel Jackson - Infrastructure, available
            ("Daniel Jackson", "daniel.jackson@talentsync.ai", "Cloud & DevOps", "Site Reliability Engineer", 4.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Kubernetes", 3), ("Docker", 4), ("CI/CD", 3), ("AWS", 2)], None),

            # 16. Grace Kim - UI/UX Frontend, underutilized
            ("Grace Kim", "grace.kim@talentsync.ai", "Engineering", "UI Engineer", 2.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("React", 3), ("Tailwind CSS", 4), ("TypeScript", 2)], None),

            # 17. Henry Adams - Cybersecurity, available
            ("Henry Adams", "henry.adams@talentsync.ai", "Cybersecurity", "Penetration Tester", 3.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("Penetration Testing", 3), ("Network Security", 3), ("Python", 2)], None),

            # 18. Isabel Gomez - AI Researcher, available
            ("Isabel Gomez", "isabel.gomez@talentsync.ai", "Data & AI", "AI Research Scientist", 7.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("PyTorch", 4), ("TensorFlow", 4), ("NLP & LLMs", 3), ("Python", 4)], None),

            # 19. Benjamin Scott - Full Stack, available
            ("Benjamin Scott", "benjamin.scott@talentsync.ai", "Engineering", "Software Engineer", 3.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Node.js", 3), ("React", 3), ("TypeScript", 3), ("SQL", 2)], None),

            # 20. Natalie Brown - Cloud DevOps, available
            ("Natalie Brown", "natalie.brown@talentsync.ai", "Cloud & DevOps", "DevOps Engineer", 4.5, 40.0, AvailabilityStatus.AVAILABLE,
             [("AWS", 3), ("Docker", 3), ("Terraform", 2), ("CI/CD", 2)], None),

            # 21. Victor Hugo - Junior Data Analyst, underutilized
            ("Victor Hugo", "victor.hugo@talentsync.ai", "Data & AI", "Junior Analyst", 1.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("SQL", 2), ("PowerBI", 2), ("Python", 1)], None),

            # 22. Zoe Kravitz - Security Auditor, available
            ("Zoe Kravitz", "zoe.kravitz@talentsync.ai", "Cybersecurity", "SecOps Engineer", 5.0, 40.0, AvailabilityStatus.AVAILABLE,
             [("Network Security", 3), ("Compliance & SOC2", 3), ("Docker", 2)], None),
        ]

        created_employees = []
        for idx, item in enumerate(employees_spec, 1):
            name, email, dept, title, exp, hours, avail, skills_list, uid = item
            code = f"EMP-{idx:03d}"
            emp = Employee(
                user_id=uid,
                employee_code=code,
                name=name,
                email=email,
                department=dept,
                job_title=title,
                years_of_experience=exp,
                weekly_working_hours=hours,
                availability_status=avail,
                learning_interests="Cloud Architecture, GenAI, Microservices",
                is_active=True
            )
            db.add(emp)
            db.flush()

            for s_name, prof in skills_list:
                s_obj = skills_dict[s_name]
                es = EmployeeSkill(
                    employee_id=emp.id,
                    skill_id=s_obj.id,
                    proficiency_level=prof,
                    is_verified=(prof >= 3)
                )
                db.add(es)

            created_employees.append(emp)

        db.commit()
        for e in created_employees:
            db.refresh(e)

        # Map employees by name for assignment seeding
        emp_by_name = {e.name: e for e in created_employees}

        # 4. Seed 5 Master Projects
        today = datetime.date.today()
        projects_spec = [
            # 1. Python and AI analytics platform (Feasible Scenario with Alex, Carlos, Emily)
            ("Python and AI Analytics Platform",
             "Enterprise predictive analytics engine leveraging transformer models, asynchronous FastAPI pipelines, and deep learning workflows.",
             "Data & AI", ProjectStatus.PLANNING, ProjectPriority.HIGH, 3, 30.0, 2.0,
             today, today + datetime.timedelta(days=90),
             [("Python", 3, True), ("PyTorch", 2, True), ("FastAPI", 2, True), ("SQL", 2, False)]),

            # 2. Cloud Migration Project (High demand, tests Terraform/AWS/Kubernetes)
            ("Cloud Migration Project",
             "Modernize legacy monolithic infrastructure into AWS containerized microservices managed via Terraform and Kubernetes.",
             "Cloud & DevOps", ProjectStatus.IN_PROGRESS, ProjectPriority.CRITICAL, 3, 45.0, 3.0,
             today - datetime.timedelta(days=15), today + datetime.timedelta(days=120),
             [("AWS", 3, True), ("Kubernetes", 3, True), ("Docker", 2, True), ("Terraform", 3, True)]),

            # 3. Web Application Development (React + TypeScript portal)
            ("Web Application Development",
             "Customer-facing SaaS talent dashboard with responsive interface, real-time metrics, and accessible component library.",
             "Engineering", ProjectStatus.IN_PROGRESS, ProjectPriority.MEDIUM, 2, 25.0, 2.0,
             today - datetime.timedelta(days=30), today + datetime.timedelta(days=60),
             [("React", 3, True), ("TypeScript", 3, True), ("Tailwind CSS", 2, False), ("Node.js", 2, False)]),

            # 4. Data Analytics Project (SQL & PowerBI reporting)
            ("Data Analytics Project",
             "Executive leadership reporting system integrating enterprise telemetry and warehouse pipelines.",
             "Data & AI", ProjectStatus.PLANNING, ProjectPriority.MEDIUM, 2, 20.0, 1.5,
             today + datetime.timedelta(days=10), today + datetime.timedelta(days=75),
             [("SQL", 3, True), ("PowerBI", 3, True), ("Data Modeling", 2, True)]),

            # 5. Cybersecurity Assessment (Penetration testing & compliance audit)
            ("Cybersecurity Assessment",
             "Thorough security audit, penetration testing, and SOC2 compliance validation across all production environments.",
             "Cybersecurity", ProjectStatus.PLANNING, ProjectPriority.HIGH, 2, 35.0, 3.0,
             today + datetime.timedelta(days=5), today + datetime.timedelta(days=45),
             [("Network Security", 3, True), ("Penetration Testing", 3, True), ("Compliance & SOC2", 3, False)]),
        ]

        created_projects = []
        for name, desc, dept, stat, prio, size, hours, exp, sdate, edate, reqs in projects_spec:
            p = Project(
                name=name,
                description=desc,
                department=dept,
                status=stat,
                priority=prio,
                required_team_size=size,
                estimated_weekly_hours=hours,
                min_experience=exp,
                start_date=sdate,
                deadline=edate,
                project_manager_id=pm_user.id
            )
            db.add(p)
            db.flush()

            for s_name, min_p, is_m in reqs:
                s_obj = skills_dict[s_name]
                req = ProjectRequiredSkill(
                    project_id=p.id,
                    skill_id=s_obj.id,
                    min_proficiency=min_p,
                    is_mandatory=is_m
                )
                db.add(req)

            created_projects.append(p)

        db.commit()
        for p in created_projects:
            db.refresh(p)

        # 5. Seed Pre-existing Assignments to create realistic workloads:
        # Create an OVERLOADED employee scenario (Maya Lin: 48 hours committed > 40h standard)
        proj_cloud = created_projects[1]
        proj_web = created_projects[2]

        # Maya Lin assigned to Cloud Migration (30h) + other tasks (18h) -> 48h committed (120% overloaded!)
        asgn1 = Assignment(
            project_id=proj_cloud.id,
            employee_id=emp_by_name["Maya Lin"].id,
            assigned_weekly_hours=30.0,
            role_in_project="Lead Cloud Architect",
            status="active",
            approved_by_id=pm_user.id
        )
        asgn1_extra = Assignment(
            project_id=proj_web.id,
            employee_id=emp_by_name["Maya Lin"].id,
            assigned_weekly_hours=18.0,
            role_in_project="Cloud DevOps Advisor",
            status="active",
            approved_by_id=pm_user.id
        )
        # David Kumar assigned to Web App (25h) -> 62.5% utilization
        asgn2 = Assignment(
            project_id=proj_web.id,
            employee_id=emp_by_name["David Kumar"].id,
            assigned_weekly_hours=25.0,
            role_in_project="Frontend Lead",
            status="active",
            approved_by_id=pm_user.id
        )
        # Samuel Taylor assigned to Cloud Migration (15h)
        asgn3 = Assignment(
            project_id=proj_cloud.id,
            employee_id=emp_by_name["Samuel Taylor"].id,
            assigned_weekly_hours=15.0,
            role_in_project="Infrastructure Engineer",
            status="active",
            approved_by_id=pm_user.id
        )
        # Alex Chen assigned to existing pilot task (10h) -> 30h remaining capacity
        asgn4 = Assignment(
            project_id=proj_cloud.id,
            employee_id=emp_by_name["Alex Chen"].id,
            assigned_weekly_hours=10.0,
            role_in_project="AI Integration Consultant",
            status="active",
            approved_by_id=pm_user.id
        )

        db.add_all([asgn1, asgn1_extra, asgn2, asgn3, asgn4])
        db.commit()

        # 6. Seed Curated Learning Catalogue
        training_spec = [
            ("Python", "Complete Python Pro Bootcamp", "Udemy", "https://www.udemy.com/course/100-days-of-code/", "Beginner", 20.0, "Hands-on projects covering Python data structures and algorithms."),
            ("FastAPI", "Building Microservices with FastAPI", "Coursera", "https://www.coursera.org/learn/fastapi", "Intermediate", 15.0, "Asynchronous API architecture, Pydantic validation, and dependency injection."),
            ("PyTorch", "Deep Learning Specialization with PyTorch", "DeepLearning.AI", "https://www.deeplearning.ai/courses/deep-learning-specialization/", "Advanced", 35.0, "Neural network modeling, backpropagation, and CNN/RNN architectures."),
            ("NLP & LLMs", "Generative AI with Large Language Models", "Coursera & AWS", "https://www.coursera.org/learn/generative-ai-with-llms", "Advanced", 30.0, "Transformer models, attention mechanisms, PEFT, and RLHF."),
            ("React", "Advanced React and State Architecture", "Frontend Masters", "https://frontendmasters.com/courses/advanced-react/", "Advanced", 18.0, "High-performance React patterns, custom hooks, and concurrent features."),
            ("TypeScript", "Enterprise TypeScript in Practice", "Udemy", "https://www.udemy.com/course/understanding-typescript/", "Intermediate", 22.0, "Generics, utility types, and strict compilation patterns."),
            ("AWS", "AWS Certified Solutions Architect Associate", "A Cloud Guru", "https://acloudguru.com/course/aws-certified-solutions-architect-associate", "Intermediate", 40.0, "Comprehensive cloud architecture, VPC, S3, IAM, and ECS."),
            ("Kubernetes", "Certified Kubernetes Administrator (CKA)", "Linux Foundation", "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/", "Advanced", 45.0, "Cluster architecture, ingress controllers, volume claims, and troubleshooting."),
            ("Docker", "Docker Mastery with Swarm and Compose", "Udemy", "https://www.udemy.com/course/docker-mastery/", "Intermediate", 16.0, "Container builds, networking, security hardening, and orchestration."),
            ("Terraform", "HashiCorp Certified Terraform Associate", "HashiCorp", "https://www.hashicorp.com/certification/terraform-associate", "Intermediate", 20.0, "Infrastructure as Code, state locking, module composition, and drift detection."),
            ("SQL", "Advanced Relational Database Optimization", "Coursera", "https://www.coursera.org/learn/database-management", "Intermediate", 25.0, "Execution plans, B-tree indexes, window functions, and schema normalization."),
            ("PowerBI", "Microsoft Power BI Data Analyst (PL-300)", "Microsoft Learn", "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/", "Intermediate", 28.0, "DAX queries, data modeling, Power Query, and executive dashboard design."),
            ("Network Security", "CompTIA Security+ Exam Prep", "CompTIA", "https://www.comptia.org/certifications/security", "Intermediate", 35.0, "Threat analysis, cryptography, network firewalls, and incident response."),
            ("Penetration Testing", "Practical Ethical Hacking", "TCM Security", "https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course", "Advanced", 40.0, "Active directory exploitation, web application testing, and privilege escalation."),
            ("Compliance & SOC2", "Auditing and Managing SOC 2 Compliance", "ISACA", "https://www.isaca.org/credentialing/crisc", "Intermediate", 15.0, "Trust services criteria, security controls, and audit readiness."),
        ]

        created_resources = []
        for s_name, title, provider, url, level, hours, desc in training_spec:
            s_obj = skills_dict.get(s_name)
            if s_obj:
                res = TrainingResource(
                    skill_id=s_obj.id,
                    title=title,
                    provider=provider,
                    url=url,
                    level=level,
                    estimated_hours=hours,
                    description=desc
                )
                db.add(res)
                created_resources.append(res)
        db.commit()

        # Seed initial recommendations
        recomms = [
            TrainingRecommendation(
                employee_id=emp_by_name["Alex Chen"].id,
                resource_id=created_resources[3].id,
                target_skill_id=skills_dict["NLP & LLMs"].id,
                reason="Recommended for Python and AI Analytics Platform to advance NLP capabilities.",
                status="recommended"
            ),
            TrainingRecommendation(
                employee_id=emp_by_name["Samuel Taylor"].id,
                resource_id=created_resources[7].id,
                target_skill_id=skills_dict["Kubernetes"].id,
                reason="Required for Cloud Migration Project to achieve CKA production certification.",
                status="recommended"
            ),
            TrainingRecommendation(
                employee_id=emp_by_name["Victor Hugo"].id,
                resource_id=created_resources[0].id,
                target_skill_id=skills_dict["Python"].id,
                reason="Bridge proficiency gap from Beginner to Intermediate for Data Analytics.",
                status="enrolled"
            ),
        ]
        db.add_all(recomms)
        db.commit()

        # 7. Seed Initial Notifications
        notifications = [
            Notification(
                user_id=pm_user.id,
                title="Workforce Overload Alert",
                message="Maya Lin is currently assigned 48.0h/wk (120% capacity). Review suggested rebalancing options.",
                type="warning",
                is_read=False
            ),
            Notification(
                user_id=pm_user.id,
                title="Project Staffing Required",
                message="Python and AI Analytics Platform has 0 of 3 team members staffed. Run matching to view candidate recommendations.",
                type="action_required",
                is_read=False
            ),
            Notification(
                user_id=employee_user.id,
                title="Recommended Training Pathway",
                message="New course recommendation: 'Generative AI with Large Language Models' has been mapped to your profile.",
                type="info",
                is_read=False
            ),
        ]
        db.add_all(notifications)

        # 8. Seed Initial Audit Logs
        audit_entries = [
            AuditLog(
                action="SYSTEM_INITIALIZATION",
                entity_type="System",
                entity_id=1,
                performed_by_id=admin_user.id,
                details="Seeded TalentSync AI workforce platform with 22 synthetic employees and 5 master projects."
            ),
            AuditLog(
                action="ASSIGNMENT_APPROVED",
                entity_type="Assignment",
                entity_id=proj_cloud.id,
                performed_by_id=pm_user.id,
                details=f"Assigned Maya Lin (30h/wk) to {proj_cloud.name}."
            ),
        ]
        db.add_all(audit_entries)

        db.commit()
        print("Database seeded successfully with 22 employees, 5 projects, training resources, and demo users.")

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()

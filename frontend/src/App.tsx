import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { EmployeeDetail } from './pages/EmployeeDetail';
import { Projects } from './pages/Projects';
import { CreateProject } from './pages/CreateProject';
import { Matching } from './pages/Matching';
import { TeamOptimization } from './pages/TeamOptimization';
import { SkillGaps } from './pages/SkillGaps';
import { Training } from './pages/Training';
import { Workload } from './pages/Workload';
import { Simulation } from './pages/Simulation';
import { Assistant } from './pages/Assistant';
import { Notifications } from './pages/Notifications';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-xs">
        Initializing TalentSync AI session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />

          {/* Protected Routes inside App Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/create" element={<CreateProject />} />
            <Route path="create-project" element={<CreateProject />} />
            <Route path="matching" element={<Matching />} />
            <Route path="optimization" element={<TeamOptimization />} />
            <Route path="skill-gaps" element={<SkillGaps />} />
            <Route path="training" element={<Training />} />
            <Route path="workload" element={<Workload />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

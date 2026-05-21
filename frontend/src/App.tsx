import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Kanban from './pages/Kanban';
import Projects from './pages/Projects';
import Teams from './pages/Teams';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="projects" element={<Projects />} />
          <Route path="teams" element={<Teams />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai" element={<AIInsights />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

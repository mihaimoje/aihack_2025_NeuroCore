import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardManager from "./pages/DashboardManager";
import DashboardUser from "./pages/DashboardUser";
import TeamManagement from "./pages/TeamManagement";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import MyTasks from "./pages/MyTasks";
import Insights from "./pages/Insights";
import Burnout from "./pages/Burnout";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              } />

              {/* Manager routes */}
              <Route path="/manager" element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <DashboardManager />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <TeamManagement />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="/insights" element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <Insights />
                </ProtectedRoute>
              } />

              {/* User routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <DashboardUser />
                </ProtectedRoute>
              } />
              <Route path="/my-tasks" element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <MyTasks />
                </ProtectedRoute>
              } />
              <Route path="/burnout" element={
                <ProtectedRoute allowedRoles={["developer"]}>
                  <Burnout />
                </ProtectedRoute>
              } />

              {/* Shared routes */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

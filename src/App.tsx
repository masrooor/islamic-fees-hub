import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import FeeStructure from "@/pages/FeeStructure";
import Payments from "@/pages/Payments";
import Receipts from "@/pages/Receipts";
import Teachers from "@/pages/Teachers";
import TeacherSalaries from "@/pages/TeacherSalaries";
import TeacherLoans from "@/pages/TeacherLoans";
import TeacherAttendance from "@/pages/TeacherAttendance";
import TeacherDashboard from "@/pages/TeacherDashboard";
import RoleManagement from "@/pages/RoleManagement";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            Your account does not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/fees" element={<FeeStructure />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teacher-salaries" element={<TeacherSalaries />} />
        <Route path="/teacher-loans" element={<TeacherLoans />} />
        <Route path="/teacher-attendance" element={<TeacherAttendance />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/roles" element={<RoleManagement />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentList from "./pages/StudentList";
import EditMenu from "./pages/EditMenu";
import Attendance from "./pages/Attendance";
import TodayMenu from "./pages/TodayMenu";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./pages/UserManagement";
import { AuthProvider } from "./context/AuthContext";
import "./styles.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/users" element={<UserManagement/>}/>

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StudentList />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/edit-menu" 
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <EditMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/today-menu" 
          element={
            <ProtectedRoute allowedRoles={["student", "staff"]}>
              <TodayMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={["student", "staff", "admin"]}>
              <Attendance />
            </ProtectedRoute>
          } 
        />
        
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
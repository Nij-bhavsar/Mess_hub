import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Signup           from "./pages/Signup";
import ForgotPassword   from "./pages/ForgotPassword";
import AdminDashboard   from "./pages/AdminDashboard";
import StaffDashboard   from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentList      from "./pages/StudentList";
import EditMenu         from "./pages/EditMenu";
import Attendance       from "./pages/Attendance";
import TodayMenu        from "./pages/TodayMenu";
import UserManagement   from "./pages/UserManagement";
import Feedback         from "./pages/Feedback";
import FeedbackAdmin    from "./pages/FeedbackAdmin";
import Invoice          from "./pages/Invoice";
import ItemRequest      from "./pages/ItemRequest";
import Payments         from "./pages/Payments";
import LeaveApply       from "./pages/LeaveApply";
import LeaveAdmin       from "./pages/LeaveAdmin";
import Notifications    from "./pages/Notifications";
import ProtectedRoute   from "./components/ProtectedRoute";
import Footer           from "./components/Footer";
import PageTransition   from "./components/PageTransition";

import "./styles.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <>
          <PageTransition>
            {(displayLocation) => (
              <Routes location={displayLocation}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
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
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <UserManagement />
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
                  path="/edit-menu"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff"]}>
                      <EditMenu />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                      <Attendance />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/today-menu"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                      <TodayMenu />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/feedback"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <Feedback />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/feedback-admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <FeedbackAdmin />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/item-request"
                  element={
                    <ProtectedRoute allowedRoles={["staff"]}>
                      <ItemRequest />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/item-requests"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <ItemRequest />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/invoice"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <Invoice />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Payments />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leave"
                  element={
                    <ProtectedRoute allowedRoles={["student", "staff"]}>
                      <LeaveApply />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leave-admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <LeaveAdmin />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            )}
          </PageTransition>

          <Footer />
        </>
      </AuthProvider>
    </Router>
  );
}

export default App;

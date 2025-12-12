import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ClassProvider } from "./context/ClassContext";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClassView from "./pages/ClassView";
import AttendanceScreen from "./pages/AttendanceScreen";
import AttendanceReport from "./pages/AttendanceReport";
import Landing from "./pages/Landing";

import "./styles/components.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClassProvider>

          {/* ❌ REMOVE THIS — You deleted Navbar.js */}
          {/* <Navbar /> */}

          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/class/:classId"
              element={
                <ProtectedRoute>
                  <ClassView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/class/:classId/attendance"
              element={
                <ProtectedRoute>
                  <AttendanceScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/class/:classId/attendance-report"
              element={
                <ProtectedRoute>
                  <AttendanceReport />
                </ProtectedRoute>
              }
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </ClassProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

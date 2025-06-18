import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationPopup from "./components/NotificationPopup";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      try {
        // Check if user is logged in via localStorage
        const userData = localStorage.getItem("crm_user");
        if (userData) {
          // Validate the session is still valid
          const user = JSON.parse(userData);
          // You could add additional validation here if needed
        }
      } catch (error) {
        console.error("Error checking session:", error);
        localStorage.removeItem("crm_user");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationPopup />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

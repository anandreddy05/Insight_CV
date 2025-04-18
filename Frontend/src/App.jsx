import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import UserDashboard from './pages/Dashboard/UserDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import RecruiterDashboard from './pages/Dashboard/RecruiterDashboard';
import { Login } from './pages/Login';
import Register from './pages/Register';
import ResumesPage from "./pages/ResumesPage";

const App = () => {
  return (
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard/user" element={<UserDashboard />} />
  <Route path="/dashboard/recruiter" element={<RecruiterDashboard />} />
  <Route path="/dashboard/admin" element={<AdminDashboard />} />
  <Route path="/resumes" element={<ResumesPage />} />
</Routes>

  );
};

export default App;
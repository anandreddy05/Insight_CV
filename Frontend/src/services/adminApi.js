import axios from 'axios';

// Base URL for the admin-related endpoints
const api = axios.create({
  baseURL: 'http://localhost:8000', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin Routes
// Get all users
export const getAllUsers = async () => {
  try {
    const response = await api.get('/admin/all-users');
    return response.data; // Returns the list of users
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/admin/${userId}`);
    return response.data; // Returns the user data
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Delete user by ID
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/${userId}`);
    return response.data; // Success message or status
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Get all resumes
export const getAllResumes = async () => {
  try {
    const response = await api.get('/admin/resumes/');
    return response.data; // Returns the list of resumes
  } catch (error) {
    console.error("Error fetching resumes:", error);
    throw error;
  }
};

// Get resume by user ID
export const getResumeByUserId = async (userId) => {
  try {
    const response = await api.get(`/admin/resumes/${userId}`);
    return response.data; // Returns the resume data
  } catch (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }
};

// Delete resume by ID
export const deleteResume = async (resumeId) => {
  try {
    const response = await api.delete(`/admin/resumes/${resumeId}`);
    return response.data; // Success message or status
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
};

export default api;

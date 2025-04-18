// // src/services/authApi.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Update with your backend URL

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};


export const changePassword = async (newPassword, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/auth/change-password`,
      { new_password: newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Password change failed' };
  }
};

export const loginUser = async (credentials) => {
  try {
    // Convert to FormData as expected by OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};
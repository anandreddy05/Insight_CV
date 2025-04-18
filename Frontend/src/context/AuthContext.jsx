// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userRole: localStorage.getItem('userRole') || null,
    userData: null,
    token: localStorage.getItem('authToken') || null,
    loading: true
  });

  const navigate = useNavigate();

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure the backend returns user.role
      if (!response.data.user?.role) {
        throw new Error('Role not provided in token verification');
      }
      
      localStorage.setItem('userRole', response.data.user.role);
      
      setAuthState({
        isAuthenticated: true,
        userRole: response.data.user.role,
        userData: response.data.user,
        token,
        loading: false
      });
      
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      if (!user?.role) {
        throw new Error('Role not provided in login response');
      }
      
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('userRole', user.role);
      
      await verifyToken(access_token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      userData: null,
      token: null,
      loading: false
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
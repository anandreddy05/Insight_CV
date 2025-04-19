import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userRole: null,
    userData: null,
    token: null,
    loading: true, // Initial loading state
  });

  const navigate = useNavigate();

  // Verify token validity with the backend
  const verifyToken = async (token) => {
    if (!token) return false;

    try {
      const response = await axios.get('/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data?.user?.role) {
        throw new Error('Invalid token response');
      }

      // Update auth state if token is valid
      setAuthState({
        isAuthenticated: true,
        userRole: response.data.user.role,
        userData: response.data.user,
        token,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      logout(); // Clear invalid token
      return false;
    }
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');

      if (storedToken) {
        const isValid = await verifyToken(storedToken);
        if (!isValid) {
          localStorage.removeItem('authToken'); // Clear invalid token
        }
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const response = await axios.post('/auth/login', credentials);
      const { access_token, user } = response.data;

      if (!access_token || !user?.role) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem('authToken', access_token);
      await verifyToken(access_token);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      logout();
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      userData: null,
      token: null,
      loading: false,
    });
    navigate('/login');
  };

  // Provide auth state and methods to children
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        verifyToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
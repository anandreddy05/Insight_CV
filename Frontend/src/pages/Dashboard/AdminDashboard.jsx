import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalResumes: 0,
    usersByRole: {},
    resumesPerUser: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const usersResponse = await axios.get('http://localhost:8000/admin/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resumesResponse = await axios.get('http://localhost:8000/admin/resumes/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const usersData = usersResponse.data;
      const resumesData = resumesResponse.data;
      
      setUsers(usersData);
      setResumes(resumesData);
      
      // Calculate analytics
      calculateAnalytics(usersData, resumesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (usersData, resumesData) => {
    // Count users by role
    const roleCount = {};
    usersData.forEach(user => {
      const role = user.role;
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    // Count resumes per user
    const resumesPerUser = {};
    resumesData.forEach(resume => {
      const userId = resume.user_id;
      resumesPerUser[userId] = (resumesPerUser[userId] || 0) + 1;
    });
    
    setAnalytics({
      totalUsers: usersData.length,
      totalResumes: resumesData.length,
      usersByRole: roleCount,
      resumesPerUser
    });
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      await axios.delete(`http://localhost:8000/admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(users.filter(user => user.id !== userId));
      // Also remove associated resumes
      const updatedResumes = resumes.filter(resume => resume.user_id !== userId);
      setResumes(updatedResumes);
      
      // Recalculate analytics
      calculateAnalytics(users.filter(user => user.id !== userId), updatedResumes);
      
      setSuccess(`Successfully deleted user #${userId}`);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      await axios.delete(`http://localhost:8000/admin/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedResumes = resumes.filter(resume => resume.id !== resumeId);
      setResumes(updatedResumes);
      
      // Recalculate analytics
      calculateAnalytics(users, updatedResumes);
      
      setSuccess(`Successfully deleted resume #${resumeId}`);
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError(err.response?.data?.detail || 'Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Analytics Section */}
        <section className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-blue-800">Total Users</h3>
              <p className="text-3xl font-bold mt-2">{analytics.totalUsers}</p>
            </div>
            
            {/* Total Resumes Card */}
            <div className="bg-green-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-green-800">Total Resumes</h3>
              <p className="text-3xl font-bold mt-2">{analytics.totalResumes}</p>
            </div>
            
            {/* Users by Role */}
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-purple-800">Users by Role</h3>
              <div className="mt-2">
                {Object.entries(analytics.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center mt-1">
                    <span className="capitalize">{role}:</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Average Resumes per User */}
            <div className="bg-amber-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium text-amber-800">Avg. Resumes per User</h3>
              <p className="text-3xl font-bold mt-2">
                {users.length ? (resumes.length / users.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </section>
        
        {/* Users Section */}
        <section className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Users Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">Name</th>
                  <th className="py-2 px-4 border">Email</th>
                  <th className="py-2 px-4 border">Role</th>
                  <th className="py-2 px-4 border">Resumes</th>
                  <th className="py-2 px-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border text-center">{user.id}</td>
                      <td className="py-2 px-4 border">{user.full_name || 'N/A'}</td>
                      <td className="py-2 px-4 border">{user.email}</td>
                      <td className="py-2 px-4 border text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            user.role === 'recruiter' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 px-4 border text-center">
                        {resumes.filter(resume => resume.user_id === user.id).length}
                      </td>
                      <td className="py-2 px-4 border text-center">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.role === 'admin'}
                          className={`px-3 py-1 rounded text-white
                            ${user.role === 'admin' 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-red-500 hover:bg-red-600'}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resumes Section */}
        <section className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resumes Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">User ID</th>
                  <th className="py-2 px-4 border">User Email</th>
                  <th className="py-2 px-4 border">File Path</th>
                  <th className="py-2 px-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No resumes found
                    </td>
                  </tr>
                ) : (
                  resumes.map(resume => {
                    const user = users.find(u => u.id === resume.user_id);
                    return (
                      <tr key={resume.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border text-center">{resume.id}</td>
                        <td className="py-2 px-4 border text-center">{resume.user_id}</td>
                        <td className="py-2 px-4 border">{user?.email || 'Unknown'}</td>
                        <td className="py-2 px-4 border truncate max-w-xs">
                          {resume.file_path}
                        </td>
                        <td className="py-2 px-4 border text-center">
                          <button 
                            onClick={() => handleDeleteResume(resume.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import { getAllUsers,getAllResumes,deleteUser,deleteResume } from '../../services/adminApi';


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getAllUsers();
        const resumesData = await getAllResumes();
        setUsers(usersData);
        setResumes(resumesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      await deleteResume(resumeId);
      setResumes(resumes.filter(resume => resume.id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Users Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Users Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">Email</th>
                <th className="py-2 px-4 border">Role</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">{user.id}</td>
                  <td className="py-2 px-4 border">{user.email}</td>
                  <td className="py-2 px-4 border text-center">{user.role}</td>
                  <td className="py-2 px-4 border text-center">
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resumes Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumes Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">User ID</th>
                <th className="py-2 px-4 border">File Path</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map(resume => (
                <tr key={resume.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">{resume.id}</td>
                  <td className="py-2 px-4 border text-center">{resume.user_id}</td>
                  <td className="py-2 px-4 border">{resume.file_path}</td>
                  <td className="py-2 px-4 border text-center">
                    <button 
                      onClick={() => handleDeleteResume(resume.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
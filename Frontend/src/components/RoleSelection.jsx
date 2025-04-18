import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const { userData } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = () => {
    if (!selectedRole) return;

    localStorage.setItem('userRole', selectedRole);
    
    // Update auth state
    localStorage.setItem('userRole', selectedRole);
    
    // Redirect to appropriate dashboard
    navigate(`/dashboard/${selectedRole}`);
  };

  return (
    <div className="role-selection">
      <h2>Select Your Role</h2>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        className="role-dropdown"
      >
        <option value="">Select Role</option>
        <option value="admin">Admin</option>
        <option value="recruiter">Recruiter</option>
        <option value="user">User</option>
      </select>

      <button onClick={handleRoleSelect} className="mt-4">
        Continue
      </button>
    </div>
  );
};

export default RoleSelection;

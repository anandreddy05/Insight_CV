import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RecruiterDashboard = () => {
  // Get auth values from useAuth()
  const { logout } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('authToken'); // Get token from localStorage
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.post(
        'http://localhost:8000/recruiter/match-best-resumes',
        { job_description: jobDescription, threshold: 70 },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,  // Use token from localStorage
            'Content-Type': 'application/json'
          }
        }
      );
      
      setResults(response.data);
      setSuccess('Successfully found matching resumes!');
    } catch (err) {
      console.error('Search error:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied: Recruiter privileges required');
      } else {
        setError(err.response?.data?.message || 'Failed to search resumes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="bg-white shadow mb-6 rounded-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      
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

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Find Best Candidates</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            setError('');
            setSuccess('');
          }}
          placeholder="Enter job description (skills, experience required, etc.)"
          className="border p-2 w-full h-32 mb-4 rounded"
        />
        
        <button 
          onClick={handleSearch}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? 'Searching...' : 'Search Resumes'}
        </button>
      </div>

      {results && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top Matches (Best Score: {results.best_match_score})
          </h3>
          
          {results.top_resumes.length === 0 ? (
            <p className="text-gray-500">No matching resumes found</p>
          ) : (
            <div className="space-y-4">
              {results.top_resumes.map((resume, index) => (
                <div key={index} className="border p-4 rounded-lg shadow-sm hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg">Score: {resume.match_score}/100</h4>
                      <p className="text-sm text-gray-500">Resume ID: {resume.resume_data.resume_id}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      User #{resume.resume_data.user_id}
                    </span>
                  </div>
                  
                  <p className="mb-3 text-gray-700">{resume.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Skills</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {resume.resume_data.skills.map((skill, i) => (
                          <li key={i} className="text-sm text-gray-700">{skill}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2">Experience</h5>
                      <ul className="list-disc pl-5 space-y-2">
                        {resume.resume_data.experience.map((exp, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium">{exp.role}</p>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-gray-500 text-xs">{exp.years}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2">Education</h5>
                      <ul className="list-disc pl-5 space-y-2">
                        {resume.resume_data.education.map((edu, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-gray-600">{edu.institution}</p>
                            <p className="text-gray-500 text-xs">{edu.years}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
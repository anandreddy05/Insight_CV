import React, { useState } from 'react';  // Added React import here
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-700">Please try again later</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Sub-components
const Header = ({ onLogout }) => (
  <header className="bg-white shadow mb-6 rounded-lg">
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  </header>
);

const Alert = ({ type, message }) => {
  const styles = {
    error: 'bg-red-100 border-red-400 text-red-700',
    success: 'bg-green-100 border-green-400 text-green-700'
  };
  
  return (
    <div className={`mb-4 p-4 border rounded ${styles[type]}`}>
      {message}
    </div>
  );
};

const SearchForm = ({ 
  jobDescription, 
  onDescriptionChange, 
  onSearch, 
  loading 
}) => (
  <div className="bg-white shadow rounded-lg p-6 mb-8">
    <h2 className="text-xl font-semibold mb-4">Find Best Candidates</h2>
    <textarea
      value={jobDescription}
      onChange={onDescriptionChange}
      placeholder="Enter job description (skills, experience required, etc.)"
      className="border p-2 w-full h-32 mb-4 rounded"
    />
    
    <button 
      onClick={onSearch}
      disabled={loading}
      className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
    >
      {loading ? 'Searching...' : 'Search Resumes'}
    </button>
  </div>
);

const ResumeSection = ({ title, items, renderItem }) => {
  if (!items || items.length === 0) {
    return (
      <div>
        <h5 className="font-semibold mb-2">{title}</h5>
        <p className="text-sm text-gray-500">No information available</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="font-semibold mb-2">{title}</h5>
      <ul className="list-disc pl-5 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            {renderItem ? renderItem(item) : item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ResumeMatch = ({ resume }) => {
  if (!resume) return null;

  return (
    <div className="border p-4 rounded-lg shadow-sm hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-lg">Score: {resume.match_score || 'N/A'}/100</h4>
          <p className="text-sm text-gray-500">Resume ID: {resume.resume_data?.resume_id || 'Unknown'}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
          User #{resume.resume_data?.user_id || 'Unknown'}
        </span>
      </div>
      
      {resume.summary && <p className="mb-3 text-gray-700">{resume.summary}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumeSection 
          title="Skills" 
          items={resume.resume_data?.skills} 
        />
        <ResumeSection 
          title="Experience" 
          items={resume.resume_data?.experience}
          renderItem={(exp) => (
            <>
              <p className="font-medium">{exp.role}</p>
              <p className="text-gray-600">{exp.company}</p>
              <p className="text-gray-500 text-xs">{exp.years}</p>
            </>
          )}
        />
        <ResumeSection 
          title="Education" 
          items={resume.resume_data?.education}
          renderItem={(edu) => (
            <>
              <p className="font-medium">{edu.degree}</p>
              <p className="text-gray-600">{edu.institution}</p>
              <p className="text-gray-500 text-xs">{edu.years}</p>
            </>
          )}
        />
      </div>
    </div>
  );
};

const ResultsSection = ({ results }) => {
  if (!results) return null;

  // Handle both possible response formats
  const resumes = results.top_resumes || results.resumes || [];
  const bestScore = results.best_match_score || (resumes[0]?.match_score ?? null);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {bestScore !== null ? (
          <span>Top Matches (Best Score: {bestScore})</span>
        ) : (
          <span>Top Matches</span>
        )}
      </h3>
      
      {resumes.length === 0 ? (
        <p className="text-gray-500">No matching resumes found</p>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume, index) => (
            <ErrorBoundary key={index}>
              <ResumeMatch resume={resume} />
            </ErrorBoundary>
          ))}
        </div>
      )}
    </div>
  );
};

// Main component
const RecruiterDashboard = () => {
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
    setResults(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.post(
        'http://localhost:8000/recruiter/match-best-resumes',
        { job_description: jobDescription, threshold: 70 },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setResults(response.data);
      setSuccess('Successfully found matching resumes!');
    } catch (err) {
      handleSearchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchError = (err) => {
    console.error('Search error:', err);
    if (err.response?.status === 401) {
      handleLogout();
    } else if (err.response?.status === 403) {
      setError('Access denied: Recruiter privileges required');
    } else {
      setError(err.response?.data?.message || 'Failed to search resumes');
    }
  };

  const handleDescriptionChange = (e) => {
    setJobDescription(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ErrorBoundary>
        <Header onLogout={handleLogout} />
      </ErrorBoundary>
      
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <ErrorBoundary>
        <SearchForm 
          jobDescription={jobDescription}
          onDescriptionChange={handleDescriptionChange}
          onSearch={handleSearch}
          loading={loading}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <ResultsSection results={results} />
      </ErrorBoundary>
    </div>
  );
};

export default RecruiterDashboard;
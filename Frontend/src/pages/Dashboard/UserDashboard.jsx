import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { setResumes, addResume, deleteResume } from '../../store/resumeSlice';

const UserDashboard = () => {
  const { user, logout: authLogout } = useAuth();
  const resumes = useSelector(state => state.resume.resumes);
  const dispatch = useDispatch();
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [scoreResult, setScoreResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [showMissingSkills, setShowMissingSkills] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // Enhanced logout function
  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // Fetch resumes with proper error handling
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');
  
        const response = await axios.get(
          `http://localhost:8000/user/get_resume`,
          {
            headers: { 
              Authorization: `Bearer ${token}`
            }
          }
        );
  
        dispatch(setResumes(response.data || []));
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.detail || 'Failed to fetch resumes');
      } finally {
        setLoading(false);
      }
    };
  
    if (user) fetchResumes();
  }, [user, dispatch]);
  
  // Handle resume upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file');

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:8000/user/upload_resume', 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      dispatch(addResume(response.data));
      setSuccess('Resume uploaded successfully!');
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle resume deletion
  const handleDelete = async (resumeId) => {
    if (!window.confirm('Delete this resume?')) return;
  
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      await axios.delete(
        `http://localhost:8000/user/delete-resume/${resumeId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'  // Explicit content type
          }
        }
      );
  
      dispatch(deleteResume(resumeId));
      
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
        setJobDescription('');
        setScoreResult(null);
      }
      
      setSuccess('Resume deleted successfully');
    } catch (err) {
      console.error("Delete error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      setError(err.response?.data?.detail || 
              'Delete failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // Handle getting the score
  const getScore = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `http://localhost:8000/user/get_score/${selectedResume.id}`,
        { job_description: jobDescription },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Handle the nested response structure
      const apiData = response.data.llm_result?.[0] || {};
      setScoreResult({
        match_score: apiData.match_score || 0,
        match_keywords: apiData.match_keywords || [],
        missing_skills: apiData.missing_skills || [],
        suggestions: apiData.suggestions || 'No suggestions available',
        llm_result: apiData.llm_result || 'No analysis available'
      });
  
    } catch (err) {
      console.error("Error:", err);
      setError('Failed to get score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Safe render function to handle potentially problematic data
  const safeRender = (item) => {
    if (item === null || item === undefined) return null;
    if (typeof item === 'object') return JSON.stringify(item);
    return String(item);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Analyzer</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Upload Resume Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Resume</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume File (PDF/DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </form>
        </div>

        {/* Resumes List Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>
          {loading && resumes.length === 0 ? (
            <p>Loading your resumes...</p>
          ) : resumes.length === 0 ? (
            <p className="text-gray-500">You haven't uploaded any resumes yet.</p>
          ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div key={resume.id || Math.random().toString()} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {resume.file_path 
                        ? resume.file_path.split('/').pop() 
                        : 'Untitled Resume'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {resume.file_path || 'No file path available'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resume.skills && Array.isArray(resume.skills) ? (
                        resume.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                          </span>
                        ))
                      ) : <span className="text-sm text-gray-500">No skills found</span>}
                      {resume.skills && Array.isArray(resume.skills) && resume.skills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          +{resume.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedResume(resume)} 
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Select
                    </button>
                    <button 
                      onClick={() => handleDelete(resume.id)} 
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Resume Analysis Section */}
        {selectedResume && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Resume Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resume Details */}
              <div className="md:col-span-1">
                <h3 className="font-medium text-lg mb-2">
                  {selectedResume.file_path 
                    ? selectedResume.file_path.split('/').pop() 
                    : 'Untitled Resume'}
                </h3>
                <div className="space-y-4">
                  {/* Skills */}
                  <div>
                    <h4 className="font-medium text-gray-700">Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedResume.skills && Array.isArray(selectedResume.skills) ? (
                        selectedResume.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                          </span>
                        ))
                      ) : <span className="text-sm text-gray-500">No skills found</span>}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h4 className="font-medium text-gray-700">Experience</h4>
                    <div className="space-y-2 mt-2">
                      {selectedResume.experience && Array.isArray(selectedResume.experience) ? (
                        selectedResume.experience.map((exp, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{safeRender(exp.role)}</p>
                            <p className="text-gray-600">{safeRender(exp.company)}</p>
                            <p className="text-gray-500 text-xs">{safeRender(exp.years)}</p>
                          </div>
                        ))
                      ) : <span className="text-sm text-gray-500">No experience data found</span>}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h4 className="font-medium text-gray-700">Education</h4>
                    <div className="space-y-2 mt-2">
                      {selectedResume.education && Array.isArray(selectedResume.education) ? (
                        selectedResume.education.map((edu, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{safeRender(edu.degree)}</p>
                            <p className="text-gray-600">{safeRender(edu.institution)}</p>
                            <p className="text-gray-500 text-xs">
                              {safeRender(edu.years)} {edu.cgpa && `• CGPA: ${safeRender(edu.cgpa)}`}
                            </p>
                          </div>
                        ))
                      ) : <span className="text-sm text-gray-500">No education data found</span>}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="font-medium text-gray-700">Projects</h4>
                    <div className="space-y-4 mt-2">
                      {selectedResume.projects && Array.isArray(selectedResume.projects) ? (
                        selectedResume.projects.map((project, i) => (
                          <div key={i} className="text-sm border-l-4 border-indigo-200 pl-3">
                            <p className="font-medium">{safeRender(project.project_name)}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {project.tech_stack?.map((tech, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1 text-gray-600">{safeRender(project.description)}</p>
                          </div>
                        ))
                      ) : <span className="text-sm text-gray-500">No projects found</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Matching */}
              <div className="md:col-span-2">
                <h3 className="font-medium text-lg mb-2">Job Matching Score</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      id="jobDescription"
                      rows="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={getScore}
                    disabled={loading}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Analyzing...' : 'Get Matching Score'}
                  </button>

                  {scoreResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-lg mb-2">Analysis Results</h4>
                      
                      {/* Score Display */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Match Score:</span>
                          <span className="font-bold">{scoreResult.match_score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              scoreResult.match_score >= 70 ? 'bg-green-600' : 
                              scoreResult.match_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${scoreResult.match_score}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Matching Keywords */}
                      {scoreResult.match_keywords?.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium mb-2">Matching Keywords:</h5>
                          <div className="flex flex-wrap gap-2">
                            {scoreResult.match_keywords.map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {scoreResult.missing_skills?.length > 0 && (
                        <div className="mb-4">
                          <button 
                            onClick={() => setShowMissingSkills(!showMissingSkills)}
                            className="flex items-center justify-between w-full p-2 bg-red-50 rounded-lg hover:bg-red-100"
                          >
                            <h5 className="font-medium text-red-700">Missing Skills</h5>
                            <svg
                              className={`w-4 h-4 transition-transform ${showMissingSkills ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showMissingSkills && (
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {scoreResult.missing_skills.map((skill, index) => (
                                <li key={index} className="text-sm text-red-700">{skill}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Suggestions */}
                      {scoreResult.suggestions && (
                        <div className="mb-4">
                          <button 
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="flex items-center justify-between w-full p-2 bg-blue-50 rounded-lg hover:bg-blue-100"
                          >
                            <h5 className="font-medium text-blue-700">Improvement Suggestions</h5>
                            <svg
                              className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showSuggestions && (
                            <div className="mt-2 p-3 bg-white border border-blue-100 rounded-lg whitespace-pre-wrap text-sm">
                              {scoreResult.suggestions}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
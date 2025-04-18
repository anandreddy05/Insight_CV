import axios from 'axios';

// Base URL for the recruiter-related endpoints
const api = axios.create({
  baseURL: 'http://localhost:8000', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Recruiter Routes
// Match best resumes with a given job description
export const findBestResumes = async (jobDescription, threshold = 70) => {
  try {
    const payload = { job_description: jobDescription, threshold };
    const response = await api.post('/recruiter/match-best-resumes', payload);
    return response.data; // Returns the matched resumes data
  } catch (error) {
    console.error("Error matching resumes:", error);
    throw error;
  }
};

export default api;

import { createSlice } from '@reduxjs/toolkit';

// Load resumes from localStorage if available
const loadResumesFromLocalStorage = () => {
  const savedResumes = localStorage.getItem('resumes');
  return savedResumes ? JSON.parse(savedResumes) : [];
};

const initialState = {
  resumes: loadResumesFromLocalStorage(),
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setResumes: (state, action) => {
      state.resumes = action.payload;
      localStorage.setItem('resumes', JSON.stringify(state.resumes)); // Save to localStorage
    },
    addResume: (state, action) => {
      state.resumes.push(action.payload);
      localStorage.setItem('resumes', JSON.stringify(state.resumes)); // Save to localStorage
    },
    deleteResume: (state, action) => {
      state.resumes = state.resumes.filter(resume => resume.id !== action.payload);
      localStorage.setItem('resumes', JSON.stringify(state.resumes)); // Save to localStorage
    }
  },
});

export const { setResumes, addResume, deleteResume } = resumeSlice.actions;
export default resumeSlice.reducer;

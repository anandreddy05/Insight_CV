import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000/user';

// Async thunk to fetch resumes
export const fetchResumes = createAsyncThunk(
  'resume/fetchResumes', 
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return thunkAPI.rejectWithValue('No authentication token found');
      
      const response = await axios.get(`${API_URL}/get_resume`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// Async thunk to upload a resume
export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (formData, thunkAPI) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return thunkAPI.rejectWithValue('No authentication token found');
      
      const response = await axios.post(`${API_URL}/upload_resume`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// Async thunk to delete a resume
export const removeResume = createAsyncThunk(
  'resume/removeResume',
  async (resumeId, thunkAPI) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return thunkAPI.rejectWithValue('No authentication token found');
      
      await axios.delete(`${API_URL}/delete-resume/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return resumeId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    resumes: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    // Keep these for direct dispatches if needed
    setResumes: (state, action) => {
      state.resumes = action.payload;
    },
    addResume: (state, action) => {
      state.resumes.push(action.payload);
    },
    deleteResume: (state, action) => {
      state.resumes = state.resumes.filter((resume) => resume.id !== action.payload);
    },
    clearResumes: (state) => {
      state.resumes = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch resumes cases
      .addCase(fetchResumes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.resumes = action.payload;
        state.error = null;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Upload resume cases
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.resumes.push(action.payload);
        state.error = null;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete resume cases
      .addCase(removeResume.fulfilled, (state, action) => {
        state.resumes = state.resumes.filter(resume => resume.id !== action.payload);
        state.error = null;
      })
      .addCase(removeResume.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setResumes, addResume, deleteResume, clearResumes } = resumeSlice.actions;
export default resumeSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch resumes
export const fetchResumes = createAsyncThunk('resume/fetchResumes', async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:8000/user/get_resume', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    resumes: [],
    status: 'idle', // <-- for tracking fetch status
    error: null,
  },
  reducers: {
    setResumes: (state, action) => {
      state.resumes = action.payload;
    },
    addResume: (state, action) => {
      state.resumes.push(action.payload);
    },
    deleteResume: (state, action) => {
      state.resumes = state.resumes.filter((resume) => resume.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.resumes = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setResumes, addResume, deleteResume } = resumeSlice.actions;
export default resumeSlice.reducer;

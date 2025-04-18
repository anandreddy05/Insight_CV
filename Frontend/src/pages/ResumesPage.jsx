import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResumes } from '../store/resumeSlice';

const ResumesPage = () => {
  const dispatch = useDispatch();
  const { resumes, status, error } = useSelector((state) => state.resume);

  useEffect(() => {
    dispatch(fetchResumes());
  }, [dispatch]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Resumes</h1>

      {status === 'loading' && <p>Loading resumes...</p>}
      {status === 'failed' && <p className="text-red-500">Error: {error}</p>}

      {status === 'succeeded' && resumes.length > 0 ? (
        <ul className="space-y-2">
          {resumes.map((resume) => (
            <li key={resume.id} className="p-4 border rounded-md shadow">
              <p><strong>Filename:</strong> {resume.filename}</p>
            </li>
          ))}
        </ul>
      ) : (
        status === 'succeeded' && <p>No resumes found.</p>
      )}
    </div>
  );
};

export default ResumesPage;

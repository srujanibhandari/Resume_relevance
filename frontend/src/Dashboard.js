import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [location, setLocation] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const navigate = useNavigate();

  const fetchResumes = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (jobRole) params.job_role = jobRole;
    if (location) params.location = location;
    if (minScore) params.min_score = minScore;
    if (maxScore) params.max_score = maxScore;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get('https://resume-relevance.onrender.com/api/resumes', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setResumes(res.data.resumes || []);
        setLoading(false);
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Failed to fetch resumes');
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchResumes();
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Segoe UI, Arial', background: '#fff', borderRadius: 18, boxShadow: '0 6px 32px rgba(0,0,0,0.10)', padding: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ color: '#4f8cff', margin: 0, letterSpacing: 1 }}>
          <span role="img" aria-label="dashboard" style={{ fontSize: 32, marginRight: 8 }}>📊</span> Resume Dashboard
        </h2>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'linear-gradient(90deg,#4f8cff,#38c6ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
        >
          Go to Resume Relevance
        </button>
      </div>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <input type="text" placeholder="Job Role" value={jobRole} onChange={e => setJobRole(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cce', fontSize: 15, minWidth: 120 }} />
        <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cce', fontSize: 15, minWidth: 120 }} />
        <input type="number" placeholder="Min Score" value={minScore} onChange={e => setMinScore(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cce', fontSize: 15, width: 100 }} min={0} max={100} />
        <input type="number" placeholder="Max Score" value={maxScore} onChange={e => setMaxScore(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cce', fontSize: 15, width: 100 }} min={0} max={100} />
        <button type="submit" style={{ background: 'linear-gradient(90deg,#4f8cff,#38c6ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Filter</button>
      </form>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading...</div>
      ) : error ? (
        <div style={{ color: '#ff4f4f', textAlign: 'center', fontWeight: 600 }}>{error}</div>
      ) : resumes.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center' }}>No resume data found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#f8fbff', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#d2e6fa' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Filename</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Job Role</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Location</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Relevance Score</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map((resume, idx) => {
              // Extract score, job role, location, and summary from review_result or job_description
              let score = 'N/A', summary = '', jobRoleOut = '', locationOut = '';
              if (typeof resume.review_result === 'string') {
                const scoreMatch = resume.review_result.match(/Relevance Score.*?(\d{1,3})/i) || resume.review_result.match(/(\d{1,3})/);
                score = scoreMatch ? scoreMatch[1] : 'N/A';
                // Try to extract summary (first non-empty line after Overall Brief Summary:)
                let summaryMatch = resume.review_result.match(/Overall Brief Summary:[\s\S]*?- (.*)/i);
                if (!summaryMatch) {
                  // Try to get the first 1-2 lines after Overall Brief Summary:
                  const summaryBlock = resume.review_result.split(/Overall Brief Summary:/i)[1];
                  if (summaryBlock) {
                    const lines = summaryBlock.split('\n').map(l => l.trim()).filter(Boolean);
                    summary = lines.slice(0, 2).join(' ');
                  }
                } else {
                  summary = summaryMatch[1];
                }
                // Try to extract job role
                let jobRoleMatch = resume.review_result.match(/Job Role:?\s*([\w\s\-]+)/i);
                if (!jobRoleMatch && typeof resume.job_description === 'string') {
                  jobRoleMatch = resume.job_description.match(/Job Role:?\s*([\w\s\-]+)/i);
                }
                if (jobRoleMatch) {
                  jobRoleOut = jobRoleMatch[1].trim();
                } else if (typeof resume.job_description === 'string') {
                  // Try to get first line as job role if not found
                  const firstLine = resume.job_description.split('\n')[0];
                  jobRoleOut = firstLine.length < 60 ? firstLine.trim() : (resume.job_role || '');
                } else {
                  jobRoleOut = resume.job_role || '';
                }
                // Try to extract location
                let locationMatch = resume.review_result.match(/Location:?\s*([\w\s,\-]+)/i);
                if (!locationMatch && typeof resume.job_description === 'string') {
                  // Try to match 'Location: ...' or city/state/country patterns
                  locationMatch = resume.job_description.match(/Location:?\s*([\w\s,\-]+)/i);
                  if (!locationMatch) {
                    // Try to find a line with a city/state/country (simple heuristic)
                    const locationKeywords = ['India', 'USA', 'UK', 'Hyderabad', 'Bangalore', 'Delhi', 'Mumbai', 'Chennai', 'Pune', 'Remote', 'Onsite'];
                    const lines = resume.job_description.split('\n').map(l => l.trim()).filter(Boolean);
                    const found = lines.find(line => locationKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())));
                    if (found) {
                      locationOut = found;
                    } else {
                      locationOut = lines[1] && lines[1].length < 60 ? lines[1] : (resume.location || '');
                    }
                  } else {
                    locationOut = locationMatch[1].trim();
                  }
                } else if (locationMatch) {
                  locationOut = locationMatch[1].trim();
                } else if (typeof resume.job_description === 'string') {
                  const lines = resume.job_description.split('\n').map(l => l.trim()).filter(Boolean);
                  locationOut = lines[1] && lines[1].length < 60 ? lines[1] : (resume.location || '');
                } else {
                  locationOut = resume.location || '';
                }
              } else {
                jobRoleOut = resume.job_role || '';
                locationOut = resume.location || '';
              }
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e0e7ef' }}>
                  <td style={{ padding: '8px 8px', fontWeight: 600 }}>{resume.filename}</td>
                  <td style={{ padding: '8px 8px' }}>{jobRoleOut}</td>
                  <td style={{ padding: '8px 8px' }}>{locationOut}</td>
                  <td style={{ padding: '8px 8px' }}>{score}</td>
                  <td style={{ padding: '8px 8px' }}>{summary}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;

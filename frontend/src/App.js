import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to parse result string
  const parseResult = (resultStr) => {
    const scoreMatch = resultStr.match(/(\d{1,3})/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const explanation = resultStr.replace(/.*?\n/, '');
    return { score, explanation };
  };
  // Helper to render clean table and explanation
  const renderResultTable = (score, explanation) => (
    <div style={{ marginTop: 18 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#eaf3ff', borderRadius: 8, overflow: 'hidden', fontSize: 16 }}>
        <thead>
          <tr style={{ background: '#d2e6fa' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#4f8cff', borderBottom: '2px solid #b3d1f7' }}>Field</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#4f8cff', borderBottom: '2px solid #b3d1f7' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px', fontWeight: 600 }}>Relevance Score</td>
            <td style={{ padding: '8px' }}>{score !== null ? `${score}%` : 'N/A'}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 24 }}>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#333' }}>Detailed Analysis</span>
        {renderExplanation(explanation)}
      </div>
    </div>
  );

  // Helper to render explanation with section headings and bullet points
  const renderExplanation = (explanation) => {
    // Split into lines and group by section headings
    const lines = explanation.split(/\n|\r/).filter(l => l.trim());
    const sections = [];
    let currentSection = null;
    lines.forEach(line => {
      // Section heading: ends with ':' and not a bullet
      if (/^[A-Za-z].*:$/.test(line.trim())) {
        if (currentSection) sections.push(currentSection);
        currentSection = { heading: line.trim().replace(/:$/, ''), bullets: [] };
      } else if (line.trim().startsWith('-')) {
        if (currentSection) {
          currentSection.bullets.push(line.trim().replace(/^-\s*/, ''));
        }
      } else {
        // If not a heading or bullet, treat as summary
        if (!currentSection) currentSection = { heading: '', bullets: [] };
        currentSection.bullets.push(line.trim());
      }
    });
    if (currentSection) sections.push(currentSection);
    return (
      <div style={{ marginTop: 12, color: '#444', fontSize: 15, lineHeight: 1.7 }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 18 }}>
            {section.heading && <div style={{ fontWeight: 700, color: '#38c6ff', marginBottom: 6 }}>{section.heading}</div>}
            {section.bullets.length > 0 && (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {section.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  const cardStyle = {
    maxWidth: 600,
    margin: '40px auto',
    fontFamily: 'Segoe UI, Arial',
    background: 'linear-gradient(135deg,#eaf3ff 0%,#fff 100%)',
    borderRadius: 20,
    boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
    padding: 36
  };
  const labelStyle = { fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 };
  const buttonStyle = {
    marginTop: 24,
    background: 'linear-gradient(90deg,#4f8cff,#38c6ff)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 28px',
    fontWeight: 600,
    fontSize: 17,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.10)'
  };
  const progressBar = (score) => (
    <div style={{ margin: '16px 0' }}>
      <div style={{ height: 16, background: '#eee', borderRadius: 8 }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: score > 70 ? '#38c6ff' : score > 40 ? '#ffd700' : '#ff4f4f',
          borderRadius: 8,
          transition: 'width 0.5s'
        }} />
      </div>
      <div style={{ textAlign: 'right', fontWeight: 600, color: '#333', marginTop: 4 }}>{score}%</div>
    </div>
  );

  let parsed = null;
  if (result && typeof result === 'string' && !result.startsWith('Error')) {
    parsed = parseResult(result);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setResult('Please upload a resume file (PDF/DOC/DOCX).');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_description', jobDescription);
    try {
      const response = await axios.post('http://localhost:5000/api/check_resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data.result);
    } catch (error) {
      setResult('Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ textAlign: 'center', color: '#4f8cff', marginBottom: 28, letterSpacing: 1 }}>
        <span role="img" aria-label="search" style={{ fontSize: 32, marginRight: 8 }}>📝</span> Resume Relevance Check
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            <span role="img" aria-label="file" style={{ fontSize: 22 }}>📄</span>
            Resume (PDF/DOC/DOCX):
          </label><br />
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])} required style={{ marginTop: 8, borderRadius: 8, border: '1px solid #cce', padding: 8, fontSize: 15, background: '#f8fbff' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            <span role="img" aria-label="job" style={{ fontSize: 22 }}>💼</span>
            Job Description:
          </label><br />
        <textarea
  value={jobDescription}
  onChange={e => setJobDescription(e.target.value)}
  rows={6}
  style={{
    width: '100%',
    marginTop: 8,
    borderRadius: 8,
    border: '1px solid #cce',
    padding: 10,
    fontSize: 16,
    background: '#f8fbff',
    fontFamily: 'Roboto, Segoe UI, Arial, sans-serif'
  }}
  required
/>
        </div>
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? <><span role="img" aria-label="loading" style={{ fontSize: 20 }}>⏳</span> Checking...</> : <><span role="img" aria-label="check" style={{ fontSize: 20 }}>✅</span> Check Relevance</>}
        </button>
      </form>
      {loading && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <span role="img" aria-label="loading" style={{ fontSize: 40 }}>⏳</span>
          <div style={{ color: '#888', marginTop: 10, fontSize: 17 }}>Analyzing resume...</div>
        </div>
      )}
      {result && (
        <div style={{ marginTop: 36, padding: 28, background: '#f6faff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {parsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span role="img" aria-label="score" style={{ fontSize: 28, marginRight: 10 }}>📊</span>
                <span style={{ fontWeight: 700, fontSize: 21, color: '#38c6ff', letterSpacing: 1 }}>Relevance Score</span>
              </div>
              {progressBar(parsed.score)}
              {renderResultTable(parsed.score, parsed.explanation)}
            </>
          ) : (
            <div style={{ color: '#ff4f4f', fontWeight: 600 }}>{result}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('manager');
  const [companyMail, setCompanyMail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('https://resume-relevance.onrender.com/api/signup', {
        email,
        password,
        company_name: companyName,
        user_name: userName,
        designation,
        company_mail: companyMail
      });
      setSuccess('Signup successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontFamily: 'Segoe UI, Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#4f8cff', marginBottom: 24 }}>Company Signup</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <input type="text" placeholder="User Name" value={userName} onChange={e => setUserName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <select value={designation} onChange={e => setDesignation(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }}>
          <option value="manager">Manager</option>
          <option value="PM">PM</option>
          <option value="DM">DM</option>
          <option value="DP">DP</option>
          <option value="CEO">CEO</option>
          <option value="HR">HR</option>
        </select>
        <input type="email" placeholder="Company Mail ID" value={companyMail} onChange={e => setCompanyMail(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <input type="email" placeholder="Login Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <button type="submit" style={{ width: '100%', background: 'linear-gradient(90deg,#4f8cff,#38c6ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxSizing: 'border-box' }}>Sign Up</button>
      </form>
      {error && <div style={{ color: '#ff4f4f', marginTop: 16, textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ color: '#38c6ff', marginTop: 16, textAlign: 'center' }}>{success}</div>}
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <span>Already have an account? </span>
        <a href="/login" style={{ color: '#4f8cff', fontWeight: 600, textDecoration: 'none' }}>Login</a>
      </div>
    </div>
  );
}

export default Signup;

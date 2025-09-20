import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('https://resume-relevance.onrender.com/api/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontFamily: 'Segoe UI, Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#4f8cff', marginBottom: 24 }}>Company Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cce', fontSize: 16, boxSizing: 'border-box' }} />
        <button type="submit" style={{ width: '100%', background: 'linear-gradient(90deg,#4f8cff,#38c6ff)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxSizing: 'border-box' }}>Login</button>
      </form>
      {error && <div style={{ color: '#ff4f4f', marginTop: 16, textAlign: 'center' }}>{error}</div>}
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <span>Don't have an account? </span>
        <a href="/signup" style={{ color: '#4f8cff', fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
      </div>
    </div>
  );
}

export default Login;

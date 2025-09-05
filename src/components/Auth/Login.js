import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useContextData } from '../../hooks/useContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const { setActiveContext } = useContextData();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) {
      setActiveContext({});
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>
      {error && <div className="error-text">{error}</div>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      <div className="auth-switch-link">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </form>
  );
}

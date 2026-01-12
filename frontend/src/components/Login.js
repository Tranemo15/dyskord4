import React, { useState } from 'react';
import { authAPI } from '../api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register new user
        const response = await authAPI.register(username, email, password);
        onLogin(response.data.user, response.data.token);
      } else {
        // Login existing user
        const response = await authAPI.login(username, password);
        onLogin(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <div className="auth-toggle">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <a onClick={() => setIsRegister(false)}>Login</a>
            </>
          ) : (
            <>
              Need an account?{' '}
              <a onClick={() => setIsRegister(true)}>Register</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;

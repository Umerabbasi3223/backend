import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CSS/LoginSignup.css';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Unable to connect to server.' };
    }
  };

  const register = async (name, email, password, adminSecretKey) => {
    try {
      const requestBody = { name, email, password };
      if (adminSecretKey && adminSecretKey.trim()) {
        requestBody.adminSecretKey = adminSecretKey;
      }
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Unable to connect to server.' };
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setLoggedInUser(user);
        setIsAlreadyLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      
      if (formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.name, 
          formData.email, 
          formData.password,
          isAdminMode ? formData.adminSecretKey : ''
        );
      }

      if (result.success) {
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        const roleText = result.user.role === 'admin' ? ' (Admin)' : '';
        const successMsg = isLogin 
          ? `Welcome back, ${result.user.name}${roleText}!`
          : `Account created successfully, ${result.user.name}${roleText}!`;
        
        setError({ type: 'success', message: successMsg });
        setIsAlreadyLoggedIn(true);
        setLoggedInUser(result.user);
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
    setIsAlreadyLoggedIn(false);
    setLoggedInUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      adminSecretKey: '',
      rememberMe: false
    });
    setIsAdminMode(false);
    setError({ type: 'success', message: 'Logged out successfully!' });
    
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const fillTestCredentials = () => {
    setFormData(prev => ({
      ...prev,
      email: 'testuser@example.com',
      password: 'test123'
    }));
  };

  const testBackendConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/`);
      const data = await response.json();
      setError({ 
        type: 'success', 
        message: `✅ Backend connected! Server: ${data.message || 'Running'}` 
      });
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      setError(`❌ Backend connection failed. Make sure backend is running on port 4000.`);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to orders page
  const goToOrders = () => {
    navigate('/my-orders');
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        {/* Logged In Overlay - Updated with Orders Button */}
        {isAlreadyLoggedIn && (
          <div className="already-logged-in-overlay">
            <div className="already-logged-in-card">
              <div className="welcome-icon">
                {loggedInUser?.role === 'admin' ? '👑' : '🛍️'}
              </div>
              <h2>Welcome back, {loggedInUser?.name}!</h2>
              <p className="user-email">{loggedInUser?.email}</p>
              <div className={`user-role-badge ${loggedInUser?.role}`}>
                {loggedInUser?.role === 'admin' ? 'Administrator' : 'Customer'}
              </div>
              <div className="logged-in-actions">
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/')}
                >
                  Continue Shopping
                </button>
                <button 
                  className="btn-orders"
                  onClick={goToOrders}
                >
                  📦 My Orders
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <button 
                  className="btn-text"
                  onClick={() => setIsAlreadyLoggedIn(false)}
                >
                  Switch Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`login-content ${isAlreadyLoggedIn ? 'blurred' : ''}`}>
          {/* Left Panel - Branding */}
          <div className="login-branding">
            <div className="brand-content">
              <div className="brand-logo">🛒</div>
              <h1>Shopper</h1>
              <p className="brand-tagline">Your one-stop destination for fashion and lifestyle</p>
              <div className="brand-features">
                <div className="feature">
                  <span className="feature-icon">🚚</span>
                  <div>
                    <h4>Free Shipping</h4>
                    <p>On orders over $50</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">💳</span>
                  <div>
                    <h4>Secure Payment</h4>
                    <p>100% secure transactions</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">↩️</span>
                  <div>
                    <h4>Easy Returns</h4>
                    <p>30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="login-form-panel">
            <div className="form-header">
              <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
              <p>{isLogin ? 'Enter your credentials to continue' : 'Join thousands of happy customers'}</p>
            </div>

            <div className="connection-test">
              <button 
                onClick={testBackendConnection}
                className="test-connection-btn"
                disabled={loading}
              >
                🔌 Test Connection
              </button>
              <button 
                onClick={fillTestCredentials}
                className="test-credentials-btn"
                disabled={loading}
              >
                📝 Test Credentials
              </button>
            </div>

            {error && (
              <div className={`message ${typeof error === 'object' && error.type === 'success' ? 'success' : 'error'}`}>
                <span className="message-icon">
                  {typeof error === 'object' && error.type === 'success' ? '✓' : '⚠️'}
                </span>
                <span>{typeof error === 'string' ? error : error.message}</span>
              </div>
            )}

            <div className="auth-tabs">
              <button 
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                disabled={loading}
              >
                Sign In
              </button>
              <button 
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                disabled={loading}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label admin-toggle">
                      <input
                        type="checkbox"
                        checked={isAdminMode}
                        onChange={(e) => setIsAdminMode(e.target.checked)}
                        disabled={loading}
                      />
                      <span>Register as Admin</span>
                      <small>(requires admin key)</small>
                    </label>
                  </div>

                  {isAdminMode && (
                    <div className="form-group">
                      <label htmlFor="adminSecretKey">Admin Secret Key</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔑</span>
                        <input
                          id="adminSecretKey"
                          type={showAdminKey ? "text" : "password"}
                          name="adminSecretKey"
                          value={formData.adminSecretKey}
                          onChange={handleChange}
                          placeholder="Enter admin secret key"
                          disabled={loading}
                        />
                        <button 
                          type="button"
                          className="toggle-input"
                          onClick={() => setShowAdminKey(!showAdminKey)}
                        >
                          {showAdminKey ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <small className="helper-text">Contact administrator for the secret key</small>
                    </div>
                  )}
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button 
                    type="button"
                    className="toggle-input"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {!isLogin && (
                  <small className="helper-text">Password must be at least 6 characters</small>
                )}
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✓</span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    <button 
                      type="button"
                      className="toggle-input"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <button 
                    type="button"
                    className="forgot-password"
                    onClick={() => setError({ type: 'info', message: 'Password reset feature coming soon!' })}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="or-divider">
              <span>Or continue with</span>
            </div>

            <div className="social-login">
              <button 
                type="button"
                className="social-btn google"
                onClick={() => setError({ type: 'info', message: 'Google login coming soon!' })}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              
              <button 
                type="button"
                className="social-btn facebook"
                onClick={() => setError({ type: 'info', message: 'Facebook login coming soon!' })}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
                </svg>
                Facebook
              </button>
            </div>

            {!isLogin && (
              <div className="terms">
                <p>
                  By creating an account, you agree to our 
                  <Link to="/terms"> Terms of Service</Link> and 
                  <Link to="/privacy"> Privacy Policy</Link>
                </p>
              </div>
            )}

            <div className="back-home">
              <Link to="/">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
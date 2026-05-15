import React, { useState, useEffect } from 'react';
import './Admin.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AddProduct from '../AddProduct/AddProduct';
import ListProduct from '../ListProduct/ListProduct';
import Orders from '../Orders/Orders';

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [showAdminKey, setShowAdminKey] = useState(false);
    
    const [loginData, setLoginData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminSecretKey: ''
    });
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    
    // Check login status
    useEffect(() => {
        checkAuthStatus();
    }, [location]);
    
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                if (parsedUser.role !== 'admin') {
                    localStorage.clear();
                    setIsLoggedIn(false);
                    setLoginError('Access denied. Admin privileges required.');
                } else {
                    setIsLoggedIn(true);
                }
            } catch (e) {
                localStorage.clear();
                setIsLoggedIn(false);
            }
        } else {
            setIsLoggedIn(false);
        }
        setIsCheckingAuth(false);
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
        
        try {
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginData.email.trim(),
                    password: loginData.password
                })
            });

            const data = await response.json();
            
            if (data.success) {
                if (data.user.role !== 'admin') {
                    throw new Error('Access denied. This panel is for administrators only.');
                }
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsLoggedIn(true);
                setLoginData({ 
                    name: '', 
                    email: '', 
                    password: '', 
                    confirmPassword: '',
                    adminSecretKey: '' 
                });
                
                // Navigate to admin root
                navigate('/admin', { replace: true });
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (err) {
            setLoginError(err.message || 'Network error. Is backend running?');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
        
        try {
            if (!loginData.name || !loginData.email || !loginData.password) {
                throw new Error('All fields are required');
            }
            
            if (loginData.password !== loginData.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            if (loginData.password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            
            if (showAdminKey && !loginData.adminSecretKey) {
                throw new Error('Admin secret key is required for admin accounts');
            }
            
            const response = await fetch('http://localhost:4000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: loginData.name.trim(),
                    email: loginData.email.trim(),
                    password: loginData.password,
                    adminSecretKey: loginData.adminSecretKey || undefined
                })
            });

            const data = await response.json();
            
            if (data.success) {
                if (data.user.role === 'admin') {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setIsLoggedIn(true);
                    navigate('/admin');
                } else {
                    alert(`✅ Account created as ${data.user.role}!\n\nSince this is not an admin account, you cannot access this panel.`);
                    setLoginData({
                        name: '',
                        email: loginData.email,
                        password: '',
                        confirmPassword: '',
                        adminSecretKey: ''
                    });
                    setIsLogin(true);
                    setShowAdminKey(false);
                }
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (err) {
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setLoginData({ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            adminSecretKey: ''
        });
        navigate('/admin', { replace: true });
    };
    
    const toggleForm = (mode) => {
        setIsLogin(mode);
        setLoginError('');
        setShowAdminKey(false);
        setLoginData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            adminSecretKey: ''
        });
    };
    
    const useDefaultCredentials = () => {
        setLoginData({
            ...loginData,
            email: 'admin@shop.com',
            password: 'admin123'
        });
        setLoginError('');
    };
    
    const getCurrentUser = () => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            return null;
        }
    };
    
    // Dashboard Component
    const Dashboard = () => {
        const user = getCurrentUser();
        return (
            <div className="admin-dashboard">
                <div style={{
                    marginBottom: '25px', 
                    padding: '20px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{margin: '0 0 10px 0', color: '#333'}}>Admin Dashboard</h1>
                    <p style={{margin: 0, color: '#666'}}>
                        Welcome back, <strong>{user?.name || user?.email}</strong>
                    </p>
                </div>
                
                <div style={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px'
                }}>
                    {[
                        { path: '/admin/addproduct', icon: '➕', title: 'Add Product', desc: 'Create new products', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                        { path: '/admin/listproduct', icon: '📋', title: 'List Products', desc: 'Manage products', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
                        { path: '/admin/orders', icon: '📊', title: 'Orders', desc: 'View orders', color: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' }
                    ].map((card, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(card.path)} 
                            style={{
                                padding: '30px', 
                                background: card.color, 
                                color: 'white', 
                                borderRadius: '12px', 
                                cursor: 'pointer', 
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                            }}
                        >
                            <div style={{fontSize: '2.5em', marginBottom: '10px'}}>{card.icon}</div>
                            <h3 style={{margin: '0 0 10px 0'}}>{card.title}</h3>
                            <p style={{margin: 0, opacity: 0.9, fontSize: '0.9em'}}>{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    if (isCheckingAuth) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <div>Loading...</div>
            </div>
        );
    }
    
    // NOT LOGGED IN - Show Login Screen
    if (!isLoggedIn) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f2f5',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '450px'
                }}>
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <h1>{isLogin ? '🔐 Admin Login' : '📝 Create Account'}</h1>
                        <p style={{color: '#666'}}>
                            {isLogin ? 'Administrator access only' : 'Register new account'}
                        </p>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        marginBottom: '25px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        padding: '4px'
                    }}>
                        <button 
                            onClick={() => toggleForm(true)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: isLogin ? '#007bff' : 'transparent',
                                color: isLogin ? 'white' : '#333',
                                cursor: 'pointer',
                                fontWeight: isLogin ? 'bold' : 'normal'
                            }}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => toggleForm(false)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: !isLogin ? '#007bff' : 'transparent',
                                color: !isLogin ? 'white' : '#333',
                                cursor: 'pointer',
                                fontWeight: !isLogin ? 'bold' : 'normal'
                            }}
                        >
                            Register
                        </button>
                    </div>
                    
                    <form onSubmit={isLogin ? handleLogin : handleSignup}>
                        {!isLogin && (
                            <div style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={loginData.name}
                                    onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                                    placeholder="Enter your name"
                                    disabled={loading}
                                    required={!isLogin}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '1em',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={loginData.email}
                                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                placeholder="admin@shop.com"
                                disabled={loading}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                placeholder={isLogin ? "Enter password" : "Minimum 6 characters"}
                                disabled={loading}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '1em',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        {!isLogin && (
                            <div style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={loginData.confirmPassword}
                                    onChange={(e) => setLoginData({...loginData, confirmPassword: e.target.value})}
                                    placeholder="Re-enter password"
                                    disabled={loading}
                                    required={!isLogin}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '1em',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                        
                        {!isLogin && (
                            <div style={{marginBottom: '15px'}}>
                                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                    <input
                                        type="checkbox"
                                        checked={showAdminKey}
                                        onChange={(e) => {
                                            setShowAdminKey(e.target.checked);
                                            if (!e.target.checked) {
                                                setLoginData({...loginData, adminSecretKey: ''});
                                            }
                                        }}
                                        style={{marginRight: '8px'}}
                                    />
                                    Create as Admin Account
                                </label>
                            </div>
                        )}
                        
                        {!isLogin && showAdminKey && (
                            <div style={{
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '6px'
                            }}>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', color: '#856404'}}>
                                    🔑 Admin Secret Key
                                </label>
                                <input
                                    type="password"
                                    value={loginData.adminSecretKey}
                                    onChange={(e) => setLoginData({...loginData, adminSecretKey: e.target.value})}
                                    placeholder="Enter admin secret key"
                                    disabled={loading}
                                    required={showAdminKey}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ffeaa7',
                                        borderRadius: '6px',
                                        fontSize: '1em',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}
                        
                        {loginError && (
                            <div style={{
                                color: '#721c24',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                padding: '12px',
                                borderRadius: '6px',
                                marginBottom: '15px'
                            }}>
                                ⚠️ {loginError}
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: loading ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '1em',
                                fontWeight: '600'
                            }}
                        >
                            {loading ? '⏳ Please wait...' : (isLogin ? 'Login to Admin Panel' : 'Create Account')}
                        </button>
                        
                        {isLogin && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#e9ecef',
                                borderRadius: '6px',
                                textAlign: 'center'
                            }}>
                                <p><strong>Test Credentials:</strong></p>
                                <p style={{margin: '5px 0', fontSize: '0.85em'}}>Email: admin@shop.com</p>
                                <p style={{margin: '5px 0', fontSize: '0.85em'}}>Password: admin123</p>
                                <button 
                                    type="button"
                                    onClick={useDefaultCredentials}
                                    style={{
                                        marginTop: '10px',
                                        padding: '6px 12px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Fill Credentials
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        );
    }
    
    // LOGGED IN - Show Admin Layout with Sidebar and Content
    const user = getCurrentUser();
    
    // Determine which component to show based on URL
    const path = location.pathname;
    let ContentComponent = Dashboard;
    
    if (path === '/admin/addproduct') {
        ContentComponent = AddProduct;
    } else if (path === '/admin/listproduct') {
        ContentComponent = ListProduct;
    } else if (path === '/admin/orders') {
        ContentComponent = Orders;
    }
    
    return (
        <div style={{display: 'flex', minHeight: '100vh'}}>
            <Sidebar onLogout={handleLogout} user={user} />
            <div style={{
                flex: 1,
                marginLeft: '250px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                minHeight: '100vh'
            }}>
                {/* Header */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <span>Welcome, <strong>{user?.name || user?.email}</strong></span>
                        <span style={{
                            marginLeft: '15px',
                            padding: '4px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.75em',
                            textTransform: 'uppercase'
                        }}>
                            {user?.role}
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
                
                {/* Content Area */}
                <ContentComponent />
            </div>
        </div>
    );
};

export default Admin;
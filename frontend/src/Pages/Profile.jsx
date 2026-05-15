import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CSS/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: '',
        address: ''
      });
      setLoading(false);
    } catch (error) {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="container">
          <h1>My Profile</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="user-card">
              <div className="user-avatar-large">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3>{user?.name || 'User'}</h3>
              <p className="user-email">{user?.email}</p>
            </div>

            <nav className="profile-nav">
              <Link to="/profile" className="nav-item active">
                <span>👤</span> My Profile
              </Link>
              <Link to="/orders" className="nav-item">
                <span>📦</span> My Orders
              </Link>
              <Link to="/wishlist" className="nav-item">
                <span>❤️</span> Wishlist
              </Link>
              <button onClick={handleLogout} className="nav-item logout">
                <span>🚪</span> Logout
              </button>
            </nav>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <div className="card-header">
                <h2>Personal Information</h2>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="edit-btn"
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editMode}
                    placeholder="Enter your phone number"
                  />
                </div>

                {editMode && (
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
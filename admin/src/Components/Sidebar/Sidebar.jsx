import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ onLogout, user }) => {
    const location = useLocation();
    
    const handleLogout = () => {
        localStorage.clear();
        if (onLogout) {
            onLogout();
        } else {
            window.location.href = '/admin';
        }
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: '🏠' },
        { path: '/admin/addproduct', label: 'Add Product', icon: '➕' },
        { path: '/admin/listproduct', label: 'List Products', icon: '📋' },
        { path: '/admin/orders', label: 'Orders', icon: '📊' },
    ];

    return (
        <div className='sidebar' style={{
            width: '250px',
            height: '100vh',
            backgroundColor: '#2c3e50',
            color: 'white',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 1000
        }}>
            <div className="sidebar-header" style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center'
            }}>
                <h3 style={{margin: '0 0 10px 0', fontSize: '1.5em'}}>Admin Panel</h3>
                {user && (
                    <div className="user-info" style={{
                        padding: '10px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        marginTop: '10px'
                    }}>
                        <p style={{margin: '0 0 5px 0', fontSize: '0.9em', wordBreak: 'break-word'}}>
                            {user.email}
                        </p>
                        <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.75em',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                        }}>
                            {user.role}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="sidebar-menu" style={{
                flex: 1,
                padding: '20px 0',
                overflowY: 'auto'
            }}>
                {menuItems.map((item) => (
                    <Link 
                        key={item.path}
                        to={item.path} 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '15px 20px',
                            color: isActive(item.path) ? '#3498db' : 'rgba(255,255,255,0.8)',
                            textDecoration: 'none',
                            transition: 'all 0.3s',
                            backgroundColor: isActive(item.path) ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                            borderLeft: isActive(item.path) ? '4px solid #3498db' : '4px solid transparent',
                            fontWeight: isActive(item.path) ? '600' : 'normal'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'white';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                            }
                        }}
                    >
                        <span style={{fontSize: '1.3em', marginRight: '15px', width: '30px', textAlign: 'center'}}>
                            {item.icon}
                        </span>
                        <span style={{fontSize: '1em'}}>{item.label}</span>
                    </Link>
                ))}
            </div>
            
            <div className="sidebar-footer" style={{
                padding: '20px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button 
                    onClick={handleLogout} 
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c0392b';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e74c3c';
                    }}
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
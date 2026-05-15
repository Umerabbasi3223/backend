import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CSS/MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchOrders(token);
  }, [navigate]);

  const fetchOrders = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#10b981',
      'delivered': '#059669',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✓',
      'processing': '⚙️',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📦';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="my-orders">
      {/* Header */}
      <header className="orders-header">
        <div className="header-content">
          <Link to="/" className="logo">
            🛒 Shopper
          </Link>
          <div className="user-info">
            <span className="user-name">👋 {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="orders-container">
        {/* Sidebar */}
        <aside className="orders-sidebar">
          <div className="profile-summary">
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
            <div className={`role-badge ${user?.role}`}>
              {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <Link to="/" className="nav-item">
              <span>🏠</span> Dashboard
            </Link>
            <Link to="/my-orders" className="nav-item active">
              <span>📦</span> My Orders
            </Link>
            <Link to="/profile" className="nav-item">
              <span>👤</span> Profile Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="orders-main">
          <div className="orders-header-main">
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h2>No Orders Yet</h2>
                <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                <Link to="/" className="shop-now-btn">
                  Start Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.orderId} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.orderId}</h3>
                      <p className="order-date">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                      </span>
                      <button 
                        className="view-details-btn"
                        onClick={() => setSelectedOrder(selectedOrder === order.orderId ? null : order.orderId)}
                      >
                        {selectedOrder === order.orderId ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </div>

                  <div className="order-summary">
                    <div className="summary-item">
                      <span className="label">Total Items:</span>
                      <span className="value">{order.items?.length || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Total Amount:</span>
                      <span className="value highlight">{formatPrice(order.total)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Payment Method:</span>
                      <span className="value">{order.paymentMethod?.toUpperCase()}</span>
                    </div>
                  </div>

                  {selectedOrder === order.orderId && (
                    <div className="order-details">
                      <h4>Order Items</h4>
                      <div className="items-list">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <img 
                              src={item.image || 'https://via.placeholder.com/80'} 
                              alt={item.name}
                              className="item-image"
                            />
                            <div className="item-info">
                              <h5>{item.name}</h5>
                              <p>Size: {item.size}</p>
                              <p>Quantity: {item.quantity}</p>
                              <p className="item-price">{formatPrice(item.price)}</p>
                            </div>
                            <div className="item-total">
                              <p>Total: {formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-summary-detailed">
                        <h4>Order Summary</h4>
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Shipping:</span>
                          <span>{formatPrice(order.shipping)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Tax:</span>
                          <span>{formatPrice(order.tax)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="summary-row discount">
                            <span>Discount:</span>
                            <span>-{formatPrice(order.discount)}</span>
                          </div>
                        )}
                        <div className="summary-row total">
                          <span>Total:</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      <div className="shipping-info">
                        <h4>Shipping Information</h4>
                        <div className="info-row">
                          <span>Address:</span>
                          <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                        </div>
                        <div className="info-row">
                          <span>Contact:</span>
                          <p>{order.contact?.phone}</p>
                        </div>
                        {order.notes && (
                          <div className="info-row">
                            <span>Notes:</span>
                            <p>{order.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="order-timeline">
                        <h4>Order Timeline</h4>
                        <div className="timeline">
                          {order.statusHistory?.map((history, idx) => (
                            <div key={idx} className="timeline-item">
                              <div className="timeline-icon">
                                {getStatusIcon(history.status)}
                              </div>
                              <div className="timeline-content">
                                <p className="timeline-status">{history.status.toUpperCase()}</p>
                                <p className="timeline-date">{formatDate(history.timestamp)}</p>
                                {history.note && (
                                  <p className="timeline-note">{history.note}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyOrders;
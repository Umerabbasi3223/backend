import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CSS/Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch orders from backend
      fetchUserOrders(token, parsedUser._id || parsedUser.id);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate, retryCount]);

  const fetchUserOrders = async (token, userId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching orders for user:', userId);
      
      // Fetch orders from backend
      const response = await fetch('http://localhost:4000/api/orders/my-orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 401) {
        // Token expired
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Orders response:', data);
      
      if (data.success) {
        if (data.orders && data.orders.length > 0) {
          // Transform backend data to match frontend format
          const transformedOrders = data.orders.map(order => ({
            _id: order._id,
            orderId: order.orderId || order._id,
            date: order.createdAt || new Date().toISOString(),
            total: order.total || 0,
            status: order.status || 'pending',
            items: order.items?.map(item => ({
              name: item.name || 'Product',
              quantity: item.quantity || 1,
              price: item.price || 0,
              image: item.image || 'https://via.placeholder.com/50',
              size: item.size || 'M'
            })) || [],
            shippingAddress: order.shippingAddress,
            contact: order.contact,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            tax: order.tax || 0,
            discount: order.discount || 0,
            statusHistory: order.statusHistory || []
          }));
          
          setOrders(transformedOrders);
        } else {
          // No orders found
          setOrders([]);
        }
      } else {
        setOrders([]);
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      let errorMsg = 'Failed to load orders. ';
      
      if (err.message.includes('Failed to fetch')) {
        errorMsg += 'Backend server may not be running. Please ensure the backend is started on port 4000.';
      } else if (err.message.includes('401')) {
        errorMsg += 'Your session has expired. Please login again.';
      } else {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // View Order Details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Track Order
  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    
    // Generate mock tracking info
    const tracking = generateTrackingInfo(order);
    setTrackingInfo(tracking);
    setShowTrackModal(true);
  };

  // Generate tracking information
  const generateTrackingInfo = (order) => {
    const statusUpdates = order.statusHistory || [];
    const couriers = ['FedEx', 'UPS', 'DHL', 'USPS', 'BlueDart'];
    const trackingNumbers = ['FDX123456789', 'UPS987654321', 'DHL456789123', 'USPS789123456', 'BLUE654321987'];
    
    const randomIndex = Math.floor(Math.random() * couriers.length);
    
    return {
      orderId: order.orderId,
      trackingNumber: trackingNumbers[randomIndex],
      courier: couriers[randomIndex],
      estimatedDelivery: calculateDeliveryDate(order.date),
      currentStatus: order.status,
      updates: statusUpdates.length > 0 ? statusUpdates : [
        { status: 'order_placed', timestamp: order.date, note: 'Order placed successfully' },
        { status: 'confirmed', timestamp: new Date(Date.parse(order.date) + 3600000).toISOString(), note: 'Order confirmed' },
        { status: 'processing', timestamp: new Date(Date.parse(order.date) + 7200000).toISOString(), note: 'Processing order' },
        { status: 'shipped', timestamp: new Date(Date.parse(order.date) + 86400000).toISOString(), note: 'Shipped via ' + couriers[randomIndex] },
        ...(order.status === 'delivered' ? [
          { status: 'delivered', timestamp: new Date(Date.parse(order.date) + 172800000).toISOString(), note: 'Delivered successfully' }
        ] : [])
      ]
    };
  };

  const calculateDeliveryDate = (orderDate) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 5); // 5 days delivery estimate
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove order from state
        setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
        showNotification('Order deleted successfully!', 'success');
      } else {
        showNotification(`Failed to delete order: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotification('Failed to delete order. Please try again.', 'error');
      
      // Fallback: Remove from frontend state only
      setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      showNotification('Order removed from view (backend may still have it)', 'info');
    }
  };

  // Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Update order status in state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: 'cancelled' }
              : order
          )
        );
        showNotification('Order cancelled successfully!', 'success');
      } else {
        showNotification(`Failed to cancel order: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      showNotification('Failed to cancel order. Please try again.', 'error');
    }
  };

  // Download Invoice
  const handleDownloadInvoice = (order) => {
    // Create a simple invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Order #${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-section { text-align: right; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>INVOICE</h1>
          <h3>Order #${order.orderId}</h3>
        </div>
        
        <div class="invoice-details">
          <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <p>Subtotal: $${order.subtotal?.toFixed(2) || '0.00'}</p>
          <p>Shipping: $${order.shipping?.toFixed(2) || '0.00'}</p>
          <p>Tax: $${order.tax?.toFixed(2) || '0.00'}</p>
          <p>Discount: $${order.discount?.toFixed(2) || '0.00'}</p>
          <h3>Total: $${order.total.toFixed(2)}</h3>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-order-${order.orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Invoice downloaded successfully!', 'success');
  };

  // Write Review
  const handleWriteReview = (orderId) => {
    const productName = prompt('Enter the product name you want to review:');
    if (productName) {
      const review = prompt('Write your review (1-5 stars):\nExample: ⭐⭐⭐⭐⭐ Excellent product!');
      if (review) {
        showNotification(`Review submitted for ${productName}!`, 'success');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'pending': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return '✅';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Custom Notification */}
      {notification.show && (
        <div className={`custom-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : 
             notification.type === 'error' ? '❌' : 
             notification.type === 'info' ? 'ℹ️' : '📢'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.orderId}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-details-grid">
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.date)}</p>
                  <p><strong>Status:</strong> 
                    <span className="status-badge" style={{background: getStatusColor(selectedOrder.status)}}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod?.toUpperCase() || 'COD'}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Shipping Address</h4>
                  {selectedOrder.shippingAddress ? (
                    <>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p>Address not specified</p>
                  )}
                </div>
                
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  {selectedOrder.contact ? (
                    <>
                      <p><strong>Email:</strong> {selectedOrder.contact.email}</p>
                      <p><strong>Phone:</strong> {selectedOrder.contact.phone || 'Not provided'}</p>
                    </>
                  ) : (
                    <p>Contact information not available</p>
                  )}
                </div>
              </div>
              
              <div className="order-items-section">
                <h4>Order Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="item-cell">
                            <img src={item.image} alt={item.name} />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal?.toFixed(2) || selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>${selectedOrder.shipping?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>-${selectedOrder.discount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-row total">
                  <strong>Total:</strong>
                  <strong>${selectedOrder.total.toFixed(2)}</strong>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => handleDownloadInvoice(selectedOrder)}>
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Track Order Modal */}
      {showTrackModal && selectedOrder && trackingInfo && (
        <div className="modal-overlay" onClick={() => setShowTrackModal(false)}>
          <div className="modal-content track-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track Order - #{selectedOrder.orderId}</h3>
              <button className="close-btn" onClick={() => setShowTrackModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="tracking-info">
                <div className="tracking-header">
                  <div>
                    <p><strong>Tracking Number:</strong> {trackingInfo.trackingNumber}</p>
                    <p><strong>Courier:</strong> {trackingInfo.courier}</p>
                  </div>
                  <div>
                    <p><strong>Estimated Delivery:</strong> {trackingInfo.estimatedDelivery}</p>
                    <p><strong>Current Status:</strong> 
                      <span className="status-badge" style={{background: getStatusColor(trackingInfo.currentStatus)}}>
                        {trackingInfo.currentStatus.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="tracking-timeline">
                  <h4>Tracking Timeline</h4>
                  <div className="timeline">
                    {trackingInfo.updates.map((update, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <h5>{update.status.replace('_', ' ').toUpperCase()}</h5>
                          <p>{new Date(update.timestamp).toLocaleString()}</p>
                          <p className="timeline-note">{update.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTrackModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                Print Tracking
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="orders-header">
        <div className="container">
          <h1>My Orders</h1>
          <p>Track, view details, and manage your purchases</p>
        </div>
      </div>

      <div className="container">
        <div className="orders-layout">
          {/* Sidebar */}
          <div className="orders-sidebar">
            <div className="user-card">
              <div className="user-avatar-large">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3>{user?.name || 'User'}</h3>
              <p className="user-email">{user?.email}</p>
            </div>

            <nav className="orders-nav">
              <Link to="/profile" className="nav-item">
                <span>👤</span> My Profile
              </Link>
              <Link to="/orders" className="nav-item active">
                <span>📦</span> My Orders
              </Link>
              <Link to="/wishlist" className="nav-item">
                <span>❤️</span> Wishlist
              </Link>
              <button 
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }} 
                className="nav-item logout"
              >
                <span>🚪</span> Logout
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="orders-content">
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-header">
                  <span className="error-icon">⚠️</span>
                  <strong>Error Loading Orders</strong>
                </div>
                <p>{error}</p>
                <div className="error-actions">
                  <button onClick={handleRetry} className="retry-btn">
                    🔄 Retry
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            {!error && orders.length > 0 && (
              <div className="order-stats">
                <div className="stat-card">
                  <span className="stat-icon">📦</span>
                  <h3>{orders.length}</h3>
                  <p>Total Orders</p>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">✅</span>
                  <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
                  <p>Delivered</p>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔄</span>
                  <h3>{orders.filter(o => o.status === 'processing').length}</h3>
                  <p>Processing</p>
                </div>
              </div>
            )}

            {/* Filters - Only show if we have orders */}
            {orders.length > 0 && (
              <div className="orders-filters">
                <div className="filter-buttons">
                  {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                    <button
                      key={status}
                      className={`filter-btn ${filter === status ? 'active' : ''}`}
                      onClick={() => setFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orders List or Empty State */}
            {orders.length === 0 ? (
              <div className="no-orders">
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <h3>No Orders Yet</h3>
                  <p>
                    {error 
                      ? "Could not load orders. Please check backend connection."
                      : "You haven't placed any orders yet. Start shopping now!"
                    }
                  </p>
                  <div className="empty-actions">
                    <Link to="/" className="shop-btn">
                      Start Shopping
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map(order => (
                  <div key={order.orderId} className="order-card">
                    <div className="order-header">
                      <div>
                        <h3>Order #{order.orderId}</h3>
                        <p className="order-date">{formatDate(order.date)}</p>
                        {order.shippingAddress?.address && (
                          <p className="order-address">{order.shippingAddress.address}</p>
                        )}
                      </div>
                      <div className="order-status">
                        <span 
                          className="status-badge"
                          style={{ background: getStatusColor(order.status) }}
                        >
                          {getStatusIcon(order.status)} {order.status.toUpperCase()}
                        </span>
                        <p className="order-total">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className="order-items">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="order-item">
                            <div className="item-image">
                              <img src={item.image} alt={item.name} />
                            </div>
                            <div className="item-info">
                              <h4>{item.name}</h4>
                              <div className="item-details">
                                <span>Qty: {item.quantity}</span>
                                <span>Size: {item.size}</span>
                              </div>
                            </div>
                            <div className="item-price">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="more-items">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="order-footer">
                      <div className="order-actions">
                        <button 
                          className="view-btn" 
                          onClick={() => handleViewOrder(order)}
                        >
                          📄 View Details
                        </button>
                        
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button 
                            className="track-btn" 
                            onClick={() => handleTrackOrder(order)}
                          >
                            📍 Track Order
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <button 
                            className="review-btn" 
                            onClick={() => handleWriteReview(order.orderId)}
                          >
                            ⭐ Write Review
                          </button>
                        )}
                        
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button 
                            className="cancel-btn" 
                            onClick={() => handleCancelOrder(order.orderId)}
                          >
                            ❌ Cancel
                          </button>
                        )}
                        
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteOrder(order.orderId)}
                        >
                          🗑️ Delete
                        </button>
                        
                        <button 
                          className="invoice-btn" 
                          onClick={() => handleDownloadInvoice(order)}
                        >
                          📄 Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
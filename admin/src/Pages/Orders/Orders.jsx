import React, { useState, useEffect } from 'react';
import './Orders.css';

const Orders = () => {
  const [allOrders, setAllOrders] = useState([]); // Store ALL orders
  const [displayedOrders, setDisplayedOrders] = useState([]); // Orders to display
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [filter, setFilter] = useState('active'); // 'active', 'all', 'delivered', 'cancelled'

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update displayed orders when filter changes
  useEffect(() => {
    filterOrders();
  }, [allOrders, filter]);

  const filterOrders = () => {
    switch(filter) {
      case 'active':
        // Show only pending, confirmed, processing, shipped orders
        const activeOrders = allOrders.filter(order => 
          ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
        );
        setDisplayedOrders(activeOrders);
        break;
        
      case 'delivered':
        // Show only delivered orders
        const deliveredOrders = allOrders.filter(order => 
          order.status === 'delivered'
        );
        setDisplayedOrders(deliveredOrders);
        break;
        
      case 'cancelled':
        // Show only cancelled orders
        const cancelledOrders = allOrders.filter(order => 
          order.status === 'cancelled'
        );
        setDisplayedOrders(cancelledOrders);
        break;
        
      case 'all':
      default:
        // Show all orders
        setDisplayedOrders(allOrders);
        break;
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || user.role !== 'admin') {
        showNotification('Admin access required', 'error');
        return;
      }
      
      console.log('🔄 Fetching orders with token:', token.substring(0, 20) + '...');
      
      // Use admin endpoint with status=all to get ALL orders
      const response = await fetch('http://localhost:4000/api/admin/orders?status=all&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        localStorage.clear();
        window.location.href = '/admin';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📦 Orders API response:', {
        success: data.success,
        count: data.orders?.length || 0,
        total: data.total
      });
      
      if (data.success) {
        console.log('✅ Orders fetched successfully:', data.orders.length);
        setAllOrders(data.orders || []);
        
        if (data.orders.length === 0) {
          showNotification('No orders found in the system', 'info');
        } else {
          showNotification(`Loaded ${data.orders.length} orders`, 'success');
        }
      } else {
        showNotification(data.message || 'Failed to fetch orders', 'error');
        setAllOrders([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      
      let errorMsg = 'Failed to load orders. ';
      if (error.message.includes('Failed to fetch')) {
        errorMsg += 'Backend server may not be running. Please ensure backend is started on port 4000.';
      } else {
        errorMsg += error.message;
      }
      
      showNotification(errorMsg, 'error');
      setAllOrders([]);
      
      // Try to fetch without auth for debugging
      try {
        console.log('🔄 Attempting public orders fetch for debugging...');
        const publicResponse = await fetch('http://localhost:4000/api/all-orders');
        const publicData = await publicResponse.json();
        console.log('Public orders response:', publicData);
      } catch (publicError) {
        console.error('Public fetch also failed:', publicError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#2196f3';
      case 'processing': return '#9c27b0';
      case 'shipped': return '#673ab7';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Please login to continue', 'error');
        return;
      }
      
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
      
      const response = await fetch(`http://localhost:4000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Status changed to ${newStatus} by admin`
        })
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        showNotification(`Order ${orderId} updated to ${newStatus}`, 'success');
        
        // Update the order in state
        setAllOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { 
                  ...order, 
                  status: newStatus,
                  statusHistory: [
                    ...(order.statusHistory || []),
                    {
                      status: newStatus,
                      timestamp: new Date().toISOString(),
                      note: `Status changed to ${newStatus} by admin`
                    }
                  ]
                } 
              : order
          )
        );
        
        // Update selected order if it's open
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(prev => ({ 
            ...prev, 
            status: newStatus 
          }));
        }
        
        // If order is delivered or cancelled, show success message
        if (newStatus === 'delivered') {
          showNotification(`Order ${orderId} marked as delivered! 🎉`, 'success');
        } else if (newStatus === 'cancelled') {
          showNotification(`Order ${orderId} has been cancelled`, 'warning');
        }
        
      } else {
        showNotification(`Failed: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showNotification('Failed to update order status', 'error');
    }
  };

  // Delete delivered or cancelled order
  const deleteOrder = async (orderId) => {
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
        showNotification(`Order ${orderId} deleted successfully`, 'success');
        
        // Remove from state
        setAllOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      } else {
        showNotification(`Failed to delete: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotification('Failed to delete order', 'error');
      
      // Still remove from frontend state
      setAllOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      showNotification('Order removed from view', 'info');
    }
  };

  const getOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find order in current list first
      const orderFromList = allOrders.find(o => o.orderId === orderId);
      if (orderFromList) {
        setSelectedOrder(orderFromList);
        return;
      }
      
      // If not found, fetch from API
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.order);
      } else {
        showNotification('Order not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showNotification('Failed to fetch order details', 'error');
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      'confirmed': ['processing', 'shipped', 'delivered', 'cancelled'],
      'processing': ['shipped', 'delivered', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [], // No further status changes
      'cancelled': []  // No further status changes
    };
    
    return statusFlow[currentStatus] || [];
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateRevenue = () => {
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    return deliveredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  };

  const getActiveOrdersCount = () => {
    return allOrders.filter(order => 
      ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
    ).length;
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : 
             notification.type === 'error' ? '❌' : 
             notification.type === 'info' ? 'ℹ️' : 
             notification.type === 'warning' ? '⚠️' : '📢'}
          </span>
          <span>{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="page-header">
        <h1>📦 Orders Management</h1>
        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn">
            🔄 Refresh Orders
          </button>
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-number">{allOrders.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Active</h3>
            <p className="stat-number">
              {getActiveOrdersCount()}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-number">
              ${calculateRevenue().toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Delivered</h3>
            <p className="stat-number">
              {allOrders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          ⚡ Active Orders ({getActiveOrdersCount()})
        </button>
        <button 
          className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilter('delivered')}
        >
          ✅ Delivered ({allOrders.filter(o => o.status === 'delivered').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          ❌ Cancelled ({allOrders.filter(o => o.status === 'cancelled').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📋 All Orders ({allOrders.length})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {filter === 'active' ? '⏳' : 
             filter === 'delivered' ? '✅' : 
             filter === 'cancelled' ? '❌' : '📭'}
          </div>
          <h2>No {filter} Orders Found</h2>
          <p>
            {filter === 'active' ? 'No active orders pending action.' :
             filter === 'delivered' ? 'No delivered orders yet.' :
             filter === 'cancelled' ? 'No cancelled orders.' :
             'No orders found in the system.'}
          </p>
          <button onClick={fetchOrders} className="retry-btn">
            🔄 Refresh
          </button>
        </div>
      ) : (
        <div className="orders-container">
          <div className="section-header">
            <h2>
              {filter === 'active' ? 'Active Orders' :
               filter === 'delivered' ? 'Delivered Orders' :
               filter === 'cancelled' ? 'Cancelled Orders' : 'All Orders'} 
              ({displayedOrders.length})
            </h2>
          </div>
          
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map(order => (
                  <tr key={order._id} className="order-row">
                    <td>
                      <strong className="order-id">{order.orderId}</strong>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-name">{order.userName || 'Guest'}</div>
                        <div className="customer-email">{order.userEmail}</div>
                        {order.contact?.phone && (
                          <div className="customer-phone">📱 {order.contact.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="order-date">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <div className="items-count">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="order-total">
                      <strong>${order.total?.toFixed(2) || '0.00'}</strong>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{backgroundColor: getStatusColor(order.status)}}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => getOrderDetails(order.orderId)}
                          className="btn-view"
                          title="View Details"
                        >
                          👁️
                        </button>
                        
                        {['delivered', 'cancelled'].includes(order.status) && (
                          <button 
                            onClick={() => deleteOrder(order.orderId)}
                            className="btn-delete"
                            title="Delete Order"
                          >
                            🗑️
                          </button>
                        )}
                        
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                            className="status-select"
                          >
                            <option value={order.status}>
                              {order.status.toUpperCase()}
                            </option>
                            {getStatusOptions(order.status).map(status => (
                              <option key={status} value={status}>
                                {status.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal - Keep the same as before */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* ... (keep your existing modal content) ... */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
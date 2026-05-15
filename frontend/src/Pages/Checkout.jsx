import React, { useState, useEffect, useContext } from 'react';
import './CSS/Checkout.css';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';

const Checkout = () => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Pakistan'
  });
  const [errors, setErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  const navigate = useNavigate();
  const { clearCart, getCartItemsArray, getCartTotal } = useContext(ShopContext);

  // Load order data from localStorage or cart context
  useEffect(() => {
    const savedOrder = localStorage.getItem('orderData');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
    } else {
      // Create order from current cart
      const cartItems = getCartItemsArray();
      const subtotal = getCartTotal();
      const shipping = subtotal > 100 ? 0 : 10;
      const tax = subtotal * 0.08;
      const total = subtotal + shipping + tax;
      
      setOrderData({
        items: cartItems,
        subtotal,
        shipping,
        tax,
        total,
        timestamp: new Date().toISOString()
      });
    }
  }, [getCartItemsArray, getCartTotal]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Submit order to backend
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      alert('Please fill all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      // Get user token for authentication
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Prepare order data
      const orderToSend = {
        userId: user.id || 'guest',
        userEmail: user.email || formData.email,
        userName: `${formData.firstName} ${formData.lastName}`,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        contact: {
          phone: formData.phone,
          email: formData.email
        },
        items: orderData.items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.new_price || item.price,
          quantity: item.quantity,
          size: item.size || 'Medium',
          image: item.image
        })),
        paymentMethod,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        discount: orderData.discount || 0,
        total: orderData.total,
        status: 'pending', // Initial status
        notes: ''
      };

      console.log('📦 Submitting order to backend:', orderToSend);

      const response = await fetch('http://localhost:4000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(orderToSend)
      });

      const data = await response.json();
      console.log('✅ Order response:', data);

      if (data.success) {
        // Order created successfully
        setOrderId(data.order._id || data.order.id);
        setOrderStatus('confirmed');
        setOrderPlaced(true);
        
        // Clear cart after successful order
        clearCart();
        localStorage.removeItem('orderData');
        
        // Save order ID for tracking
        localStorage.setItem('lastOrderId', data.order._id || data.order.id);
        
        // Show success message
        alert(`✅ Order placed successfully! Order ID: ${data.order._id || data.order.id}`);
        
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ Order error:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Track order status (polling)
  useEffect(() => {
    if (!orderId) return;
    
    const checkOrderStatus = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/orders/${orderId}/status`);
        const data = await response.json();
        
        if (data.success) {
          setOrderStatus(data.order.status);
        }
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    };
    
    // Check status every 30 seconds
    const interval = setInterval(checkOrderStatus, 30000);
    checkOrderStatus(); // Initial check
    
    return () => clearInterval(interval);
  }, [orderId]);

  // Status badge color
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

  if (!orderData) {
    return (
      <div className="checkout-empty">
        <div className="empty-icon">🛒</div>
        <h2>No items to checkout</h2>
        <p>Your cart is empty. Add some products first!</p>
        <button onClick={() => navigate('/')} className="shop-btn">
          Continue Shopping
        </button>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="order-confirmation">
        <div className="confirmation-icon">✅</div>
        <h2>Order Confirmed!</h2>
        <p>Thank you for your purchase. Your order has been received.</p>
        
        <div className="order-summary-card">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Status:</strong> 
            <span className="status-badge" style={{backgroundColor: getStatusColor(orderStatus)}}>
              {orderStatus.toUpperCase()}
            </span>
          </p>
          <p><strong>Total:</strong> ${orderData.total.toFixed(2)}</p>
          <p><strong>Items:</strong> {orderData.items.length}</p>
          <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
        </div>
        
        <div className="confirmation-actions">
          <button onClick={() => navigate('/orders')} className="track-btn">
            Track Your Order
          </button>
          <button onClick={() => navigate('/')} className="continue-btn">
            Continue Shopping
          </button>
        </div>
        
        <div className="whats-next">
          <h4>What's next?</h4>
          <ul>
            <li>📧 You'll receive an email confirmation shortly</li>
            <li>📦 We'll notify you when your order ships</li>
            <li>🚚 Track your order in "My Orders" section</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="checkout-container">
        <div className="checkout-left">
          <h2>Checkout</h2>
          
          {/* Contact Information */}
          <div className="checkout-section">
            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+92 300 1234567"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="checkout-section">
            <h3>Shipping Address</h3>
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Karachi"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Sindh"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>ZIP / Postal Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="75500"
                  className={errors.zipCode ? 'error' : ''}
                />
                {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
              </div>
              <div className="form-group">
                <label>Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options">
              <div className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                   onClick={() => setPaymentMethod('card')}>
                <div className="option-icon">💳</div>
                <div className="option-details">
                  <h4>Credit/Debit Card</h4>
                  <p>Pay securely with your card</p>
                </div>
              </div>
              
              <div className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                   onClick={() => setPaymentMethod('cod')}>
                <div className="option-icon">💰</div>
                <div className="option-details">
                  <h4>Cash on Delivery</h4>
                  <p>Pay when you receive the order</p>
                </div>
              </div>
              
              <div className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}
                   onClick={() => setPaymentMethod('bank')}>
                <div className="option-icon">🏦</div>
                <div className="option-details">
                  <h4>Bank Transfer</h4>
                  <p>Transfer directly to our bank account</p>
                </div>
              </div>
            </div>
            
            {/* Card Details (if card selected) */}
            {paymentMethod === 'card' && (
              <div className="card-details">
                <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="checkout-right">
          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-items">
              {orderData.items.map((item, index) => (
                <div key={index} className="summary-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>Size: {item.size || 'Medium'}</p>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    ${((item.new_price || item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${orderData.subtotal.toFixed(2)}</span>
              </div>
              
              {orderData.discount > 0 && (
                <div className="total-row discount">
                  <span>Discount</span>
                  <span>-${orderData.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="total-row">
                <span>Shipping</span>
                <span>
                  {orderData.shipping === 0 ? 'FREE' : `$${orderData.shipping.toFixed(2)}`}
                </span>
              </div>
              
              <div className="total-row">
                <span>Tax</span>
                <span>${orderData.tax.toFixed(2)}</span>
              </div>
              
              <div className="total-row grand-total">
                <span>Total</span>
                <span>${orderData.total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handlePlaceOrder} 
              className="place-order-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Processing...
                </>
              ) : (
                `Place Order - $${orderData.total.toFixed(2)}`
              )}
            </button>
            
            <p className="secure-payment">
              🔒 Your payment is secure and encrypted
            </p>
            
            <div className="return-policy">
              <h4>Return Policy</h4>
              <p>30-day return policy. Full refund if items are unused and in original condition.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
import React, { useState, useEffect, useContext } from 'react'
import './CartItems.css'
import remove_icon from '../Assets/cart_cross_icon.png';
import { Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';

const CartItems = () => {
  const { getCartItemsArray, removeFromCart, clearCart, totalCartItems } = useContext(ShopContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  // Format price helper
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0.00';
    }
    return Number(price).toFixed(2);
  };

  // Load cart items from context
  useEffect(() => {
    const loadCartItems = async () => {
      setLoading(true);
      try {
        // Get cart items from ShopContext
        const cartItems = getCartItemsArray();
        
        // If cart is empty
        if (!cartItems || cartItems.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch product details from backend for better data
        const productIds = [...new Set(cartItems.map(item => item.id))];
        
        // Only fetch if we have product IDs
        if (productIds.length > 0) {
          const response = await fetch('http://localhost:4000/products');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.products) {
              // Enrich cart items with backend data
              const enrichedItems = cartItems.map(cartItem => {
                const product = data.products.find(p => p.id === parseInt(cartItem.id));
                return {
                  ...cartItem,
                  name: product?.name || cartItem.name || 'Product',
                  new_price: product?.new_price || cartItem.price || cartItem.new_price || 0,
                  image: product?.image || cartItem.image || '',
                  category: product?.category || cartItem.category || '',
                  size: cartItem.size || 'Medium',
                  quantity: cartItem.quantity || 1
                };
              });
              setProducts(enrichedItems);
            } else {
              setProducts(cartItems);
            }
          } else {
            // Fallback to cart data from context
            setProducts(cartItems);
          }
        } else {
          setProducts(cartItems);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to cart data from context
        setProducts(getCartItemsArray());
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [getCartItemsArray, totalCartItems]);

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }

  // Update local UI state immediately
  setProducts(prev =>
    prev.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
  );

  // Update localStorage cart
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');

  if (cart[productId]) {
    cart[productId].quantity = newQuantity;
  } else {
    cart[productId] = { quantity: newQuantity };
  }

  localStorage.setItem('cart', JSON.stringify(cart));
};

  // Apply coupon
  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'SAVE10') {
      setDiscount(10);
      alert('🎉 Coupon applied! You saved 10%');
    } else if (coupon.toUpperCase() === 'WELCOME20') {
      setDiscount(20);
      alert('🎉 Welcome coupon applied! You saved 20%');
    } else {
      setDiscount(0);
      alert('Invalid coupon code');
    }
    setCoupon('');
  };

  // Calculate totals
  const subtotal = products.reduce((sum, item) => {
    const price = item?.new_price || item?.price || 0;
    const quantity = item?.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const shipping = subtotal > 100 ? 0 : 10;
  const tax = (subtotal - (subtotal * discount / 100)) * 0.08;
  const discountAmount = subtotal * (discount / 100);
  const total = (subtotal - discountAmount) + shipping + tax;
  const totalItems = products.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Handle checkout
  const handleCheckout = () => {
    if (products.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderData = {
      items: products,
      subtotal,
      shipping,
      discount: discountAmount,
      tax,
      total,
      coupon: discount > 0 ? coupon : null,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('orderData', JSON.stringify(orderData));
    navigate('/checkout');
  };

  // Loading state
  if (loading) {
    return (
      <div className="empty-cart">
        <div className="loading-spinner"></div>
        <h2>Loading Your Cart...</h2>
        <p>Fetching product details from server</p>
      </div>
    );
  }

  // Empty cart state
  if (products.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <Link to="/">
          <button className="shop-now-button">Start Shopping</button>
        </Link>
        
        <div className="suggestions">
          <h3>Recently Viewed</h3>
          <div className="suggestion-items">
            <p>Check out our latest collections:</p>
            <Link to="/mens" className="suggestion-link">Men's Collection</Link>
            <Link to="/womens" className="suggestion-link">Women's Collection</Link>
            <Link to="/kids" className="suggestion-link">Kids' Collection</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='cart-items'>
      <div className="cart-header">
        <h1>Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</h1>
        <button onClick={clearCart} className="clear-cart-btn">
          Clear Cart
        </button>
      </div>
      
      {/* Cart Table Header */}
      <div className="cart-items-format-main">
        <p>Product</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />

      {/* Cart Items */}
      {products.map((item, index) => {
        const itemTotal = (item.new_price || item.price || 0) * (item.quantity || 1);
        const key = item.id ? `${item.id}-${item.size || 'default'}` : `item-${index}`;
        
        return (
          <div key={key}>
            <div className="cartitems-format">
              <img 
                src={item.image || ''} 
                alt={item.name || 'Product'} 
                className='carticon-product-image'
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80';
                  e.target.onerror = null;
                }}
              />
              <div className="product-details">
                <p className="product-name">{item.name || 'Product'}</p>
                {item.size && <p className="product-size">Size: {item.size}</p>}
                {item.category && <p className="product-category">{item.category}</p>}
              </div>
              <p className="product-price">${formatPrice(item.new_price || item.price)}</p>
              
              {/* Quantity Controls */}
              <div className="quantity-controls">
                <button 
                  onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                  className="quantity-btn minus"
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-display">{item.quantity || 1}</span>
                <button 
                  onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                  className="quantity-btn plus"
                >
                  +
                </button>
              </div>
              
              <p className="item-total">${formatPrice(itemTotal)}</p>
              <img 
                src={remove_icon} 
                onClick={() => removeFromCart(item.id)} 
                alt="remove" 
                className="remove-icon"
                title="Remove item from cart"
              />
            </div>
            <hr />
          </div>
        );
      })}

      {/* Coupon Section */}
      <div className="coupon-section">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          className="coupon-input"
        />
        <button onClick={applyCoupon} className="apply-coupon-btn">
          Apply Coupon
        </button>
        {discount > 0 && (
          <div className="coupon-applied">
            ✅ {discount}% discount applied!
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="cart-items-summary">
        <h2>Order Summary</h2>
        <div className="summary-details">
          <div className="summary-row">
            <span className="summary-label">Subtotal ({totalItems} items)</span>
            <span className="summary-value">${formatPrice(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="summary-row discount-row">
              <span className="summary-label">Discount ({discount}%)</span>
              <span className="summary-value discount-value">-${formatPrice(discountAmount)}</span>
            </div>
          )}
          
          <div className="summary-row">
            <span className="summary-label">Shipping</span>
            <span className="summary-value">
              {shipping === 0 ? 'FREE' : `$${formatPrice(shipping)}`}
              {subtotal < 100 && (
                <small className="shipping-note">
                  {` (Free shipping on orders over $100)`}
                </small>
              )}
            </span>
          </div>
          
          <div className="summary-row">
            <span className="summary-label">Tax (8%)</span>
            <span className="summary-value">${formatPrice(tax)}</span>
          </div>
          
          <div className="summary-row total-row">
            <span className="summary-label">Total</span>
            <span className="summary-value summary-total">${formatPrice(total)}</span>
          </div>
        </div>
        
        <div className="checkout-actions">
          <button className="checkout-button" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
          
          <Link to="/" className="continue-shopping">
            ← Continue Shopping
          </Link>
        </div>
        
        <div className="payment-methods">
          <p>We accept:</p>
          <div className="payment-icons">
            <span>💳</span>
            <span>🏦</span>
            <span>📱</span>
            <span>🔵</span>
            <span>🟡</span>
          </div>
        </div>
      </div>

      <div className="cart-summary-bar">
        <div className="summary-bar-left">
          <span>Total ({totalItems} items): </span>
          <strong>${formatPrice(total)}</strong>
        </div>
        <div className="summary-bar-right">
          <button className="summary-checkout-btn" onClick={handleCheckout}>
            Checkout Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItems;
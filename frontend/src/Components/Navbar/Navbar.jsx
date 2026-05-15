import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from '../Assets/logo.png';
import cart_icon from '../Assets/cart_icon.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [menu, setMenu] = useState("shop");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to update cart count
  const updateCartCount = () => {
    try {
      // Method 1: Check localStorage cart
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartObj = JSON.parse(cart);
        // Calculate total quantity from cart
        const total = Object.values(cartObj).reduce((sum, item) => {
          if (typeof item === 'object') {
            return sum + (item.quantity || 0);
          }
          return sum + (Number(item) || 0);
        }, 0);
        setCartCount(total);
        return;
      }
      
      // Method 2: Check ShopContext's cart in localStorage
      const shopCart = localStorage.getItem('cartItems');
      if (shopCart) {
        const cartData = JSON.parse(shopCart);
        const total = Object.values(cartData).reduce((sum, quantity) => {
          return sum + (Number(quantity) || 0);
        }, 0);
        setCartCount(total);
      }
    } catch (error) {
      console.error('Error calculating cart count:', error);
      setCartCount(0);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Initialize cart count
    updateCartCount();
  }, []);

  // Listen for cart updates (from localStorage changes)
  useEffect(() => {
    // Function to handle storage events
    const handleStorageChange = (e) => {
      if (e.key === 'cart' || e.key === 'cartItems') {
        updateCartCount();
      }
    };

    // Function to handle custom cart update events
    const handleCartUpdated = () => {
      updateCartCount();
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom cart update events (if implemented in ShopContext)
    window.addEventListener('cartUpdated', handleCartUpdated);
    
    // Check cart on route change
    updateCartCount();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [location]); // Add location dependency to update on route change

  // Set active menu based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setMenu("shop");
    else if (path === '/mens') setMenu("mens");
    else if (path === '/womens') setMenu("womens");
    else if (path === '/kids') setMenu("kids");
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setCartCount(0);
    navigate('/');
    window.location.reload();
  };

  return (
    <div className='navbar'>
      <div className='nav-logo'>
        <Link to='/'>
          <img src={logo} alt="logo" />
          <p>NEXCART</p>
        </Link>
      </div>
      <ul className='nav-menu'>
        <li className={menu === "shop" ? "active" : ""}>
          <Link to='/' onClick={() => setMenu("shop")}>Shop</Link>
          {menu === "shop" && <hr />}
        </li>
        <li className={menu === "mens" ? "active" : ""}>
          <Link to='/mens' onClick={() => setMenu("mens")}>Men</Link>
          {menu === "mens" && <hr />}
        </li>
        <li className={menu === "womens" ? "active" : ""}>
          <Link to='/womens' onClick={() => setMenu("womens")}>Women</Link>
          {menu === "womens" && <hr />}
        </li>
        <li className={menu === "kids" ? "active" : ""}>
          <Link to='/kids' onClick={() => setMenu("kids")}>Kids</Link>
          {menu === "kids" && <hr />}
        </li>
      </ul>
      <div className='nav-login-cart'>
        {isLoggedIn ? (
          <div className="user-dropdown">
            <div className="user-greeting">
              Hi, {user?.name?.split(' ')[0] || 'User'} 👋
            </div>
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">
                👤 My Profile
              </Link>
              <Link to="/orders" className="dropdown-item">
                📦 My Orders
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout">
                🚪 Logout
              </button>
            </div>
          </div>
        ) : (
          <Link to='/login'>
            <button>Login</button>
          </Link>
        )}
        <Link to='/cart' className="cart-link">
          <img src={cart_icon} alt="cart" />
          {cartCount > 0 && (
            <div className="cart-count">{cartCount}</div>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
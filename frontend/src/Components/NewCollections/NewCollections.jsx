// NewCollections.js - UPDATED VERSION with backend connection
import React, { useState, useEffect } from "react";
import "./NewCollections.css";
import Item from "../Item/Item";

const NewCollection = () => {
  const [newCollections, setNewCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/products');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.products) {
          // Get latest 8 products (newest first)
          const latestProducts = data.products
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);
          
          setNewCollections(latestProducts);
        } else {
          throw new Error(data.message || 'Invalid response from server');
        }
      } catch (err) {
        console.error('Error fetching new collections:', err);
        setError('Failed to load new collections');
      } finally {
        setLoading(false);
      }
    };

    fetchNewCollections();
  }, []);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const resolveImage = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('/')) return `${API}${img}`;
    if (img.includes('/images/')) return img.includes('http') ? img : `${API}${img.startsWith('/') ? '' : '/'}${img}`;
    return `${API}/images/${img}`;
  };

  if (loading) {
    return (
      <div className="new-collections">
        <h1>NEW COLLECTIONS</h1>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="new-collections">
        <h1>NEW COLLECTIONS</h1>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-collections">
      <h1>NEW COLLECTIONS</h1>
      <div className="collections">
        {newCollections.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={resolveImage(item.image)}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default NewCollection;
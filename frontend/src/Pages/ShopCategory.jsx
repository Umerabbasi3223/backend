import React, { useState, useEffect } from 'react';
import './CSS/ShopCategory.css';
import Item from '../Components/Item/Item';
import dropdown_icon from '../Components/Assets/dropdown_icon.png';

const ShopCategory = (props) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching products from backend...');
        
        const response = await fetch('http://localhost:4000/products');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Backend response:', data);
        
        if (data.success) {
          const allProducts = data.products || [];
          console.log(`📦 Loaded ${allProducts.length} products from backend`);
          
          // Filter out any invalid products
          const validProducts = allProducts.filter(product => 
            product && typeof product === 'object' && product.id
          );
          
          console.log(`✅ Valid products: ${validProducts.length}`);
          setProducts(validProducts);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('❌ Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category when products or props.category changes
  useEffect(() => {
    if (products.length > 0 && props.category) {
      console.log(`🔍 Filtering products for category: ${props.category}`);
      
      const filtered = products.filter(item => {
        if (!item) return false;
        
        const categoryLower = props.category.toLowerCase();
        
        // Check for 'kid' vs 'kids' mapping
        let targetCategory = categoryLower;
        if (categoryLower === 'kids') {
          targetCategory = 'kid';
        }
        
        // DEBUG: Log each product's category data
        console.log(`Product ${item.id}:`, {
          name: item.name,
          oldCategory: item.category,
          newCategories: item.categories,
          isNewCollection: item.isNewCollection
        });
        
        // First check the new 'categories' array (array field)
        if (item.categories && Array.isArray(item.categories)) {
          const hasCategory = item.categories.some(cat => {
            if (!cat) return false;
            const catLower = cat.toLowerCase();
            const normalizedCat = catLower === 'kids' ? 'kid' : catLower;
            return normalizedCat === targetCategory;
          });
          
          if (hasCategory) {
            console.log(`✅ Product ${item.id} found in categories array`);
            return true;
          }
        }
        
        // Fallback: check old 'category' field (string field)
        if (item.category) {
          const itemCategory = item.category.toLowerCase();
          const normalizedItemCategory = itemCategory === 'kids' ? 'kid' : itemCategory;
          const matches = normalizedItemCategory === targetCategory;
          
          if (matches) {
            console.log(`✅ Product ${item.id} found in old category field`);
            return true;
          }
        }
        
        // Fallback: check if category is in name (for emergency)
        if (item.name && item.name.toLowerCase().includes(targetCategory)) {
          console.log(`⚠️ Product ${item.id} found by name fallback`);
          return true;
        }
        
        return false;
      });
      
      console.log(`✅ Found ${filtered.length} products in ${props.category} category`);
      
      // Show details of filtered products
      if (filtered.length > 0) {
        console.log(`📊 Filtered products for ${props.category}:`, filtered.map(p => ({
          id: p.id,
          name: p.name,
          categories: p.categories,
          category: p.category
        })));
      }
      
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [products, props.category]);

  // Show loading state
  if (loading) {
    return (
      <div className="shop-category loading">
        <div className="loading-spinner"></div>
        <p>Loading {props.category} products...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="shop-category error">
        <h3>⚠️ Error Loading Products</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="retry-btn"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="shop-category">
      {/* Category Banner */}
      <img 
        className="shopcategory-banner" 
        src={props.banner} 
        alt={`${props.category} collection`} 
      />
      
      {/* Category Header */}
      <div className="shopcategory-header">
        <h1>{props.category.charAt(0).toUpperCase() + props.category.slice(1)} Collection</h1>
        <p>Discover our amazing {props.category} collection</p>
      </div>
      
      {/* Sort and Results Info */}
      <div className="shopcategory-indexSort">
        <p>
          <span>Showing 1-{filteredProducts.length}</span> out of {filteredProducts.length} products
        </p>
        <div className="shopcategory-sort">
          Sort by <img src={dropdown_icon} alt="dropdown icon"/>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="shopcategory-products">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => {
            // Make sure item is valid before passing to Item component
            if (!item || !item.id) {
              console.warn('⚠️ Invalid item found:', item);
              return null;
            }
            
            return (
              <Item
                key={item.id}
                id={item.id}
                name={item.name || 'Unnamed Product'}
                image={item.image}
                new_price={item.new_price}
                old_price={item.old_price}
                category={item.category || (item.categories && item.categories[0]) || props.category}
              />
            );
          })
        ) : (
          <div className="no-products">
            <h3>No products found in {props.category} category</h3>
            <p>We couldn't find any products in this category.</p>
            
            {/* Debug Info */}
            <div className="debug-section">
              <h4>Debug Information:</h4>
              <p>Total products in database: {products.length}</p>
              <p>Looking for category: {props.category}</p>
              
              {/* Show sample of what categories exist */}
              <div className="existing-categories">
                <p>Existing categories in products:</p>
                <ul>
                  {Array.from(new Set(
                    products.flatMap(p => 
                      p.categories || (p.category ? [p.category] : [])
                    )
                  )).slice(0, 10).map((cat, i) => (
                    <li key={i}>{cat}</li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={() => {
                  console.log('📊 All products:', products);
                  console.log('🔍 Looking for category:', props.category);
                }}
                className="debug-btn"
              >
                Show Console Logs
              </button>
            </div>
            
            <div className="suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Check if products are properly categorized</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for detailed logs</li>
                <li>Make sure backend is running on port 4000</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug Info */}
      <div className="debug-info">
        <details>
          <summary>Debug Information</summary>
          <p><strong>Backend:</strong> http://localhost:4000/products</p>
          <p><strong>Category:</strong> {props.category}</p>
          <p><strong>Total Products:</strong> {products.length}</p>
          <p><strong>Filtered Products:</strong> {filteredProducts.length}</p>
          <p><strong>Sample Product Check:</strong></p>
          {products.slice(0, 3).map((p, i) => (
            <div key={i} className="product-sample">
              <p>ID: {p.id} | Name: {p.name}</p>
              <p>Categories: {JSON.stringify(p.categories)}</p>
              <p>Category (old): {p.category}</p>
            </div>
          ))}
        </details>
      </div>
    </div>
  );
}

export default ShopCategory;
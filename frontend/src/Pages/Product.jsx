import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductDisplay from '../Components/ProductDisplay/ProductDisplay';

const Product = () => {
    const { productId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Check if product data was passed via state
            if (location.state?.product) {
                console.log('Product from state:', location.state.product);
                setProduct(location.state.product);
                setLoading(false);
                return;
            }
            
            // If no state, fetch from API using productId
            if (!productId) {
                throw new Error('Product ID is missing');
            }
            
            console.log('Fetching product with ID:', productId);
            
            // Try to fetch product from API
            const response = await fetch(`http://localhost:4000/products/${productId}`);
            
            if (!response.ok) {
                // If API endpoint doesn't exist, try to get from all products
                const allProductsResponse = await fetch('http://localhost:4000/products');
                const allProductsData = await allProductsResponse.json();
                
                if (allProductsData.success) {
                    // Find product by ID
                    const foundProduct = allProductsData.products.find(
                        p => p.id === parseInt(productId) || p._id === productId
                    );
                    
                    if (foundProduct) {
                        setProduct(foundProduct);
                    } else {
                        throw new Error('Product not found');
                    }
                } else {
                    throw new Error('Failed to fetch products');
                }
            } else {
                const data = await response.json();
                setProduct(data);
            }
            
        } catch (err) {
            console.error('Error fetching product:', err.message);
            setError(err.message || 'Failed to load product');
            
            // Try alternative API endpoint
            try {
                const altResponse = await fetch(`http://localhost:4000/api/products/${productId}`);
                if (altResponse.ok) {
                    const altData = await altResponse.json();
                    setProduct(altData.product || altData);
                }
            } catch (altErr) {
                console.error('Alternative fetch failed:', altErr.message);
            }
        } finally {
            setLoading(false);
        }
    }, [productId, location.state?.product]);
    
    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);
    
    const handleGoBack = () => {
        navigate(-1); // Go back to previous page
    };
    
    if (loading) {
        return (
            <div className="product-page loading">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }
    
    if (error || !product) {
        return (
            <div className="product-page error">
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <h2>Product Not Found</h2>
                    <p>{error || 'The product you are looking for does not exist.'}</p>
                    <div className="error-actions">
                        <button onClick={handleGoBack} className="back-btn">
                            ← Go Back
                        </button>
                        <button onClick={() => navigate('/')} className="home-btn">
                            🏠 Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="product-page">
            <ProductDisplay product={product} />
        </div>
    );
};

export default Product;
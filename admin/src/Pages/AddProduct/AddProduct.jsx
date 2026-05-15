import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../adminasset/upload_area.png';
import Sidebar from '../../Components/Sidebar/Sidebar';

const AddProduct = () => {
    const [images, setImages] = useState([null, null, null, null]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [productDetails, setProductDetails] = useState({
        name: "",
        category: "men",
        old_price: "",
        new_price: "",
        description: "",
        stock: "0"
    });

    // Check if user is logged in AS ADMIN
    const isLoggedIn = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        return token && user && user.role === 'admin';
    };

    // Image handler for each image slot
    const imageHandler = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ 
                    type: 'error', 
                    text: `Image ${index + 1} exceeds 5MB limit` 
                });
                e.target.value = '';
                return;
            }
            
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setMessage({ 
                    type: 'error', 
                    text: `Image ${index + 1}: Only JPEG, PNG, GIF, or WebP allowed` 
                });
                e.target.value = '';
                return;
            }
            
            const newImages = [...images];
            newImages[index] = file;
            setImages(newImages);
            setMessage({ type: '', text: '' });
        }
    };

    // Remove image from slot
    const removeImage = (index) => {
        const newImages = [...images];
        newImages[index] = null;
        setImages(newImages);
    };

    // Input change handler
    const changeHandler = (e) => {
        const { name, value } = e.target;
        setProductDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Validate form
    const validateForm = () => {
        if (!productDetails.name.trim()) {
            setMessage({ type: 'error', text: 'Product title is required' });
            return false;
        }
        
        if (!productDetails.old_price || parseFloat(productDetails.old_price) <= 0) {
            setMessage({ type: 'error', text: 'Valid original price is required' });
            return false;
        }
        
        if (!productDetails.new_price) {
            setMessage({ type: 'error', text: 'Offer price is required' });
            return false;
        }
        
        // Main image (first one) is required
        if (!images[0]) {
            setMessage({ type: 'error', text: 'Main product image is required' });
            return false;
        }
        
        return true;
    };

    // Upload single image
    const uploadImage = async (imageFile) => {
        const formData = new FormData();
        formData.append('product', imageFile);
        
        const response = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.image_url;
    };

    // Add product function
    const Add_Product = async () => {
        setMessage({ type: '', text: '' });
        
        if (!isLoggedIn()) {
            setMessage({ 
                type: 'error', 
                text: 'Please login as admin first' 
            });
            return;
        }
        
        if (!validateForm()) {
            return;
        }
        
        setUploading(true);
        
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !user || user.role !== 'admin') {
                throw new Error('Admin access required. Please login as admin.');
            }
            
            // Upload images
            let uploadedImageUrls = ['', '', '', ''];
            
            for (let i = 0; i < images.length; i++) {
                if (images[i]) {
                    try {
                        const url = await uploadImage(images[i]);
                        uploadedImageUrls[i] = url;
                    } catch (error) {
                        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
                    }
                }
            }
            
            // Prepare product data for backend
            const productData = {
                name: productDetails.name,
                image: uploadedImageUrls[0], // Main image
            
                category: productDetails.category,
                old_price: parseFloat(productDetails.old_price),
                new_price: parseFloat(productDetails.new_price),
                description: productDetails.description || '',
                stock: parseInt(productDetails.stock) || 0
            };
            
            // Send to backend
            const productResponse = await fetch('http://localhost:4000/addproduct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData),
            });
            
            if (!productResponse.ok) {
                if (productResponse.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(`Add product failed with status ${productResponse.status}`);
            }
            
            const productResult = await productResponse.json();
            
            if (productResult.success) {
                setMessage({ 
                    type: 'success', 
                    text: `Product added successfully with ${images.filter(img => img !== null).length} image(s)!` 
                });
                
                // Reset form
                setProductDetails({
                    name: "",
                    category: "men",
                    old_price: "",
                    new_price: "",
                    description: "",
                    stock: "0"
                });
                setImages([null, null, null, null]);
                
                // Reset file inputs
                for (let i = 0; i < 4; i++) {
                    const input = document.getElementById(`file-input-${i}`);
                    if (input) input.value = '';
                }
                
                setTimeout(() => {
                    setMessage({ type: '', text: '' });
                }, 5000);
            } else {
                throw new Error(productResult.message || 'Failed to add product');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            setMessage({ 
                type: 'error', 
                text: error.message || 'Something went wrong. Please try again.' 
            });
            
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
            
        } finally {
            setUploading(false);
        }
    };

    // Get image source for display
    const getImageSrc = (index) => {
        if (images[index]) {
            return URL.createObjectURL(images[index]);
        }
        return upload_area;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="add-product">
            <Sidebar />
            <div className="main-content">
                <div className="content-wrapper">
                    {/* Page Header */}
                    <div className="page-header">
                        <h1>Add New Product</h1>
                        <p className="subtitle">
                            Complete all required fields to add a new product to your store.
                        </p>
                    </div>

                    {/* Auth Warning */}
                    {!isLoggedIn() && (
                        <div className="auth-warning fade-in">
                            <div>
                                <strong>Admin access required</strong>
                                <p>Please log in as an administrator to add new products.</p>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {message.text && (
                        <div className={`message ${message.type} fade-in`}>
                            <span className="message-icon">
                                {message.type === 'success' ? '✅' : '❌'}
                            </span>
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Product Information Section */}
                    <div className="form-section fade-in">
                        <div className="form-section-header">
                            <h2 className="form-section-title">
                                <span>📋 Product Information</span>
                            </h2>
                            <span className="section-badge required">Required</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="product-name" className="required">Product Title</label>
                            <input
                                id="product-name"
                                type="text"
                                className="form-control"
                                name="name"
                                value={productDetails.name}
                                onChange={changeHandler}
                                placeholder="e.g., Premium Cotton T-Shirt"
                                disabled={uploading || !isLoggedIn()}
                                required
                            />
                        </div>

                        <div className="price-grid">
                            <div className="form-group">
                                <label htmlFor="old-price" className="required">Original Price (Rs)</label>
                                <input
                                    id="old-price"
                                    type="number"
                                    className="form-control"
                                    name="old_price"
                                    value={productDetails.old_price}
                                    onChange={changeHandler}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    disabled={uploading || !isLoggedIn()}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="new-price" className="required">Offer Price (Rs)</label>
                                <input
                                    id="new-price"
                                    type="number"
                                    className="form-control"
                                    name="new_price"
                                    value={productDetails.new_price}
                                    onChange={changeHandler}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    disabled={uploading || !isLoggedIn()}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="stock-quantity" className="required">Stock Quantity</label>
                            <input
                                id="stock-quantity"
                                type="number"
                                className="form-control"
                                name="stock"
                                value={productDetails.stock}
                                onChange={changeHandler}
                                placeholder="0"
                                min="0"
                                disabled={uploading || !isLoggedIn()}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="product-category" className="required">Category</label>
                            <div className="select-wrapper">
                                <select
                                    id="product-category"
                                    className="form-control"
                                    name="category"
                                    value={productDetails.category}
                                    onChange={changeHandler}
                                    disabled={uploading || !isLoggedIn()}
                                    required
                                >
                                    <option value="men">👕 Men</option>
                                    <option value="women">👚 Women</option>
                                    <option value="kids">👶 Kid</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="product-description">Description</label>
                            <textarea
                                id="product-description"
                                className="form-control"
                                name="description"
                                value={productDetails.description}
                                onChange={changeHandler}
                                placeholder="Describe your product features, materials, and benefits..."
                                rows="4"
                                disabled={uploading || !isLoggedIn()}
                            />
                        </div>
                    </div>

                    {/* Product Images Section */}
                    <div className="form-section fade-in">
                        <div className="form-section-header">
                            <h2 className="form-section-title">
                                <span>🖼️ Product Images</span>
                            </h2>
                            <span className="section-badge required">Required</span>
                        </div>

                        <div className="image-upload-section">
                            <p className="image-note">
                                <strong>Note:</strong> First image is required and will be used as the main display image. 
                                You can upload up to 4 images total.
                            </p>

                            <div className="image-grid">
                                {[0, 1, 2, 3].map((index) => (
                                    <div 
                                        key={index} 
                                        className={`image-card ${index === 0 ? 'main-image' : ''}`}
                                    >
                                        {images[index] ? (
                                            <>
                                                <div className="image-preview-container">
                                                    <img
                                                        src={getImageSrc(index)}
                                                        alt={`Preview ${index + 1}`}
                                                        className="image-preview"
                                                    />
                                                    <div className="image-overlay">
                                                        <div className="image-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-danger btn-sm"
                                                                onClick={() => removeImage(index)}
                                                                disabled={uploading}
                                                            >
                                                                ✕ Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="image-info">
                                                    <div className="image-title">
                                                        {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                                                    </div>
                                                    <div className="image-meta">
                                                        <span className="file-name">{images[index].name}</span>
                                                        <span className="file-size">
                                                            Size: {formatFileSize(images[index].size)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="image-card-label" htmlFor={`file-input-${index}`}>
                                                <div className="upload-icon-container">
                                                    {index === 0 ? '📷' : '➕'}
                                                </div>
                                                <div className="upload-label-text">
                                                    {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                                                </div>
                                                <div className="upload-label-subtext">
                                                    {index === 0 ? 'Required' : 'Optional'}
                                                </div>
                                            </label>
                                        )}
                                        
                                        <input
                                            type="file"
                                            id={`file-input-${index}`}
                                            className="file-input"
                                            onChange={(e) => imageHandler(index, e)}
                                            accept="image/*"
                                            disabled={uploading || !isLoggedIn()}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons fade-in">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                                // Reset form
                                setProductDetails({
                                    name: "",
                                    category: "men",
                                    old_price: "",
                                    new_price: "",
                                    description: "",
                                    stock: "0"
                                });
                                setImages([null, null, null, null]);
                                setMessage({ type: '', text: '' });
                            }}
                            disabled={uploading}
                        >
                            Clear Form
                        </button>
                        
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={Add_Product}
                            disabled={uploading || !isLoggedIn()}
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner"></span>
                                    Adding Product...
                                </>
                            ) : (
                                'Add Product'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
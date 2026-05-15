import React, { useState, useContext, useEffect } from 'react'
import './ProductDisplay.css'
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = (props) => {
    const { product } = props || {};
    const [selectedSize, setSelectedSize] = useState('Medium');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [mainImage, setMainImage] = useState('');
    const [thumbnailImages, setThumbnailImages] = useState([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useContext(ShopContext);

    useEffect(() => {
        if (product) {
            loadProductImages(product);
        }
    }, [product]);

    // Load and organize product images
    const loadProductImages = (product) => {
        setLoadingImages(true);
        
        try {
            const allImages = [];
            
            // Collect all valid images from the product
            const imageFields = ['image', 'image_2', 'image_3', 'image_4'];
            
            imageFields.forEach(field => {
                const img = product[field];
                if (img && typeof img === 'string' && img.trim() !== '') {
                    let imageUrl = img.trim();
                    // Convert relative URLs to absolute
                    if (imageUrl.startsWith('/')) {
                        imageUrl = `http://localhost:4000${imageUrl}`;
                    }
                    allImages.push(imageUrl);
                }
            });
            
            // If no images found in individual fields, check images array
            if (allImages.length === 0 && product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (img && typeof img === 'string' && img.trim() !== '') {
                        let imageUrl = img.trim();
                        if (imageUrl.startsWith('/')) {
                            imageUrl = `http://localhost:4000${imageUrl}`;
                        }
                        allImages.push(imageUrl);
                    }
                });
            }
            
            // Set main image (first one)
            if (allImages.length > 0) {
                setMainImage(allImages[0]);
                
                // Set thumbnails (remaining images)
                if (allImages.length > 1) {
                    setThumbnailImages(allImages.slice(1)); // All images except first one
                } else {
                    setThumbnailImages([]);
                }
            } else {
                // No images found - use placeholders
                setMainImage('https://via.placeholder.com/600x750/e5e7eb/6b7280?text=Main+Product+Image');
                setThumbnailImages([
                    'https://via.placeholder.com/100x100/e5e7eb/6b7280?text=Image+1',
                    'https://via.placeholder.com/100x100/e5e7eb/6b7280?text=Image+2',
                    'https://via.placeholder.com/100x100/e5e7eb/6b7280?text=Image+3'
                ]);
            }
            
            console.log('Loaded images:', {
                mainImage: allImages[0],
                thumbnails: allImages.slice(1),
                totalImages: allImages.length
            });
            
        } catch (error) {
            console.error('Error loading images:', error);
            setMainImage('https://via.placeholder.com/600x750/e5e7eb/6b7280?text=Error+Loading+Image');
            setThumbnailImages([]);
        } finally {
            setLoadingImages(false);
        }
    };

    // Handle thumbnail click - change main image
    const handleThumbnailClick = (imageUrl) => {
        console.log('Changing main image to:', imageUrl);
        setMainImage(imageUrl);
    };

    // Handle main image click - cycle through images
    const handleMainImageClick = () => {
        if (thumbnailImages.length > 0) {
            const allImages = [mainImage, ...thumbnailImages];
            const currentIndex = allImages.indexOf(mainImage);
            const nextIndex = (currentIndex + 1) % allImages.length;
            setMainImage(allImages[nextIndex]);
        }
    };

    if (!product) {
        return (
            <div className='product-display loading'>
                <div className="loading-spinner"></div>
                <p>Loading product details...</p>
            </div>
        );
    }

    // Format PKR price
    const formatPricePKR = (price) => {
        if (!price) return 'Rs 0';
        const priceNum = parseFloat(price);
        return 'Rs ' + priceNum.toLocaleString('en-PK');
    };

    // Calculate discount percentage
    const discount = product.old_price && product.new_price && product.old_price > product.new_price
        ? Math.round(((product.old_price - product.new_price) / product.old_price) * 100)
        : 0;

    // Get category
    const getProductCategory = () => {
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
            return product.categories[0];
        }
        return product.category || 'General';
    };

    const productCategory = getProductCategory();

    // Handle add to cart
    const handleAddToCart = async () => {
        if (!product || !addToCart) {
            alert('Cannot add to cart. Please try again.');
            return;
        }
        
        if (!isProductAvailable()) {
            alert('This product is currently out of stock.');
            return;
        }
        
        setAddingToCart(true);
        
        try {
           addToCart(product.id ?? product._id, {
                id: product.id,
                name: product.name,
                new_price: product.new_price,
                price: product.new_price,
                image: mainImage,
                size: selectedSize,
                quantity: quantity,
                category: productCategory
            });
            
            alert(`✅ Added ${quantity} ${product.name} (${selectedSize}) to cart!`);
            navigate('/cart');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    // Handle Buy Now
    const handleBuyNow = async () => {
        if (!product || !addToCart) {
            alert('Cannot proceed to checkout. Please try again.');
            return;
        }
        
        if (!isProductAvailable()) {
            alert('This product is currently out of stock.');
            return;
        }
        
        setAddingToCart(true);
        
        try {
            addToCart(product.id ?? product._id, {
                id: product.id,
                name: product.name,
                new_price: product.new_price,
                price: product.new_price,
                image: mainImage,
                size: selectedSize,
                quantity: quantity,
                category: productCategory
            });
            
            navigate('/checkout');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to proceed to checkout. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    // Check product availability
    const isProductAvailable = () => {
        if (product.stock !== undefined && product.stock !== null) {
            return product.stock > 0;
        }
        return product.available !== false;
    };

    // Get stock status
    const getStockStatus = () => {
        if (product.stock !== undefined && product.stock !== null) {
            return product.stock > 0 ? `${product.stock} items in stock` : 'Out of stock';
        }
        return isProductAvailable() ? 'In Stock' : 'Out of Stock';
    };

    // Size options
    const sizeOptions = ['Small', 'Medium', 'Large', 'XL', 'XXL'];

    // Handle image error
    const handleImageError = (e, imageType) => {
        console.error(`Failed to load ${imageType} image:`, e.target.src);
        if (imageType === 'main') {
            e.target.src = 'https://via.placeholder.com/600x750/e5e7eb/6b7280?text=Main+Image+Not+Found';
        } else {
            e.target.src = 'https://via.placeholder.com/100x100/e5e7eb/6b7280?text=Image+Error';
        }
        e.target.onerror = null;
    };

    return (
        <div className='product-display'>
            <div className="product-display-left">
                {/* Product Images Gallery - Main + Thumbnails */}
                <div className="product-img-gallery">
                    {/* Main Large Image */}
                    <div className="main-image-container">
                        <div className="main-image-wrapper">
                            <img 
                                className='main-product-image' 
                                src={mainImage} 
                                alt={product.name}
                                onClick={handleMainImageClick}
                                onError={(e) => handleImageError(e, 'main')}
                                loading="eager"
                            />
                            
                            {/* Discount Badge */}
                            {discount > 0 && (
                                <div className="discount-badge">
                                    <span className="discount-icon">%</span>
                                    <span className="discount-text">{discount} OFF</span>
                                </div>
                            )}
                            
                            {/* Image Counter */}
                            {thumbnailImages.length > 0 && (
                                <div className="image-counter">
                                    <span className="counter-icon">📷</span>
                                    <span className="counter-text">
                                        Click image to view next
                                    </span>
                                </div>
                            )}
                            
                            {/* Loading Overlay */}
                            {loadingImages && (
                                <div className="image-loading-overlay">
                                    <div className="loading-spinner-small"></div>
                                    <span>Loading images...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Images - Only show if we have thumbnails */}
                    {thumbnailImages.length > 0 && (
                        <div className="thumbnail-section">
                            <div className="thumbnail-header">
                                <span className="thumbnail-icon">🖼️</span>
                                <h4 className="thumbnail-title">More Views</h4>
                            </div>
                            
                            <div className="thumbnail-images-grid">
                                {thumbnailImages.map((img, index) => (
                                    <div 
                                        key={index}
                                        className="thumbnail-item"
                                        onClick={() => handleThumbnailClick(img)}
                                        title={`Click to view image ${index + 2}`}
                                    >
                                        <div className="thumbnail-wrapper">
                                            <img 
                                                src={img} 
                                                alt={`${product.name} view ${index + 2}`}
                                                onError={(e) => handleImageError(e, 'thumbnail')}
                                                loading="lazy"
                                                className={mainImage === img ? 'active-thumbnail' : ''}
                                            />
                                            <div className="thumbnail-overlay">
                                                <span className="view-icon">👁️</span>
                                            </div>
                                            <div className="thumbnail-number">{index + 2}</div>
                                        </div>
                                        <div className="thumbnail-label">View {index + 2}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="thumbnail-instruction">
                                <span className="instruction-icon">💡</span>
                                <span className="instruction-text">
                                    Click any small image to view it in the main display
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="product-display-right">
                {/* Product Info Section */}
                <div className="product-info-section">
                    {/* Discount Banner */}
                    {discount > 0 && (
                        <div className="discount-banner fade-in">
                            <span className="banner-icon">🎉</span>
                            <span className="banner-text">{discount}% OFF SALE</span>
                        </div>
                    )}

                    {/* Product Name */}
                    <h1 className="product-name fade-in">{product.name}</h1>
                    
                    {/* Product Category */}
                    <div className="product-category slide-in">
                        <span className="category-icon">🏷️</span>
                        <span className="category-text">
                            {productCategory.charAt(0).toUpperCase() + productCategory.slice(1)}
                        </span>
                    </div>

                    {/* Star Ratings */}
                    <div className="productdisplay-right-star slide-in">
                        {[...Array(4)].map((_, i) => (
                            <img key={`star-${i}`} src={star_icon} alt="star" />
                        ))}
                        <img src={star_dull_icon} alt="half star" />
                        <p>({product.reviews || 122} reviews)</p>
                    </div>

                    {/* Prices in PKR */}
                    <div className="productdisplay-right-prices fade-in">
                        <div className="price-section">
                            {product.old_price > product.new_price && (
                                <div className="productdisplay-right-old-price">
                                    <del>{formatPricePKR(product.old_price)}</del>
                                </div>
                            )}
                            <div className="productdisplay-right-new-price">
                                {formatPricePKR(product.new_price)}
                            </div>
                            {discount > 0 && (
                                <div className="discount-tag">
                                    <span className="tag-icon">💰</span>
                                    <span className="tag-text">Save {discount}%</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Stock Status */}
                        <div className={`stock-status ${isProductAvailable() ? 'in-stock' : 'out-of-stock'}`}>
                            <span className="status-icon">
                                {isProductAvailable() ? '✅' : '❌'}
                            </span>
                            <span className="status-text">
                                {getStockStatus()}
                                {product.stock > 0 && product.stock < 10 && (
                                    <span className="low-stock-warning"> (Low stock)</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="productdisplay-right-description slide-in">
                        <div className="description-header">
                            <span className="description-icon">📝</span>
                            <span className="description-title">Description</span>
                        </div>
                        <p className="description-text">
                            {product.description || `A premium ${productCategory} product crafted with attention to detail. Perfect for everyday use with comfort and style.`}
                        </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="quantity-selector fade-in">
                        <label>
                            <span className="quantity-icon">🔢</span>
                            <span className="quantity-label">Quantity:</span>
                        </label>
                        <div className="quantity-controls">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1 || !isProductAvailable()}
                                className="quantity-btn minus"
                                aria-label="Decrease quantity"
                            >
                                <span className="btn-icon">−</span>
                            </button>
                            <span className="quantity-value">{quantity}</span>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={!isProductAvailable()}
                                className="quantity-btn plus"
                                aria-label="Increase quantity"
                            >
                                <span className="btn-icon">+</span>
                            </button>
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="productdisplay-right-size slide-in">
                        <div className="size-header">
                            <span className="size-icon">📏</span>
                            <h3 className="size-title">Select Size</h3>
                        </div>
                        <div className="productdisplay-right-size-options">
                            {sizeOptions.map((size) => (
                                <div 
                                    key={size}
                                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                    title={`Select ${size} size`}
                                >
                                    <span className="size-text">{size}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="product-action-buttons fade-in">
                        <button 
                            onClick={handleAddToCart}
                            className={`productdisplay-right-addtocart-btn ${addingToCart ? 'loading' : ''}`}
                            disabled={!isProductAvailable() || addingToCart}
                        >
                            {addingToCart ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    <span className="btn-text">Adding...</span>
                                </>
                            ) : isProductAvailable() ? (
                                <>
                                    <span className="btn-icon">🛒</span>
                                    <span className="btn-text">Add to Cart</span>
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">⛔</span>
                                    <span className="btn-text">Out of Stock</span>
                                </>
                            )}
                        </button>

                        <button 
                            onClick={handleBuyNow}
                            className="productdisplay-right-buynow-btn"
                            disabled={!isProductAvailable() || addingToCart}
                        >
                            <span className="btn-icon">⚡</span>
                            <span className="btn-text">Buy Now</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDisplay;
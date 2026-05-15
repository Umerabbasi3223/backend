import React, { useState, useEffect } from 'react';
import './ListProduct.css';
import edit_icon from '../../adminasset/edit_icon.jpg';
import delete_icon from '../../adminasset/delete_icon.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../Components/Sidebar/Sidebar';

const ListProduct = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        category: 'men',
        old_price: '',
        new_price: '',
        available: true
    });
    const [saving, setSaving] = useState(false);

    // Check if user is admin
    const isAdmin = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        return token !== null && user && user.role === 'admin';
    };

    // Helper function to get display category from categories array
    const getDisplayCategory = (product) => {
        if (!product) return 'uncategorized';
        
        // Try to get from categories array first
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
            return product.categories[0];
        }
        
        // Fallback to category field (for backward compatibility)
        if (product.category) {
            return product.category;
        }
        
        return 'uncategorized';
    };

    // Helper function to get all unique categories from products
    const getAllCategories = () => {
        const allCategories = new Set(['all']);
        products.forEach(product => {
            const category = getDisplayCategory(product);
            if (category && category !== 'uncategorized') {
                allCategories.add(category);
            }
        });
        return Array.from(allCategories);
    };

    // Fetch products on component mount
    useEffect(() => {
        fetchAllProducts();
    }, []);

    // Close modal on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isEditing) {
                cancelEdit();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isEditing]);

    const fetchAllProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:4000/products');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
            } else {
                throw new Error(data.message || 'Failed to fetch products');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.message);
            toast.error(`Failed to load products: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Toggle product status
    const toggleProductStatus = async (product) => {
        if (!product || !product.id) return;
        
        // Check if admin
        if (!isAdmin()) {
            toast.error('Please login as admin first');
            return;
        }
        
        const newStatus = !product.available;
        
        try {
            // Get admin token
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !user || user.role !== 'admin') {
                toast.error('Admin access required');
                return;
            }
            
            console.log('Toggling status for product:', product.id, 'to:', newStatus);
            
            // Update locally first for instant feedback
            setProducts(products.map(p => 
                p.id === product.id ? { ...p, available: newStatus } : p
            ));
            
            const response = await fetch(`http://localhost:4000/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ available: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success(`Product marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`);
            } else {
                // Revert local change if server fails
                setProducts(products.map(p => 
                    p.id === product.id ? { ...p, available: product.available } : p
                ));
                if (response.status === 401 || response.status === 403) {
                    toast.error('Admin access required');
                } else {
                    toast.error(`Failed to update status: ${data.message}`);
                }
            }
        } catch (err) {
            console.error('Error updating status:', err);
            // Revert local change on error
            setProducts(products.map(p => 
                p.id === product.id ? { ...p, available: product.available } : p
            ));
            toast.error('Failed to update product status');
        }
    };

    // Status Component
    const StatusToggle = ({ product }) => (
        <div 
            className={`status-toggle ${product.available ? 'in-stock' : 'out-of-stock'}`}
            onClick={() => toggleProductStatus(product)}
            title={`Click to mark as ${product.available ? 'Out of Stock' : 'In Stock'}`}
        >
            <span className="status-dot"></span>
            {product.available ? 'In Stock' : 'Out of Stock'}
        </div>
    );

    // Delete product
    const removeProduct = async (product) => {
        // Check if admin
        if (!isAdmin()) {
            toast.error('Please login as admin first');
            return;
        }
        
        if (!product || !product.id) {
            toast.error('Invalid product data');
            return;
        }
        
        const productName = product.name || 'this product';
        
        if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            // Get admin token
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !user || user.role !== 'admin') {
                toast.error('Admin access required');
                return;
            }

            console.log('Deleting product ID:', product.id);
            
            const response = await fetch(`http://localhost:4000/deleteproduct/${product.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Delete response:', data);
            
            if (data.success) {
                toast.success(`"${productName}" deleted successfully!`);
                // Remove from local state
                setProducts(products.filter(p => p.id !== product.id));
            } else {
                if (response.status === 400) {
                    toast.error(`Invalid product ID: ${product.id}`);
                } else if (response.status === 401 || response.status === 403) {
                    toast.error('Admin access required');
                } else if (response.status === 404) {
                    toast.error(`Product not found: ${product.id}`);
                    // Remove from local state if not found on server
                    setProducts(products.filter(p => p.id !== product.id));
                } else {
                    toast.error(`Failed to delete: ${data.message || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            toast.error('Failed to delete product. Please try again.');
        }
    };

    // Start editing
    const startEditProduct = (product) => {
        // Check if user is admin
        if (!isAdmin()) {
            toast.error('Please login as admin to edit products');
            return;
        }
        
        if (!product || !product.id) {
            toast.error('Invalid product data');
            return;
        }
        
        setEditingProduct(product);
        setIsEditing(true);
        
        // Get the category from categories array or fallback
        const productCategory = getDisplayCategory(product);
        
        setEditForm({
            name: product.name || '',
            category: productCategory || 'men',
            old_price: product.old_price?.toString() || '',
            new_price: product.new_price?.toString() || '',
            available: product.available || true
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        setIsEditing(false);
        setEditingProduct(null);
        setEditForm({
            name: '',
            category: 'men',
            old_price: '',
            new_price: '',
            available: true
        });
    };

    // Handle edit form changes
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Update product
    const updateProduct = async () => {
        if (!editingProduct || !editingProduct.id) {
            toast.error('No product selected for editing');
            return;
        }

        // Check if admin
        if (!isAdmin()) {
            toast.error('Please login as admin first');
            return;
        }

        // Validate form
        if (!editForm.name?.trim()) {
            toast.error('Product name is required');
            return;
        }
        
        if (!editForm.old_price || parseFloat(editForm.old_price) <= 0) {
            toast.error('Valid original price is required');
            return;
        }
        
        if (!editForm.new_price || parseFloat(editForm.new_price) <= 0) {
            toast.error('Valid offer price is required');
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!token || !user || user.role !== 'admin') {
                toast.error('Admin access required');
                return;
            }

            const productData = {
                name: editForm.name.trim(),
                category: editForm.category, // Send as single category string
                old_price: parseFloat(editForm.old_price),
                new_price: parseFloat(editForm.new_price),
                available: editForm.available
            };

            console.log('Updating product:', editingProduct.id, 'with data:', productData);

            const response = await fetch(`http://localhost:4000/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Update local state - preserve categories array from server response
                const updatedProduct = data.product || {
                    ...editingProduct,
                    ...productData
                };
                
                setProducts(products.map(p => 
                    p.id === editingProduct.id ? updatedProduct : p
                ));
                toast.success('Product updated successfully!');
                cancelEdit();
            } else {
                if (response.status === 401 || response.status === 403) {
                    toast.error('Admin access required');
                } else if (response.status === 404) {
                    toast.error('Product not found on server');
                } else {
                    toast.error(`Failed to update: ${data.message || 'Unknown error'}`);
                }
                if (data.errors) {
                    data.errors.forEach(err => toast.error(err));
                }
            }
            
        } catch (err) {
            console.error('Error updating product:', err);
            toast.error('Failed to update product. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const productCategory = getDisplayCategory(product);
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             productCategory.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || productCategory === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Calculate discount percentage
    const calculateDiscount = (oldPrice, newPrice) => {
        if (!oldPrice || !newPrice || oldPrice <= 0) return 0;
        return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    };

    // Format price
    const formatPrice = (price) => {
        if (!price || isNaN(price)) return '$0.00';
        return `$${parseFloat(price).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="list-product loading">
                <div className="spinner"></div>
                <p>Loading products...</p>
            </div>
        );
    }

    return (
        <div className="list-product">
            <Sidebar/>
            <ToastContainer 
                position="top-right" 
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            
            {/* Header */}
            <div className="list-product-header">
                <h1>Product List</h1>
                <p>Manage your products inventory</p>
            </div>

            {/* Admin Access Warning */}
            {!isAdmin() && (
                <div className="admin-warning">
                    ⚠️ You are not logged in as admin. Some actions may be restricted.
                </div>
            )}

            {/* Stats */}
            <div className="product-stats">
                <div className="stat-card">
                    <h3>{products.length}</h3>
                    <p>Total Products</p>
                </div>
                <div className="stat-card">
                    <h3>{filteredProducts.length}</h3>
                    <p>Filtered Products</p>
                </div>
                <div className="stat-card">
                    <h3>{getAllCategories().length - 1}</h3>
                    <p>Categories</p>
                </div>
                <div className="stat-card">
                    <h3>{products.filter(p => p.available).length}</h3>
                    <p>In Stock</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="list-product-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search products by name or category..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    <span className="search-icon">🔍</span>
                </div>

                <div className="filter-controls">
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="category-filter"
                    >
                        {getAllCategories().map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>

                    <button 
                        className="refresh-btn"
                        onClick={fetchAllProducts}
                        title="Refresh products"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && editingProduct && (
                <div 
                    className="edit-modal-overlay"
                    onClick={(e) => {
                        if (e.target.classList.contains('edit-modal-overlay')) {
                            cancelEdit();
                        }
                    }}
                >
                    <div className="edit-modal">
                        <div className="edit-modal-header">
                            <h3>Edit Product #{editingProduct.id}</h3>
                            <button 
                                onClick={cancelEdit}
                                className="close-modal-btn"
                                disabled={saving}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="edit-form">
                            <div className="form-group">
                                <label>Product Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    placeholder="Enter product name"
                                    required
                                    disabled={saving}
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    name="category"
                                    value={editForm.category}
                                    onChange={handleEditChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="men">Men</option>
                                    <option value="women">Women</option>
                                    <option value="kid">Kid</option>
                                    <option value="new collection">New Collection</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Original Price (Rs) *</label>
                                <input
                                    type="number"
                                    name="old_price"
                                    value={editForm.old_price}
                                    onChange={handleEditChange}
                                    placeholder="Enter original price"
                                    min="0"
                                    step="0.01"
                                    required
                                    disabled={saving}
                                />
                            </div>
                            <div className="form-group">
                                <label>Offer Price (Rs) *</label>
                                <input
                                    type="number"
                                    name="new_price"
                                    value={editForm.new_price}
                                    onChange={handleEditChange}
                                    placeholder="Enter offer price"
                                    min="0"
                                    step="0.01"
                                    required
                                    disabled={saving}
                                />
                            </div>
                            <div className="form-group">
                                <label>Stock Status</label>
                                <div className="status-toggle-edit">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            name="available"
                                            checked={editForm.available}
                                            onChange={handleEditChange}
                                            disabled={saving}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">
                                            {editForm.available ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="edit-modal-actions">
                                <button 
                                    className="cancel-btn" 
                                    onClick={cancelEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="save-btn" 
                                    onClick={updateProduct}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner small"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            {error ? (
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchAllProducts}>Retry</button>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="no-products">
                    <p>No products found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}>Clear Search</button>
                    )}
                </div>
            ) : (
                <>
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Prices</th>
                                    <th>Discount</th>
                                    <th>Status</th>
                                    <th>Date Added</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentProducts.map((product) => {
                                    const displayCategory = getDisplayCategory(product);
                                    return (
                                        <tr key={product.id}>
                                            <td className="product-id">#{product.id}</td>
                                            <td className="product-info">
                                                <div className="product-image">
                                                    <img 
                                                        src={product.image} 
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/50';
                                                        }}
                                                    />
                                                </div>
                                                <div className="product-details">
                                                    <h4>{product.name || 'Unnamed Product'}</h4>
                                                    <p className="product-sku">SKU: {product.id?.toString().padStart(6, '0') || 'N/A'}</p>
                                                </div>
                                            </td>
                                            <td className="product-category">
                                                <span className={`category-badge ${displayCategory}`}>
                                                    {displayCategory}
                                                </span>
                                            </td>
                                            <td className="product-prices">
                                                <div className="price-old">{formatPrice(product.old_price)}</div>
                                                <div className="price-new">{formatPrice(product.new_price)}</div>
                                            </td>
                                            <td className="product-discount">
                                                <span className="discount-badge">
                                                    {calculateDiscount(product.old_price, product.new_price)}% OFF
                                                </span>
                                            </td>
                                            <td className="product-status">
                                                <StatusToggle product={product} />
                                            </td>
                                            <td className="product-date">
                                                {product.date ? new Date(product.date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="product-actions">
                                                <button 
                                                    className="action-btn edit-btn"
                                                    onClick={() => startEditProduct(product)}
                                                    title="Edit Product"
                                                    disabled={!isAdmin()}
                                                >
                                                    <img src={edit_icon} alt="Edit" />
                                                </button>
                                                <button 
                                                    className="action-btn delete-btn"
                                                    onClick={() => removeProduct(product)}
                                                    title="Delete Product"
                                                    disabled={!isAdmin()}
                                                >
                                                    <img src={delete_icon} alt="Delete" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="page-nav"
                            >
                                ← Previous
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (page === 1 || page === totalPages) return true;
                                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                    return false;
                                })
                                .map((page, index, array) => {
                                    const prevPage = array[index - 1];
                                    const showEllipsis = prevPage && page - prevPage > 1;
                                    
                                    return (
                                        <React.Fragment key={page}>
                                            {showEllipsis && <span className="ellipsis">...</span>}
                                            <button
                                                onClick={() => paginate(page)}
                                                className={`page-number ${currentPage === page ? 'active' : ''}`}
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="page-nav"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="table-summary">
                        <p>
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default ListProduct;
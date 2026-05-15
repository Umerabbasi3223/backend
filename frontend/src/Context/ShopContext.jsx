import React, { createContext, useState, useEffect } from "react";
import all_product from "../Components/Assets/all_product";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
    // Try to load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            return JSON.parse(savedCart);
        } catch (error) {
            console.error('Error parsing cart from localStorage:', error);
        }
    }
    
    // Initialize with all products if no saved cart
    let cart = {};
    all_product.forEach(product => {
        cart[product.id] = 0; // Start with quantity 0
    });
    return cart;
}

const ShopContextProvider = (props) => {
    const [cartItems, setCartItems] = useState(getDefaultCart());
    const [totalCartItems, setTotalCartItems] = useState(0);

    // Calculate total items whenever cartItems changes
    useEffect(() => {
        const total = Object.values(cartItems).reduce((sum, quantity) => {
            return sum + (Number(quantity) || 0);
        }, 0);
        setTotalCartItems(total);
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Add item to cart with product data
    const addToCart = (itemId, productData = {}) => {
        setCartItems((prev) => { 
            const newQuantity = (prev[itemId] || 0) + 1;
            
            // Store both quantity and product data if provided
            const updatedCart = { ...prev };
            if (Object.keys(productData).length > 0) {
                updatedCart[itemId] = {
                    quantity: newQuantity,
                    ...productData,
                    id: itemId
                };
            } else {
                updatedCart[itemId] = newQuantity;
            }
            
            return updatedCart;
        });
    }

    // Backward-compatible alias
    const addtoCart = addToCart;

    // Remove item from cart (decrease quantity)
    const removeFromCart = (itemId) => {
        setCartItems((prev) => {
            const currentItem = prev[itemId];
            
            // If item is an object
            if (currentItem && typeof currentItem === 'object') {
                const newQuantity = (currentItem.quantity || 1) - 1;
                if (newQuantity <= 0) {
                    const newCart = { ...prev };
                    delete newCart[itemId];
                    return newCart;
                }
                return {
                    ...prev,
                    [itemId]: {
                        ...currentItem,
                        quantity: newQuantity
                    }
                };
            } 
            // If item is just a number
            else {
                const newQuantity = (prev[itemId] || 1) - 1;
                if (newQuantity <= 0) {
                    const newCart = { ...prev };
                    delete newCart[itemId];
                    return newCart;
                }
                return { ...prev, [itemId]: newQuantity };
            }
        });
    }

    // Alias for removeFromCart (for compatibility)
    const decreaseCartQuantity = removeFromCart;

    // Get total cart items
    const getTotalCartItems = () => {
        return Object.values(cartItems).reduce((total, item) => {
            if (typeof item === 'object') {
                return total + (item.quantity || 0);
            }
            return total + (Number(item) || 0);
        }, 0);
    }

    // Get cart items as array for CartItems page
    const getCartItemsArray = () => {
        return Object.entries(cartItems).map(([id, item]) => {
            if (typeof item === 'object') {
                return {
                    id: id,
                    ...item
                };
            } else {
                // Find product details from all_product
                const product = all_product.find(p => p.id === parseInt(id) || p.id === id);
                return {
                    id: id,
                    quantity: Number(item) || 0,
                    name: product?.name || 'Product',
                    new_price: product?.new_price || 0,
                    image: product?.image || '',
                    category: product?.category || ''
                };
            }
        }).filter(item => item.quantity > 0);
    }

    // Clear cart
    const clearCart = () => {
        setCartItems({});
        localStorage.removeItem('cart');
    }

    // Get product by ID
    const getProductById = (id) => {
        return all_product.find(product => 
            product.id === parseInt(id) || product.id === id
        ) || null;
    }

    // Calculate cart total
    const getCartTotal = () => {
        return getCartItemsArray().reduce((total, item) => {
            const price = item.new_price || 0;
            const quantity = item.quantity || 0;
            return total + (price * quantity);
        }, 0);
    }

    const contextValue = {
        all_product,
        cartItems,
        totalCartItems, // Direct access to total
        getTotalCartItems,
        getCartItemsArray,
        addToCart,
        addtoCart,
        removeFromCart,
        decreaseCartQuantity,
        getProductById,
        getCartTotal,
        clearCart
    };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;
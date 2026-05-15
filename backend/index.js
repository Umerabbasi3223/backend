// Add DNS fix at the VERY TOP
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

// ===========================================
// MIDDLEWARE
// ===========================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// ===========================================
// DATABASE CONNECTION - FIXED WITH SRV
// ===========================================
let isConnected = false;

// Use SRV connection string (mongodb+srv:// not mongodb://)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ua055860_db_user:umer9988@cluster0.sqvgga4.mongodb.net/e-commerce?retryWrites=true&w=majority";

console.log("📡 Attempting to connect to MongoDB...");

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB connected successfully");
    isConnected = true;
})
.catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("⚠️  Server running without database - some features won't work");
    console.log("💡 Troubleshooting tips:");
    console.log("   1. Check if your IP is whitelisted in MongoDB Atlas");
    console.log("   2. Go to MongoDB Atlas → Network Access → Add IP Address");
    console.log("   3. Add your current IP or 0.0.0.0/0 for testing");
    console.log("   4. Wait 2 minutes for changes to take effect");
});

// Monitor connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
    isConnected = true;
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
    isConnected = false;
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
    isConnected = false;
});

const checkConnection = (req, res, next) => {
    if (!isConnected) {
        return res.status(503).json({
            success: false,
            message: "Database not connected. Please try again later."
        });
    }
    next();
};

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "e-commerce-secret-key-2024";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "ADMIN_SECRET_2024";

// ===========================================
// MODELS
// ===========================================

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: { 
        type: String, 
        unique: true,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: { 
        type: String, 
        default: 'user', 
        enum: ['user', 'admin'] 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Email already exists. Please use a different email or login.'));
    } else {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    categories: {
        type: [String],
        required: true,
        default: [],
        enum: ['men', 'women', 'kid', 'new collection']
    },
    isNewCollection: { type: Boolean, default: false },
    new_price: { type: Number, required: true, min: 0 },
    old_price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    image_2: { type: String, default: '' },
    image_3: { type: String, default: '' },
    image_4: { type: String, default: '' },
    description: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true }
});

const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true },
    userId: String,
    userEmail: String,
    userName: String,
    shippingAddress: {
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    contact: {
        phone: String,
        email: String
    },
    items: [{
        productId: Number,
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        image: String
    }],
    paymentMethod: {
        type: String,
        enum: ['card', 'cod', 'bank'],
        default: 'cod'
    },
    subtotal: Number,
    shipping: Number,
    tax: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

// ===========================================
// AUTH MIDDLEWARE
// ===========================================
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }
        
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format. Use: Bearer <token>"
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token structure"
            });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
};

// ===========================================
// FILE UPLOAD CONFIG
// ===========================================
const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});

app.use('/images', express.static(path.join(__dirname, 'upload/images')));

// ===========================================
// AUTH ROUTES
// ===========================================

app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📥 Registration request:', req.body);
        
        const { name, email, password, adminSecretKey } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: name, email, password"
            });
        }
        
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        
        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters"
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }
        
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered. Please login or use a different email."
            });
        }
        
        let role = 'user';
        if (adminSecretKey && adminSecretKey === ADMIN_SECRET_KEY) {
            role = 'admin';
            console.log('🔑 Admin account created:', cleanEmail);
        }
        
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = new User({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: role
        });
        
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ User registered:', cleanEmail, '| Role:', role);
        
        res.status(201).json({
            success: true,
            message: role === 'admin' ? "Admin account created successfully" : "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error("❌ Register error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Registration failed. Please try again."
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('📥 Login request:', { email: req.body?.email });
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        
        const cleanEmail = email.trim().toLowerCase();
        
        const user = await User.findOne({ email: cleanEmail }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ User logged in:', cleanEmail, '| Role:', user.role);
        
        res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
        
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

// ===========================================
// UPLOAD ROUTES
// ===========================================

app.post("/upload", upload.single('product'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "No file uploaded" 
            });
        }
        
        const imageUrl = `/images/${req.file.filename}`;
        const fullUrl = `http://localhost:${port}${imageUrl}`;
        
        res.json({
            success: true,
            message: "Image uploaded successfully",
            image_url: fullUrl,
            filename: req.file.filename
        });
        
    } catch (error) {
        console.error("❌ Upload error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Upload failed" 
        });
    }
});

// ===========================================
// PRODUCT ROUTES
// ===========================================

app.post('/addproduct', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('📥 ADD PRODUCT REQUEST:', req.body);
        
        const { name, image, image_2, image_3, image_4, category, new_price, old_price, description, stock } = req.body;
        
        if (!name || !image || !category || !new_price || !old_price) {
            return res.status(400).json({
                success: false,
                message: "Name, main image, category, new_price, and old_price are required"
            });
        }
        
        let categoryArray = [];
        if (category) {
            const cat = category.trim().toLowerCase();
            if (cat === 'kids') categoryArray = ['kid'];
            else if (['men', 'women', 'kid', 'new collection'].includes(cat)) {
                categoryArray = [cat];
            } else {
                categoryArray = ['men'];
            }
        }
        
        let newCollectionFlag = name.toLowerCase().includes('new');
        
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const nextId = lastProduct ? lastProduct.id + 1 : 1;
        
        const product = new Product({
            id: nextId,
            name: name.trim(),
            image: image,
            image_2: image_2 || '',
            image_3: image_3 || '',
            image_4: image_4 || '',
            categories: categoryArray,
            isNewCollection: newCollectionFlag,
            new_price: parseFloat(new_price),
            old_price: parseFloat(old_price),
            description: description || '',
            stock: parseInt(stock) || 0
        });
        
        await product.save();
        
        const imagesArray = [image];
        if (image_2) imagesArray.push(image_2);
        if (image_3) imagesArray.push(image_3);
        if (image_4) imagesArray.push(image_4);
        
        res.json({
            success: true,
            message: "Product added successfully",
            product: {
                id: product.id,
                name: product.name,
                categories: product.categories,
                images: imagesArray,
                image: product.image,
                image_2: product.image_2,
                image_3: product.image_3,
                image_4: product.image_4,
                new_price: product.new_price,
                old_price: product.old_price,
                stock: product.stock
            }
        });
        
    } catch (error) {
        console.error("❌ Add product error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add product"
        });
    }
});

app.get('/products', async (req, res) => {
    try {
        const { category, search, newcollection } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.categories = category.toLowerCase();
        }
        
        if (newcollection === 'true') {
            query.isNewCollection = true;
        }
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        const products = await Product.find(query).sort({ date: -1 });
        
        const productsWithImages = products.map(product => {
            const productObj = product.toObject();
            const imagesArray = [productObj.image];
            if (productObj.image_2?.trim()) imagesArray.push(productObj.image_2);
            if (productObj.image_3?.trim()) imagesArray.push(productObj.image_3);
            if (productObj.image_4?.trim()) imagesArray.push(productObj.image_4);
            productObj.images = imagesArray;
            return productObj;
        });
        
        res.json({ 
            success: true, 
            count: products.length,
            products: productsWithImages
        });
        
    } catch (error) {
        console.error('❌ Get products error:', error.message);
        res.status(500).json({ 
            success: false,
            message: error.message || "Failed to fetch products" 
        });
    }
});

app.get('/product/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }
        
        const product = await Product.findOne({ id: productId });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        const productObj = product.toObject();
        const imagesArray = [productObj.image];
        if (productObj.image_2?.trim()) imagesArray.push(productObj.image_2);
        if (productObj.image_3?.trim()) imagesArray.push(productObj.image_3);
        if (productObj.image_4?.trim()) imagesArray.push(productObj.image_4);
        productObj.images = imagesArray;
        
        res.json({
            success: true,
            product: productObj
        });
        
    } catch (error) {
        console.error('❌ Get product error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch product"
        });
    }
});

app.put('/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const updates = req.body;
        
        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }
        
        ['image', 'image_2', 'image_3', 'image_4'].forEach(field => {
            if (updates[field] !== undefined) {
                updates[field] = updates[field] || '';
            }
        });
        
        if (updates.category) {
            const cat = updates.category.trim().toLowerCase();
            if (cat === 'kids') updates.categories = ['kid'];
            else if (['men', 'women', 'kid', 'new collection'].includes(cat)) {
                updates.categories = [cat];
            } else {
                updates.categories = ['men'];
            }
        }
        
        if (updates.name?.toLowerCase().includes('new')) {
            updates.isNewCollection = true;
        }
        
        if (updates.new_price) updates.new_price = parseFloat(updates.new_price);
        if (updates.old_price) updates.old_price = parseFloat(updates.old_price);
        if (updates.stock) updates.stock = parseInt(updates.stock);
        
        const product = await Product.findOneAndUpdate(
            { id: productId },
            { $set: updates },
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.json({
            success: true,
            message: "Product updated successfully",
            product
        });
        
    } catch (error) {
        console.error('❌ Update product error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.delete('/deleteproduct/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }
        
        const deletedProduct = await Product.findOneAndDelete({ id: productId });
        
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        ['image', 'image_2', 'image_3', 'image_4'].forEach(field => {
            const imageUrl = deletedProduct[field];
            if (imageUrl && imageUrl.includes('/images/')) {
                try {
                    const filename = imageUrl.split('/images/').pop();
                    const filePath = path.join(__dirname, 'upload/images', filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fsErr) {
                    console.log(`⚠️ Failed to remove ${field} file:`, fsErr.message);
                }
            }
        });
        
        res.json({
            success: true,
            message: "Product deleted successfully",
            productId: deletedProduct.id
        });
        
    } catch (error) {
        console.error('❌ Delete product error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===========================================
// ORDER ROUTES
// ===========================================

app.post('/api/orders/create', authMiddleware, async (req, res) => {
    try {
        const { items, shippingAddress, contact, paymentMethod, subtotal, shipping, tax, discount, total, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order items are required"
            });
        }

        if (!shippingAddress || !contact) {
            return res.status(400).json({
                success: false,
                message: "Shipping address and contact information are required"
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderId = `ORD${timestamp}${random}`;

        const order = new Order({
            orderId,
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            shippingAddress,
            contact: {
                phone: contact.phone || '',
                email: contact.email || user.email
            },
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size || 'M',
                image: item.image
            })),
            paymentMethod: paymentMethod || 'cod',
            subtotal: subtotal || 0,
            shipping: shipping || 0,
            tax: tax || 0,
            discount: discount || 0,
            total: total || 0,
            status: 'pending',
            statusHistory: [{
                status: 'pending',
                note: 'Order created'
            }],
            notes: notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: {
                orderId: order.orderId,
                status: order.status,
                total: order.total,
                items: order.items,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        console.error("❌ Create order error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create order"
        });
    }
});

app.get('/api/orders/my-orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("❌ Get user orders error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch orders"
        });
    }
});

app.get('/api/orders/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId: orderId, userId: req.userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({ success: true, order: order });

    } catch (error) {
        console.error("❌ Get order error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch order"
        });
    }
});

app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, limit = 100, page = 1 } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            count: orders.length,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            orders: orders
        });
        
    } catch (error) {
        console.error("❌ Get admin orders error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch orders"
        });
    }
});

app.put('/api/admin/orders/:orderId/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }
        
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        const order = await Order.findOne({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        order.status = status;
        order.statusHistory.push({
            status: status,
            timestamp: new Date(),
            note: note || `Status changed to ${status} by admin`
        });
        order.updatedAt = new Date();
        
        await order.save();
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: {
                orderId: order.orderId,
                status: order.status,
                statusHistory: order.statusHistory
            }
        });
        
    } catch (error) {
        console.error("❌ Update order status error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update order status"
        });
    }
});

app.delete('/api/orders/:orderId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOneAndDelete({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        res.json({
            success: true,
            message: "Order deleted successfully"
        });
        
    } catch (error) {
        console.error("❌ Delete order error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete order"
        });
    }
});

// ===========================================
// ROOT & ERROR HANDLERS
// ===========================================

app.get("/", (req, res) => {
    res.json({ 
        message: "✅ E-commerce API is running",
        timestamp: new Date().toISOString(),
        version: "2.1.0",
        database: isConnected ? "Connected ✅" : "Disconnected ⚠️",
        features: ["4 Product Images", "JWT Auth", "Role-based Access", "Admin Secret Key"],
        endpoints: {
            auth: {
                register: "POST /api/auth/register (add adminSecretKey for admin)",
                login: "POST /api/auth/login",
                profile: "GET /api/auth/profile (auth required)"
            },
            products: {
                upload: "POST /upload",
                add: "POST /addproduct (admin)",
                getAll: "GET /products",
                getOne: "GET /product/:id",
                update: "PUT /products/:id (admin)",
                delete: "DELETE /deleteproduct/:id (admin)"
            },
            orders: {
                create: "POST /api/orders/create (auth)",
                myOrders: "GET /api/orders/my-orders (auth)",
                getOrder: "GET /api/orders/:orderId (auth)",
                adminOrders: "GET /api/admin/orders (admin)",
                updateStatus: "PUT /api/admin/orders/:orderId/status (admin)",
                delete: "DELETE /api/orders/:orderId (admin)"
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: "File too large (max 5MB)"
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }
    
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', ')
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// ===========================================
// START SERVER
// ===========================================
app.listen(port, () => {
    console.log(`\n🚀 E-commerce API running: http://localhost:${port}`);
    console.log(`\n🔑 Admin Secret Key: ${ADMIN_SECRET_KEY}`);
    console.log(`\n📋 To create admin account, include "adminSecretKey": "${ADMIN_SECRET_KEY}" in registration body`);
    console.log(`\n💾 Database Status: ${isConnected ? 'Connected ✅' : 'Disconnected ⚠️'}`);
    console.log(`\n⚡ Ready!`);
});
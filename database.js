const mongoose = require('mongoose');

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/shopnest', {
//    useNewUrlParser: true,
//    useUnifiedTopology: true
// });

// Customer Schema
const customerSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'Customer', enum: ['Customer', 'Seller', 'Delivery', 'Staff', 'Admin'] },
    status: { type: String, default: 'active', enum: ['active', 'blocked', 'pending'] },
    lastActive: { type: Date, default: Date.now },
    orders: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Seller Schema
const sellerSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    business_name: { type: String, required: true },
    business_type: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'Seller', enum: ['Customer', 'Seller', 'Delivery', 'Staff', 'Admin'] },
    status: { type: String, default: 'active', enum: ['active', 'blocked', 'pending'] },
    lastActive: { type: Date, default: Date.now },
    orders: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'Admin', enum: ['Customer', 'Seller', 'Delivery', 'Staff', 'Admin'] },
    status: { type: String, default: 'active', enum: ['active', 'blocked', 'pending'] },
    lastActive: { type: Date, default: Date.now },
    orders: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Delivery Schema
const deliverySchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'Delivery', enum: ['Customer', 'Seller', 'Delivery', 'Staff', 'Admin'] },
    status: { type: String, default: 'active', enum: ['active', 'blocked', 'pending'] },
    lastActive: { type: Date, default: Date.now },
    orders: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Staff Schema
const staffSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'Staff', enum: ['Customer', 'Seller', 'Delivery', 'Staff', 'Admin'] },
    status: { type: String, default: 'active', enum: ['active', 'blocked', 'pending'] },
    lastActive: { type: Date, default: Date.now },
    orders: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    vendor: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String },
    stock: { type: Number, default: 0 },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    deliveryOption: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    code: { type: String, unique: true, sparse: true }, // Coupon code, unique if provided
    type: { type: String, required: true, enum: ['percent', 'flat', 'free_shipping', 'bogo'] },
    value: { type: Number, required: true },
    appliesTo: { type: String }, // Can be category IDs, product IDs, etc.
    minOrder: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 for unlimited
    perUserLimit: { type: Number, default: 1 },
    usageCount: { type: Number, default: 0 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    notes: { type: String },
    active: { type: Boolean, default: true }
});

// Ensure code is indexed for faster lookups
offerSchema.index({ code: 1, active: 1 });

const Customer = mongoose.model('Customer', customerSchema);
const Seller = mongoose.model('Seller', sellerSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Delivery = mongoose.model('Delivery', deliverySchema);
const Staff = mongoose.model('Staff', staffSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Offer = mongoose.model('Offer', offerSchema);

module.exports = {
    Customer,
    Seller,
    Admin,
    Delivery,
    Staff,
    Product,
    Order,
    Offer
};

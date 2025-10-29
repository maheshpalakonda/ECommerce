const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Customer, Seller, Admin, Delivery, Staff, Product, Order, Offer } = require('./database');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  console.log('Using GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
  try {
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('Google token verification successful. Payload:', payload);
    return { success: true, payload: payload };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return { success: false, message: 'Invalid Google ID token.' };
  }
}

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/IMAGES', express.static(path.join(__dirname, 'IMAGES')));


// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// Customer Registration
app.post('/register/customer', async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: true, message: 'Passwords do not match' });
        }

        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({ error: true, message: 'Customer already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const customer = new Customer({
            fullname,
            email,
            password: hashedPassword
        });

        await customer.save();
        res.json({ error: false, message: 'Customer registered successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during registration' });
    }
});

// Customer Login
app.post('/login/customer', async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.findOne({ email });
        
        if (!customer) {
            return res.status(400).json({ error: true, message: 'Customer not found' });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(400).json({ error: true, message: 'Invalid password' });
        }

        res.json({ 
            error: false, 
            message: 'Login successful',
            user: {
                id: customer._id,
                fullname: customer.fullname,
                email: customer.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during login' });
    }
});

// Seller Registration
app.post('/register/seller', async (req, res) => {
    try {
        const { fullname, business_name, business_type, email, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: true, message: 'Passwords do not match' });
        }

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({ error: true, message: 'Seller already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const seller = new Seller({
            fullname,
            business_name,
            business_type,
            email,
            password: hashedPassword
        });

        await seller.save();
        res.json({ error: false, message: 'Seller registered successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during registration' });
    }
});

// Seller Login
app.post('/login/seller', async (req, res) => {
    try {
        const { email, password } = req.body;
        const seller = await Seller.findOne({ email });
        
        if (!seller) {
            return res.status(400).json({ error: true, message: 'Seller not found' });
        }

        const isMatch = await bcrypt.compare(password, seller.password);
        if (!isMatch) {
            return res.status(400).json({ error: true, message: 'Invalid password' });
        }

        res.json({ 
            error: false, 
            message: 'Login successful',
            seller: {
                id: seller._id,
                fullname: seller.fullname,
                business_name: seller.business_name,
                email: seller.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during login' });
    }
});

// Admin Registration
app.post('/register/admin', async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: true, message: 'Passwords do not match' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: true, message: 'Admin already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            fullname,
            email,
            password: hashedPassword
        });

        await admin.save();
        res.json({ error: false, message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during registration' });
    }
});

// Admin Login
app.post('/login/admin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.status(400).json({ error: true, message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: true, message: 'Invalid password' });
        }

        res.json({ 
            error: false, 
            message: 'Login successful',
            admin: {
                id: admin._id,
                fullname: admin.fullname,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during login' });
    }
});

 // Generic Google Login Handler
 const handleGoogleLogin = (User, userType, detailsExtractor) => async (req, res) => {
     console.log(`Handling Google login for ${userType}...`);
     try {
         const { id_token } = req.body;
         console.log('Received ID token:', id_token ? 'present' : 'missing');
         const verificationResult = await verifyGoogleToken(id_token);
 
         if (!verificationResult.success) {
             console.log(`Google token verification failed for ${userType}:`, verificationResult.message);
             return res.status(401).json({ error: true, message: verificationResult.message });
         }
 
         const googleUser = verificationResult.payload;
         console.log(`Google user payload for ${userType}:`, googleUser);
         let user = await User.findOne({ email: googleUser.email });
 
         if (!user) {
             console.log(`User not found for ${userType}. Creating new user...`);
             const userDetails = {
                 fullname: googleUser.name,
                 email: googleUser.email,
                 password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
                 ...detailsExtractor(googleUser)
             };
             user = new User(userDetails);
             await user.save();
             console.log(`New ${userType} created:`, user.email);
         } else {
             console.log(`Existing ${userType} found:`, user.email);
         }
 
         const responseUser = {
             id: user._id,
             fullname: user.fullname,
             email: user.email,
             ...detailsExtractor(user)
         };
 
         res.json({
             error: false,
             message: 'Login successful',
             user: responseUser,
             userType: userType
         });
         console.log(`Google login successful for ${userType}:`, responseUser.email);
     } catch (error) {
         console.error(`Server error during Google login for ${userType}:`, error);
         res.status(500).json({ error: true, message: `Server error during Google login for ${userType}` });
     }
 };
 
 // Google Login endpoints
 app.post('/login/google/customer', handleGoogleLogin(Customer, 'customer', () => ({})));
 app.post('/login/google/seller', handleGoogleLogin(Seller, 'seller', (user) => ({
     business_name: user.business_name || user.name,
     business_type: user.business_type || 'General'
 })));
 app.post('/login/google/admin', handleGoogleLogin(Admin, 'admin', () => ({})));

// Forgot Password for Customer
app.post('/forgot-password/customer', async (req, res) => {
    try {
        const { email } = req.body;
        const customer = await Customer.findOne({ email });
 
        if (!customer) {
            return res.status(400).json({ error: true, message: 'Customer not found' });
        }
 
        const token = crypto.randomBytes(32).toString('hex');
        customer.resetToken = token;
        customer.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await customer.save();

        const mailOptions = {
            from: 'drv9920@gmail.com',
            to: email,
            subject: 'Password Reset - ShopNest',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your ShopNest customer account.</p>
                <p>Your reset token is: <strong>${token}</strong></p>
                <p>Click the link below to reset your password:</p> 
                <p><a href="http://localhost:3006/reset-password.html?token=${token}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };
 
        await transporter.sendMail(mailOptions);
        res.json({ error: false, message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during password reset' });
    }
});

// Forgot Password for Seller
app.post('/forgot-password/seller', async (req, res) => {
    try {
        const { email } = req.body;
        const seller = await Seller.findOne({ email });
 
        if (!seller) {
            return res.status(400).json({ error: true, message: 'Seller not found' });
        }
 
        const token = crypto.randomBytes(32).toString('hex');
        seller.resetToken = token;
        seller.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await seller.save();

        const mailOptions = {
            from: 'drv9920@gmail.com',
            to: email,
            subject: 'Password Reset - ShopNest',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your ShopNest seller account.</p>
                <p>Click the link below to reset your password:</p> 
                <a href="http://localhost:3006/reset-password.html?token=${token}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };
 
        await transporter.sendMail(mailOptions);
        res.json({ error: false, message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during password reset' });
    }
});

// Forgot Password for Admin
app.post('/forgot-password/admin', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });
 
        if (!admin) {
            return res.status(400).json({ error: true, message: 'Admin not found' });
        }
 
        const token = crypto.randomBytes(32).toString('hex');
        admin.resetToken = token;
        admin.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await admin.save();

        const mailOptions = {
            from: 'drv9920@gmail.com',
            to: email,
            subject: 'Password Reset - ShopNest',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your ShopNest admin account.</p>
                <p>Click the link below to reset your password:</p> 
                <a href="http://localhost:3006/reset-password.html?token=${token}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };
 
        await transporter.sendMail(mailOptions);
        res.json({ error: false, message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during password reset' });
    }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmNewPassword } = req.body;
 
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: true, message: 'Passwords do not match' });
        }
 
        // Find user by token
        let user = await Customer.findOne({ resetToken: token });
        let userType = 'customer';
 
        if (!user) {
            user = await Seller.findOne({ resetToken: token });
            userType = 'seller';
        }
 
        if (!user) {
            user = await Admin.findOne({ resetToken: token });
            userType = 'admin';
        }
 
        if (!user) {
            return res.status(400).json({ error: true, message: 'Invalid or expired token' });
        }
 
        if (user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ error: true, message: 'Token has expired' });
        }
 
        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ error: false, message: 'Password reset successfully', userType });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error during password reset' });
    }
});

// Get all products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error fetching products' });
    }
});

// Create order
app.post('/orders', async (req, res) => {
    try {
        const { customerId, items, totalAmount, deliveryOption, address, paymentMethod } = req.body;

        const order = new Order({
            customerId,
            items,
            totalAmount,
            deliveryOption,
            address,
            paymentMethod
        });

        await order.save();
        res.json({ error: false, message: 'Order created successfully', orderId: order._id });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error creating order' });
    }
});

// --- OFFERS API ---

// GET all offers
app.get('/api/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ _id: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
});

// POST a new offer
app.post('/api/offers', async (req, res) => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (error) {
        res.status(400).json({ message: 'Error creating offer', error });
    }
});

// PUT (update) an offer
app.put('/api/offers/:id', async (req, res) => {
    try {
        const updatedOffer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedOffer) return res.status(404).json({ message: 'Offer not found' });
        res.json(updatedOffer);
    } catch (error) {
        res.status(400).json({ message: 'Error updating offer', error });
    }
});

// DELETE an offer
app.delete('/api/offers/:id', async (req, res) => {
    try {
        const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
        if (!deletedOffer) return res.status(404).json({ message: 'Offer not found' });
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting offer' });
    }
});

// GET all *publicly available* and active offers for the cart page
app.get('/api/available-offers', async (req, res) => {
    try {
        const now = new Date();
        // Find offers that are active, have a code, and are within their validity period.
        const offers = await Offer.find({
            code: { $ne: null, $ne: "" }, // Ensure coupon code exists
            active: true,
            startAt: { $lte: now },
            endAt: { $gte: now }
        }).sort({ value: -1 }); // Sort by value to show best deals first
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching available offers' });
    }
});

// POST to apply a coupon
app.post('/api/apply-coupon', async (req, res) => {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
        return res.status(400).json({ success: false, message: 'Coupon code and subtotal are required.' });
    }

    try {
        const offer = await Offer.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') }, active: true });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
        }

        const now = new Date();
        if (offer.startAt && now < offer.startAt) {
            return res.status(400).json({ success: false, message: 'This coupon is not active yet.' });
        }
        if (offer.endAt && now > offer.endAt) {
            return res.status(400).json({ success: false, message: 'This coupon has expired.' });
        }

        if (offer.minOrder && subtotal < offer.minOrder) {
            return res.status(400).json({ success: false, message: `A minimum order of ₹${offer.minOrder} is required.` });
        }

        let discount = 0;
        let message = '';

        if (offer.type === 'percent') {
            discount = subtotal * (offer.value / 100);
            message = `${offer.value}% discount applied!`;
        } else if (offer.type === 'flat') {
            discount = offer.value;
            message = `₹${offer.value} flat discount applied!`;
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported coupon type.' });
        }

        res.json({ success: true, discount, message });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Server error while applying coupon.' });
    }
});

// POST to increment coupon usage
app.post('/api/offers/increment-usage', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ message: 'Coupon code is required.' });
    }
    try {
        // Find the offer and increment its usageCount
        await Offer.updateOne({ code: code }, { $inc: { usageCount: 1 } });
        res.json({ message: 'Usage count updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating usage count.' });
    }
});

// Get all users for admin user management
app.get('/api/admin/users', async (req, res) => {
    try {
        const customers = await Customer.find({}, 'fullname email phone address status lastActive orders createdAt');
        const sellers = await Seller.find({}, 'fullname email phone address status lastActive orders business_name business_type createdAt');
        const admins = await Admin.find({}, 'fullname email phone address status lastActive orders createdAt');
        const deliveries = await Delivery.find({}, 'fullname email phone address status lastActive orders createdAt');
        const staffs = await Staff.find({}, 'fullname email phone address status lastActive orders createdAt');

        const users = [
            ...customers.map(c => ({ ...c.toObject(), id: c._id, role: 'Customer' })),
            ...sellers.map(s => ({ ...s.toObject(), id: s._id, role: 'Seller' })),
            ...admins.map(a => ({ ...a.toObject(), id: a._id, role: 'Admin' })),
            ...deliveries.map(d => ({ ...d.toObject(), id: d._id, role: 'Delivery' })),
            ...staffs.map(s => ({ ...s.toObject(), id: s._id, role: 'Staff' }))
        ];

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error fetching users' });
    }
});

// Update user details (role, status, etc.) for admin
app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Find the user in all collections
        let user = await Customer.findById(id);
        let model = Customer;
        if (!user) {
            user = await Seller.findById(id);
            model = Seller;
        }
        if (!user) {
            user = await Admin.findById(id);
            model = Admin;
        }
        if (!user) {
            user = await Delivery.findById(id);
            model = Delivery;
        }
        if (!user) {
            user = await Staff.findById(id);
            model = Staff;
        }

        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        // Update the user
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                user[key] = updates[key];
            }
        });

        await user.save();

        res.json({ error: false, message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error updating user' });
    }
});

// Block or unblock user
app.patch('/api/admin/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({ error: true, message: 'Invalid status' });
        }

        // Find the user in all collections
        let user = await Customer.findById(id);
        let model = Customer;
        if (!user) {
            user = await Seller.findById(id);
            model = Seller;
        }
        if (!user) {
            user = await Admin.findById(id);
            model = Admin;
        }
        if (!user) {
            user = await Delivery.findById(id);
            model = Delivery;
        }
        if (!user) {
            user = await Staff.findById(id);
            model = Staff;
        }

        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({ error: false, message: `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error updating user status' });
    }
});

// Catch-all route for client-side routing.
// This should be the LAST route. It ensures that any non-API GET request
// serves the main HTML file, allowing the frontend to handle routing.
app.get('*', (req, res, next) => {
    // Let express.static handle file requests, and API routes handle API requests.
    // For any other GET request, serve the main entry point of your application.
    res.sendFile(path.join(__dirname, 'frontend', 'add to cart.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Your application should now be accessible at http://localhost:${PORT}`);
});
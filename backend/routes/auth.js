const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MachineOwner = require('../models/MachineOwner');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aquafix_jwt_secret_key_2026_xyz', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role, address, machineType, pricePerFt, lat, lng } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer',
      address: address || '',
    });

    // If role is owner, create machine details
    if (user.role === 'owner') {
      if (!machineType || pricePerFt === undefined || lat === undefined || lng === undefined) {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: 'Machine owners must provide machineType, pricePerFt, and coordinates (lat, lng)',
        });
      }

      await MachineOwner.create({
        userId: user._id,
        machineType,
        pricePerFt,
        location: { lat, lng },
        availability: true,
        verified: false, // Default false, verified by admin
      });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Fetch owner details if user is an owner
    let ownerDetails = null;
    if (user.role === 'owner') {
      ownerDetails = await MachineOwner.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        ownerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let ownerDetails = null;

    if (user.role === 'owner') {
      ownerDetails = await MachineOwner.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        ownerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
router.put('/update', protect, async (req, res) => {
  const { name, phone, address, machineType, pricePerFt, availability, lat, lng } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();

    let ownerDetails = null;
    if (user.role === 'owner') {
      const owner = await MachineOwner.findOne({ userId: user._id });
      if (owner) {
        if (machineType) owner.machineType = machineType;
        if (pricePerFt !== undefined) owner.pricePerFt = pricePerFt;
        if (availability !== undefined) owner.availability = availability;
        if (lat !== undefined && lng !== undefined) {
          owner.location = { lat, lng };
        }
        await owner.save();
        ownerDetails = owner;
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        ownerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

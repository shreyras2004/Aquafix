const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const MachineOwner = require('../models/MachineOwner');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply admin protection to all routes in this router
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all bookings list
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name phone email')
      .populate('ownerId', 'name phone email')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get pending (unverified) machine owners
// @route   GET /api/admin/owners/pending
// @access  Private (Admin only)
router.get('/owners/pending', async (req, res) => {
  try {
    const owners = await MachineOwner.find({ verified: false }).populate(
      'userId',
      'name email phone address'
    );
    res.status(200).json({ success: true, count: owners.length, data: owners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify/approve or reject machine owner
// @route   PUT /api/admin/owners/:ownerId/verify
// @access  Private (Admin only)
router.put('/owners/:ownerId/verify', async (req, res) => {
  const { verified } = req.body;

  try {
    // ownerId can be MachineOwner document ID or the associated User ID
    let owner = await MachineOwner.findById(req.params.ownerId);

    if (!owner) {
      // Check if it's the User ID
      owner = await MachineOwner.findOne({ userId: req.params.ownerId });
    }

    if (!owner) {
      return res.status(404).json({ success: false, message: 'Machine owner profile not found' });
    }

    owner.verified = verified === undefined ? true : verified;
    await owner.save();

    res.status(200).json({
      success: true,
      message: `Machine owner has been ${owner.verified ? 'verified' : 'unverified'}`,
      data: owner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

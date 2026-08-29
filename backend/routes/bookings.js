const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const MachineOwner = require('../models/MachineOwner');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure Multer storage for site image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `site-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, webp)'));
    }
  },
});

// @desc    Upload booking site image
// @route   POST /api/bookings/upload
// @access  Private
router.post('/upload', protect, upload.single('siteImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    // Return relative path
    const relativePath = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      url: relativePath,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a booking request
// @route   POST /api/bookings
// @access  Private (Customer only)
router.post('/', protect, async (req, res) => {
  const { ownerId, location, borewellDetails, preferredDate, siteImageUrl } = req.body;

  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can create booking requests' });
    }

    // Verify machine owner exists
    const owner = await MachineOwner.findOne({ userId: ownerId });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Machine owner not found' });
    }

    const booking = await Booking.create({
      customerId: req.user.id,
      ownerId,
      location,
      borewellDetails,
      preferredDate,
      siteImageUrl: siteImageUrl || '',
      status: 'pending',
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user bookings (role-filtered)
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let bookings;

    if (req.user.role === 'customer') {
      bookings = await Booking.find({ customerId: req.user.id })
        .populate('ownerId', 'name phone email address')
        .sort('-createdAt');
    } else if (req.user.role === 'owner') {
      bookings = await Booking.find({ ownerId: req.user.id })
        .populate('customerId', 'name phone email address')
        .sort('-createdAt');
    } else if (req.user.role === 'admin') {
      bookings = await Booking.find()
        .populate('customerId', 'name phone email address')
        .populate('ownerId', 'name phone email address')
        .sort('-createdAt');
    }

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get booking details
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('ownerId', 'name phone email address');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify authorized party
    if (
      req.user.role !== 'admin' &&
      booking.customerId._id.toString() !== req.user.id &&
      booking.ownerId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    // Fetch related payment if exists
    const payment = await Payment.findOne({ bookingId: booking._id });

    res.status(200).json({ success: true, data: booking, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { status, totalAmount, paymentMethod, depth } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization checks
    if (req.user.role === 'customer' && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Customers can only cancel bookings' });
    }

    if (req.user.role === 'owner' && booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Update state
    booking.status = status;
    await booking.save();

    // Auto-generate invoice/payment when booking becomes completed
    if (status === 'completed') {
      const { casingDepth, casingRate } = req.body;
      const drillingDepth = depth ? parseFloat(depth) : 150;
      
      const owner = await MachineOwner.findOne({ userId: booking.ownerId });
      const pricePerFt = owner ? owner.pricePerFt : 100;
      
      const cDepth = casingDepth ? parseFloat(casingDepth) : 0;
      const cRate = casingRate ? parseFloat(casingRate) : 0;

      let amount = totalAmount;
      if (!amount) {
        amount = (drillingDepth * pricePerFt) + (cDepth * cRate);
      }

      // Check if payment already exists
      let payment = await Payment.findOne({ bookingId: booking._id });
      if (!payment) {
        // Generate random unique invoice number
        const invoiceNumber = `AQF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        payment = await Payment.create({
          bookingId: booking._id,
          customerId: booking.customerId,
          amount,
          method: paymentMethod || 'UPI',
          status: 'pending',
          invoiceNumber,
          drillingDepth,
          drillingRate: pricePerFt,
          casingDepth: cDepth,
          casingRate: cRate,
        });
      }
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

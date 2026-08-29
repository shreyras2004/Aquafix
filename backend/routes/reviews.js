const express = require('express');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a review for a booking
// @route   POST /api/reviews
// @access  Private (Customer only)
router.post('/', protect, async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can review services' });
    }

    // Verify booking exists, belongs to the customer, and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings' });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user.id,
      ownerId: booking.ownerId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get reviews for a specific owner
// @route   GET /api/reviews/owner/:ownerUserId
// @access  Public
router.get('/owner/:ownerUserId', async (req, res) => {
  try {
    const reviews = await Review.find({ ownerId: req.params.ownerUserId })
      .populate('customerId', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

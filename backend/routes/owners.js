const express = require('express');
const MachineOwner = require('../models/MachineOwner');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: Haversine distance formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Get all verified machine owners
// @route   GET /api/owners
// @access  Public
router.get('/', async (req, res) => {
  try {
    const owners = await MachineOwner.find({ verified: true }).populate('userId', 'name email phone address');
    res.status(200).json({ success: true, count: owners.length, data: owners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get nearby machine owners with distances
// @route   GET /api/owners/nearby
// @access  Public
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;

  try {
    // Fetch verified and available owners
    const owners = await MachineOwner.find({ verified: true, availability: true }).populate(
      'userId',
      'name email phone address'
    );

    let nearbyOwners = owners.map((owner) => {
      let distance = 0;
      if (lat && lng && owner.location && owner.location.lat && owner.location.lng) {
        distance = getDistance(
          parseFloat(lat),
          parseFloat(lng),
          owner.location.lat,
          owner.location.lng
        );
      }
      return {
        ...owner.toObject(),
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      };
    });

    // Sort by distance
    nearbyOwners.sort((a, b) => a.distance - b.distance);

    // Filter by radius if provided
    if (radius) {
      const maxRadius = parseFloat(radius);
      nearbyOwners = nearbyOwners.filter((owner) => owner.distance <= maxRadius);
    }

    res.status(200).json({ success: true, count: nearbyOwners.length, data: nearbyOwners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single machine owner by owner ID (User ID or MachineOwner ID)
// @route   GET /api/owners/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let owner = await MachineOwner.findById(req.params.id).populate('userId', 'name email phone address');
    
    if (!owner) {
      // Try searching by userId
      owner = await MachineOwner.findOne({ userId: req.params.id }).populate('userId', 'name email phone address');
    }

    if (!owner) {
      return res.status(404).json({ success: false, message: 'Machine owner not found' });
    }

    res.status(200).json({ success: true, data: owner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update machine owner profile (Price, availability, location)
// @route   PUT /api/owners/profile
// @access  Private (Owner only)
router.put('/profile', protect, authorize('owner'), async (req, res) => {
  const { machineType, pricePerFt, availability, lat, lng } = req.body;

  try {
    let owner = await MachineOwner.findOne({ userId: req.user.id });

    if (!owner) {
      return res.status(404).json({ success: false, message: 'Machine owner profile not found' });
    }

    if (machineType) owner.machineType = machineType;
    if (pricePerFt !== undefined) owner.pricePerFt = pricePerFt;
    if (availability !== undefined) owner.availability = availability;
    if (lat !== undefined && lng !== undefined) {
      owner.location = { lat, lng };
    }

    await owner.save();

    res.status(200).json({ success: true, data: owner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the average rating for the machine owner when a review is added
ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.ownerId);
});

ReviewSchema.statics.calculateAverageRating = async function (ownerUserId) {
  const stats = await this.aggregate([
    { $match: { ownerId: ownerUserId } },
    {
      $group: {
        _id: '$ownerId',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('MachineOwner').findOneAndUpdate(
        { userId: ownerUserId },
        { rating: Math.round(stats[0].averageRating * 10) / 10 }
      );
    }
  } catch (err) {
    console.error(`Error calculating average rating: ${err}`);
  }
};

module.exports = mongoose.model('Review', ReviewSchema);

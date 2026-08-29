const mongoose = require('mongoose');
const User = require('./models/User');
const MachineOwner = require('./models/MachineOwner');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aquafix';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear old data
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await MachineOwner.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});

    console.log('Seeding default credentials...');

    // 1. Seed Customer
    const customer = await User.create({
      name: 'Vishal Mishra (Customer)',
      email: 'customer@gmail.com',
      password: 'password123',
      phone: '9876543210',
      role: 'customer',
      address: 'MG Road, Bangalore',
    });
    console.log('Customer seeded: customer@gmail.com / password123');

    // 2. Seed Machine Owner
    const owner = await User.create({
      name: 'Suresh Rig Operators (Owner)',
      email: 'owner@gmail.com',
      password: 'password123',
      phone: '8765432109',
      role: 'owner',
      address: 'Whitefield, Bangalore',
    });

    await MachineOwner.create({
      userId: owner._id,
      machineType: 'DTH High-Pressure Rig',
      pricePerFt: 75,
      rating: 5,
      availability: true,
      verified: true, // Auto-verified for instant use
      location: { lat: 12.9716, lng: 77.5946 }, // Bangalore Center
    });
    console.log('Machine Owner seeded: owner@gmail.com / password123 (Verified & Online)');

    // 3. Seed Admin
    const admin = await User.create({
      name: 'AquaFix Superintendent (Admin)',
      email: 'admin@gmail.com',
      password: 'adminpassword123',
      phone: '1111122222',
      role: 'admin',
      address: 'AquaFix Bangalore Head Office',
    });
    console.log('Admin seeded: admin@gmail.com / adminpassword123');

    // 4. Create one mock pending machine owner for admin verification testing
    const pendingUser = await User.create({
      name: 'Anil Earth Drills (Pending)',
      email: 'pendingowner@gmail.com',
      password: 'password123',
      phone: '9900887766',
      role: 'owner',
      address: 'Hebbal, Bangalore',
    });

    await MachineOwner.create({
      userId: pendingUser._id,
      machineType: 'Rotary Drilling Rig',
      pricePerFt: 90,
      rating: 4.2,
      availability: true,
      verified: false, // Needs admin approval
      location: { lat: 13.0358, lng: 77.5970 },
    });
    console.log('Pending Machine Owner seeded (for Admin verification testing): pendingowner@gmail.com / password123');

    console.log('\n=== Database Seeding Completed Successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

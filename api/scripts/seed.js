require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../src/models/Listing');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ DB connected (seed)');

  // Use your user as seller (change email if needed)
  const sellerEmail = 'lazaroviciirinel@gmail.com';
  const seller = await User.findOne({ email: sellerEmail });
  if (!seller) {
    throw new Error(
      `Seed aborted: user ${sellerEmail} not found. Register that user first via /api/auth/register.`,
    );
  }

  // Sample listings (cars + parts + other)
  const samples = [
    {
      title: 'BMW 320d',
      description: 'Well maintained, full service history.',
      category: 'car',
      price: 4500,
      currency: 'GBP',
      make: 'BMW',
      model: '320d',
      year: 2012,
      mileage: 122000,
      location: 'London',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'Audi A3 1.6 TDI',
      description: 'Great commuter, new MOT.',
      category: 'car',
      price: 4200,
      currency: 'GBP',
      make: 'Audi',
      model: 'A3',
      year: 2013,
      mileage: 98000,
      location: 'London',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'Ford Focus 1.0 EcoBoost',
      description: 'Economical, clean interior.',
      category: 'car',
      price: 3800,
      currency: 'GBP',
      make: 'Ford',
      model: 'Focus',
      year: 2014,
      mileage: 110000,
      location: 'Birmingham',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'VW Golf GTD',
      description: 'Fast and efficient, recent service.',
      category: 'car',
      price: 7200,
      currency: 'GBP',
      make: 'Volkswagen',
      model: 'Golf',
      year: 2015,
      mileage: 89000,
      location: 'Manchester',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'BMW 3 Series alloy wheels set',
      description: '4x alloys, minor scuffs.',
      category: 'part',
      price: 250,
      currency: 'GBP',
      make: 'BMW',
      model: '3 Series',
      year: 0,
      location: 'London',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'iPhone 12 128GB',
      description: 'Good condition, unlocked.',
      category: 'other',
      price: 280,
      currency: 'GBP',
      location: 'Leeds',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'Samsung Galaxy S21',
      description: 'Small scratch on screen.',
      category: 'other',
      price: 260,
      currency: 'GBP',
      location: 'Bristol',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'Dell XPS 13 (2020)',
      description: 'i7, 16GB RAM, 512GB SSD.',
      category: 'other',
      price: 520,
      currency: 'GBP',
      location: 'London',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'BMW E90 brake discs (front pair)',
      description: 'New, unopened box.',
      category: 'part',
      price: 75,
      currency: 'GBP',
      make: 'BMW',
      model: 'E90',
      location: 'Sheffield',
      images: [],
      seller: seller._id,
      active: true,
    },
    {
      title: 'Apple AirPods Pro (2nd gen)',
      description: 'Barely used.',
      category: 'other',
      price: 120,
      currency: 'GBP',
      location: 'London',
      images: [],
      seller: seller._id,
      active: true,
    },
  ];

  const inserted = await Listing.insertMany(samples);
  console.log(`✅ Inserted ${inserted.length} listings`);
  await mongoose.disconnect();
  console.log('✅ Seed complete, connection closed');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

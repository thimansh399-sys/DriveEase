require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('../models/Driver');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease');

  const result = await Driver.updateMany(
    {
      $or: [
        { 'personalDetails.city': { $exists: false } },
        { 'personalDetails.city': '' },
        { 'currentLocation.city': { $exists: false } },
        { 'currentLocation.city': '' },
      ],
    },
    {
      $set: {
        'personalDetails.address': 'Swaroop Nagar',
        'personalDetails.city': 'Kanpur',
        'personalDetails.state': 'Uttar Pradesh',
        'personalDetails.pincode': '208001',
        'currentLocation.city': 'Kanpur',
        'currentLocation.state': 'Uttar Pradesh',
        'currentLocation.pincode': '208001',
      },
      $addToSet: {
        serviceAreas: {
          $each: ['Kanpur', 'Swaroop Nagar', 'Uttar Pradesh'],
        },
      },
    }
  );

  console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }));
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
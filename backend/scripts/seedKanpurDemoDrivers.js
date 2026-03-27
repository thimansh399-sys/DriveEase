require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('../models/Driver');

const KANPUR_AREAS = [
  { area: 'Swaroop Nagar', lat: 26.4851, lng: 80.3156, pincode: '208002' },
  { area: 'Kakadeo', lat: 26.4684, lng: 80.2967, pincode: '208025' },
  { area: 'Kidwai Nagar', lat: 26.4331, lng: 80.3312, pincode: '208011' },
  { area: 'Govind Nagar', lat: 26.4488, lng: 80.3098, pincode: '208006' },
  { area: 'Barra', lat: 26.4148, lng: 80.3054, pincode: '208027' },
  { area: 'Civil Lines', lat: 26.4698, lng: 80.3522, pincode: '208001' },
  { area: 'Kalyanpur', lat: 26.5162, lng: 80.2496, pincode: '208017' },
  { area: 'Shyam Nagar', lat: 26.4287, lng: 80.3419, pincode: '208013' },
  { area: 'Arya Nagar', lat: 26.4806, lng: 80.3363, pincode: '208002' },
  { area: 'Nawabganj', lat: 26.5014, lng: 80.3099, pincode: '208002' },
  { area: 'Tilak Nagar', lat: 26.4919, lng: 80.3244, pincode: '208002' },
  { area: 'Panki', lat: 26.4898, lng: 80.2364, pincode: '208020' }
];

const FIRST_NAMES = ['Rajesh', 'Amit', 'Vikram', 'Suresh', 'Krishna', 'Arjun', 'Ravi', 'Manoj', 'Sanjay', 'Deepak', 'Sunil', 'Ajay', 'Pankaj', 'Rakesh', 'Anil', 'Prakash', 'Mahesh', 'Naresh', 'Dinesh', 'Ashok'];
const LAST_NAMES = ['Singh', 'Sharma', 'Patel', 'Yadav', 'Verma', 'Gupta', 'Mishra', 'Dubey', 'Tripathi', 'Saxena', 'Awasthi', 'Kumar', 'Pandey', 'Bajpai', 'Tiwari'];
const VEHICLES = ['Maruti Dzire', 'Hyundai Aura', 'Honda Amaze', 'Toyota Etios', 'Tata Tigor', 'Maruti Ciaz'];
const COLORS = ['White', 'Silver', 'Grey', 'Blue', 'Black'];

const randomFrom = (values, index) => values[index % values.length];
const pad = (value, width = 4) => String(value).padStart(width, '0');

function buildKanpurDriver(index, online = true) {
  const location = KANPUR_AREAS[index % KANPUR_AREAS.length];
  const firstName = randomFrom(FIRST_NAMES, index);
  const lastName = randomFrom(LAST_NAMES, index * 3);
  const suffix = pad(index, 5);
  const latitude = location.lat + ((index % 5) - 2) * 0.0024;
  const longitude = location.lng + ((index % 7) - 3) * 0.002;

  return {
    updateOne: {
      // Dedicated number range to avoid touching organically registered drivers.
      filter: { phone: `91${9700000000 + index}` },
      update: {
        $set: {
          name: `${firstName} ${lastName}`,
          phone: `91${9700000000 + index}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@driveease.demo`,
          aadhaarNumber: `8888777766${suffix}`,
          licenseNumber: `UPDL${suffix}`,
          personalDetails: {
            address: `${location.area}, Kanpur`,
            city: 'Kanpur',
            state: 'Uttar Pradesh',
            pincode: location.pincode,
            bloodGroup: 'B+'
          },
          vehicle: {
            model: randomFrom(VEHICLES, index),
            registrationNumber: `UP-${pad((index % 99) + 1, 2)}-${pad(index, 4)}`,
            color: randomFrom(COLORS, index),
            seatCapacity: 5,
            seatsAvailable: 1
          },
          experience: {
            yearsOfExperience: 2 + (index % 7),
            totalRides: 200 + (index * 8),
            totalEarnings: 25000 + (index * 1600)
          },
          rating: {
            averageRating: Number((4.3 + ((index % 6) * 0.1)).toFixed(1)),
            totalRatings: 80 + (index * 3)
          },
          languages: ['Hindi', 'English'],
          serviceAreas: ['Kanpur', location.area, 'Uttar Pradesh'],
          status: 'approved',
          isOnline: online,
          availabilityStatus: online ? 'AVAILABLE' : 'BUSY',
          currentLocation: {
            latitude,
            longitude,
            city: 'Kanpur',
            state: 'Uttar Pradesh',
            pincode: location.pincode,
            lastUpdated: new Date()
          },
          documents: {
            aadhar: { number: `8888777766${suffix}`, verified: true },
            drivingLicense: { number: `UPDL${suffix}`, verified: true },
            selfie: { verified: true }
          },
          backgroundVerification: {
            status: 'verified',
            verificationDate: new Date()
          },
          training: {
            etiquetteTraining: true,
            safetyTraining: true
          },
          registrationFee: {
            amount: 150,
            paid: true,
            paymentDate: new Date()
          },
          paymentVerification: {
            registrationFeeAmount: 150,
            status: 'verified',
            verificationTime: new Date()
          },
          onlineStatus: {
            isCurrentlyOnline: online,
            onlineStartTime: online ? new Date() : null,
            totalOnlineHoursThisMonth: online ? 22 + (index % 18) : 6 + (index % 6),
            totalOnlineHoursAllTime: 100 + (index * 2)
          },
          updatedAt: new Date(),
          createdAt: new Date()
        }
      },
      upsert: true
    }
  };
}

async function run() {
  const onlineCount = Math.max(1, Number(process.env.KANPUR_ONLINE_DRIVERS || 60));
  const offlineCount = Math.max(0, Number(process.env.KANPUR_OFFLINE_DRIVERS || 20));

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease');

    const operations = [];

    for (let index = 1; index <= onlineCount; index += 1) {
      operations.push(buildKanpurDriver(index, true));
    }

    for (let index = 1; index <= offlineCount; index += 1) {
      operations.push(buildKanpurDriver(1000 + index, false));
    }

    const result = await Driver.bulkWrite(operations, { ordered: false });
    const kanpurOnlineCount = await Driver.countDocuments({
      status: 'approved',
      isOnline: true,
      $or: [
        { 'personalDetails.city': 'Kanpur' },
        { 'currentLocation.city': 'Kanpur' },
        { serviceAreas: 'Kanpur' }
      ]
    });

    console.log('Kanpur demo seeding complete');
    console.log(JSON.stringify({
      requestedOnline: onlineCount,
      requestedOffline: offlineCount,
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      matched: result.matchedCount || 0,
      kanpurOnlineCount
    }, null, 2));
  } catch (error) {
    console.error('Kanpur seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();

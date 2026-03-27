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
  { area: 'Panki', lat: 26.4898, lng: 80.2364, pincode: '208020' },
];

const OTHER_CITY_POOLS = [
  { city: 'Lucknow', state: 'Uttar Pradesh', area: 'Gomti Nagar', lat: 26.8467, lng: 80.9462, pincode: '226010' },
  { city: 'Noida', state: 'Uttar Pradesh', area: 'Sector 62', lat: 28.6270, lng: 77.3649, pincode: '201309' },
  { city: 'Delhi', state: 'Delhi', area: 'Dwarka', lat: 28.5921, lng: 77.0460, pincode: '110075' },
  { city: 'Mumbai', state: 'Maharashtra', area: 'Andheri', lat: 19.1136, lng: 72.8697, pincode: '400053' },
  { city: 'Pune', state: 'Maharashtra', area: 'Baner', lat: 18.5590, lng: 73.7868, pincode: '411045' },
  { city: 'Bengaluru', state: 'Karnataka', area: 'Koramangala', lat: 12.9352, lng: 77.6245, pincode: '560034' },
  { city: 'Hyderabad', state: 'Telangana', area: 'Gachibowli', lat: 17.4401, lng: 78.3489, pincode: '500032' },
  { city: 'Jaipur', state: 'Rajasthan', area: 'Malviya Nagar', lat: 26.8470, lng: 75.8050, pincode: '302017' },
  { city: 'Kolkata', state: 'West Bengal', area: 'Salt Lake', lat: 22.5867, lng: 88.4170, pincode: '700091' },
  { city: 'Ahmedabad', state: 'Gujarat', area: 'Satellite', lat: 23.0274, lng: 72.5246, pincode: '380015' },
];

const FIRST_NAMES = ['Rajesh', 'Amit', 'Vikram', 'Suresh', 'Krishna', 'Arjun', 'Ravi', 'Manoj', 'Sanjay', 'Deepak', 'Sunil', 'Ajay', 'Pankaj', 'Rakesh', 'Anil', 'Prakash', 'Mahesh', 'Naresh', 'Dinesh', 'Ashok'];
const LAST_NAMES = ['Singh', 'Sharma', 'Patel', 'Yadav', 'Verma', 'Gupta', 'Mishra', 'Dubey', 'Tripathi', 'Saxena', 'Awasthi', 'Kumar', 'Pandey', 'Bajpai', 'Tiwari'];
const VEHICLES = ['Maruti Dzire', 'Hyundai Aura', 'Honda Amaze', 'Toyota Etios', 'Tata Tigor', 'Maruti Ciaz'];
const COLORS = ['White', 'Silver', 'Grey', 'Blue', 'Black'];

const randomFrom = (values, index) => values[index % values.length];
const pad = (value, width = 4) => String(value).padStart(width, '0');

function buildDriver(index, location, city, state, online = true) {
  const firstName = randomFrom(FIRST_NAMES, index);
  const lastName = randomFrom(LAST_NAMES, index * 3);
  const name = `${firstName} ${lastName}`;
  const phone = `91${9800000000 + index}`;
  const suffix = pad(index, 5);
  const latitude = location.lat + ((index % 5) - 2) * 0.0025;
  const longitude = location.lng + ((index % 7) - 3) * 0.0021;

  return {
    updateOne: {
      filter: { phone },
      update: {
        $set: {
          name,
          phone,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@driveease.demo`,
          aadhaarNumber: `9999888877${suffix}`,
          licenseNumber: `${state.slice(0, 2).toUpperCase()}DL${suffix}`,
          personalDetails: {
            address: `${location.area}, ${city}`,
            city,
            state,
            pincode: location.pincode,
            bloodGroup: 'B+'
          },
          vehicle: {
            model: randomFrom(VEHICLES, index),
            registrationNumber: `${state.slice(0, 2).toUpperCase()}-${pad((index % 99) + 1, 2)}-${pad(index, 4)}`,
            color: randomFrom(COLORS, index),
            seatCapacity: 5,
            seatsAvailable: 1
          },
          experience: {
            yearsOfExperience: 2 + (index % 8),
            totalRides: 220 + (index * 9),
            totalEarnings: 30000 + (index * 1800)
          },
          rating: {
            averageRating: Number((4.3 + ((index % 6) * 0.1)).toFixed(1)),
            totalRatings: 120 + (index * 4)
          },
          languages: ['Hindi', 'English'],
          serviceAreas: [city, location.area, state],
          status: 'approved',
          isOnline: online,
          availabilityStatus: online ? 'AVAILABLE' : 'BUSY',
          currentLocation: {
            latitude,
            longitude,
            city,
            state,
            pincode: location.pincode,
            lastUpdated: new Date()
          },
          backgroundVerification: {
            status: 'verified',
            verificationDate: new Date()
          },
          training: {
            etiquetteTraining: true,
            safetyTraining: true
          },
          documents: {
            aadhar: { number: `9999888877${suffix}`, verified: true },
            drivingLicense: { number: `${state.slice(0, 2).toUpperCase()}DL${suffix}`, verified: true },
            selfie: { verified: true }
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
            totalOnlineHoursThisMonth: online ? 24 + (index % 18) : 6 + (index % 6),
            totalOnlineHoursAllTime: 150 + (index * 3)
          },
          updatedAt: new Date(),
          createdAt: new Date()
        }
      },
      upsert: true
    }
  };
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease');

    const operations = [];

    for (let index = 0; index < 48; index += 1) {
      const location = KANPUR_AREAS[index % KANPUR_AREAS.length];
      operations.push(buildDriver(index + 1, location, 'Kanpur', 'Uttar Pradesh', true));
    }

    for (let index = 0; index < 12; index += 1) {
      const location = KANPUR_AREAS[index % KANPUR_AREAS.length];
      operations.push(buildDriver(index + 101, location, 'Kanpur', 'Uttar Pradesh', false));
    }

    OTHER_CITY_POOLS.forEach((location, offset) => {
      for (let index = 0; index < 2; index += 1) {
        operations.push(buildDriver(201 + offset * 10 + index, location, location.city, location.state, true));
      }
    });

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

    console.log('Driver seed complete');
    console.log(JSON.stringify({
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      matched: result.matchedCount || 0,
      kanpurOnlineCount
    }, null, 2));
  } catch (error) {
    console.error('Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();

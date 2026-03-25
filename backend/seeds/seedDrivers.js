require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('../models/Driver');

// Generate 100+ diverse drivers across India
const cities = [
  { city: 'Delhi', state: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.2090 },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001', lat: 19.0760, lng: 72.8777 },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560034', lat: 12.9716, lng: 77.6412 },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001', lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', lat: 23.0225, lng: 72.5714 },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001', lat: 18.5204, lng: 73.8567 },
  { city: 'Jaipur', state: 'Rajasthan', pincode: '302001', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', lat: 26.8467, lng: 80.9462 },
  { city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001', lat: 26.4499, lng: 80.3319 },
  { city: 'Nagpur', state: 'Maharashtra', pincode: '440001', lat: 21.1458, lng: 79.0882 },
  { city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', lat: 22.7196, lng: 75.8577 },
  { city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001', lat: 23.2599, lng: 77.4126 },
  { city: 'Patna', state: 'Bihar', pincode: '800001', lat: 25.5941, lng: 85.1376 },
  { city: 'Vadodara', state: 'Gujarat', pincode: '390001', lat: 22.3072, lng: 73.1812 },
  { city: 'Ludhiana', state: 'Punjab', pincode: '141001', lat: 30.9000, lng: 75.8573 },
  { city: 'Agra', state: 'Uttar Pradesh', pincode: '282001', lat: 27.1767, lng: 78.0081 },
  { city: 'Nashik', state: 'Maharashtra', pincode: '422001', lat: 19.9975, lng: 73.7898 },
  { city: 'Faridabad', state: 'Haryana', pincode: '121001', lat: 28.4089, lng: 77.3178 },
  { city: 'Meerut', state: 'Uttar Pradesh', pincode: '250001', lat: 28.9845, lng: 77.7064 },
  { city: 'Rajkot', state: 'Gujarat', pincode: '360001', lat: 22.3039, lng: 70.8022 },
  { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001', lat: 25.3176, lng: 82.9739 },
  { city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001', lat: 34.0837, lng: 74.7973 },
  { city: 'Amritsar', state: 'Punjab', pincode: '143001', lat: 31.6340, lng: 74.8723 }
];

const names = ['Raj', 'Amit', 'Vikram', 'Suresh', 'Krishna', 'Arjun', 'Ravi', 'Manoj', 'Sanjay', 'Deepak', 'Sunil', 'Ajay', 'Pankaj', 'Rakesh', 'Anil', 'Prakash', 'Mahesh', 'Naresh', 'Dinesh', 'Ashok', 'Kiran', 'Rohit', 'Nitin', 'Yogesh', 'Harish', 'Prem', 'Shyam', 'Gopal', 'Satish', 'Vinod', 'Jitendra', 'Mukesh', 'Suraj', 'Hemant', 'Lalit', 'Umesh', 'Sandeep', 'Vikas', 'Santosh', 'Rajesh', 'Bharat', 'Shubham', 'Abhishek', 'Rahul', 'Aakash', 'Aman', 'Kunal', 'Parth', 'Jay', 'Himanshu'];
const surnames = ['Singh', 'Sharma', 'Patel', 'Reddy', 'Desai', 'Kumar', 'Gupta', 'Pandey', 'Yadav', 'Choudhary', 'Verma', 'Mehta', 'Joshi', 'Jain', 'Kapoor', 'Bansal', 'Saxena', 'Dubey', 'Mishra', 'Sethi', 'Malhotra', 'Aggarwal', 'Goel', 'Soni', 'Chopra', 'Kohli', 'Gill', 'Sidhu', 'Kaul', 'Bedi', 'Grover', 'Bajaj', 'Suri', 'Talwar', 'Ahluwalia', 'Bakshi', 'Bhalla', 'Chhabra', 'Duggal', 'Gulati', 'Juneja', 'Khanna', 'Lamba', 'Madaan', 'Nanda', 'Oberoi', 'Puri', 'Randhawa', 'Sarin', 'Tandon'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPhone(i) { return '98' + String(76543210 + i).padStart(8, '0'); }

const driversData = [];
for (let i = 0; i < 110; i++) {
  const cityObj = cities[i % cities.length];
  const name = randomFrom(names) + ' ' + randomFrom(surnames);
  const phone = randomPhone(i);
  const email = name.toLowerCase().replace(/ /g, '.') + '@driveease.com';
  const isOnline = i % 3 === 0;
  const rating = 4.5 + (Math.random() * 0.5);
  const totalRatings = 500 + Math.floor(Math.random() * 1500);
  const yearsOfExperience = 3 + Math.floor(Math.random() * 12);
  const totalRides = 1000 + Math.floor(Math.random() * 9000);
  const vehicleTypes = ['Honda City', 'Maruti Swift', 'Hyundai i20', 'Tata Nexon', 'Skoda Rapid', 'Toyota Innova', 'Ford Figo', 'Mahindra XUV', 'Renault Kwid', 'Hyundai Creta'];
  const vehicleColors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow'];
  const vehicle = {
    type: randomFrom(vehicleTypes),
    model: String(2018 + Math.floor(Math.random() * 7)),
    registrationNumber: cityObj.state.substring(0,2).toUpperCase() + '-' + String(1 + Math.floor(Math.random()*9)).padStart(2,'0') + '-' + String(1000 + i),
    color: randomFrom(vehicleColors),
    seatCapacity: 5
  };
  driversData.push({
    name,
    phone,
    email,
    personalDetails: {
      address: `${Math.floor(Math.random()*1000)} Main Road, ${cityObj.city}`,
      city: cityObj.city,
      state: cityObj.state,
      pincode: cityObj.pincode,
      bloodGroup: randomFrom(['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'])
    },
    vehicle,
    experience: { yearsOfExperience, totalRides },
    rating: { averageRating: Number(rating.toFixed(2)), totalRatings },
    languages: ['Hindi', 'English'],
    serviceAreas: [cityObj.city],
    status: 'approved',
    isOnline,
    currentLocation: { latitude: cityObj.lat + Math.random()/100, longitude: cityObj.lng + Math.random()/100, city: cityObj.city, state: cityObj.state, pincode: cityObj.pincode },
    documents: {
      aadhar: { number: '1234-5678-9' + String(1000+i), verified: true },
      pancard: { number: 'ABCDE' + String(1000+i).slice(-4) + 'F', verified: true },
      drivingLicense: { number: cityObj.state.substring(0,2).toUpperCase() + '-022023' + String(1000000+i), verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  });
}

// Add hardcoded drivers to driversData array
const hardcodedDrivers = [
  {
    name: 'Sanjay Kumar',
    phone: '9876543215',
    email: 'sanjay.kumar@driveease.com',
    personalDetails: {
      address: '987 Hitech City, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      bloodGroup: 'A-'
    },
    vehicle: {
      type: 'Ford Aspire',
      model: '2022',
      registrationNumber: 'TS-01-KL-2345',
      color: 'Silver',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 9, totalRides: 6500 },
    rating: { averageRating: 4.7, totalRatings: 1300 },
    languages: ['Telugu', 'Hindi', 'English', 'Urdu'],
    serviceAreas: ['Hyderabad', 'Secunderabad'],
    status: 'approved',
    isOnline: true,
    currentLocation: { latitude: 17.3850, longitude: 78.4867, city: 'Hyderabad', state: 'Telangana', pincode: '500081' },
    documents: {
      aadhar: { number: '1234-5678-9017', verified: true },
      pancard: { number: 'FGHIJ1234K', verified: true },
      drivingLicense: { number: 'TS-0220230000001', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  },
  {
    name: 'Amit Naidu',
    phone: '9876543216',
    email: 'amit.naidu@driveease.com',
    personalDetails: {
      address: '147 Baner, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      bloodGroup: 'B-'
    },
    vehicle: {
      type: 'Volkswagen Vento',
      model: '2021',
      registrationNumber: 'MH-03-MN-6789',
      color: 'White',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 6, totalRides: 4500 },
    rating: { averageRating: 4.6, totalRatings: 950 },
    languages: ['Hindi', 'Marathi', 'English'],
    serviceAreas: ['Pune', 'Pimpri-Chinchwad'],
    status: 'approved',
    isOnline: false,
    currentLocation: { latitude: 18.5204, longitude: 73.8567, city: 'Pune', state: 'Maharashtra', pincode: '411045' },
    documents: {
      aadhar: { number: '1234-5678-9018', verified: true },
      pancard: { number: 'GHIJK1234L', verified: true },
      drivingLicense: { number: 'MH-0220230000003', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  },
  {
    name: 'Ravi Rana',
    phone: '9876543217',
    email: 'ravi.rana@driveease.com',
    personalDetails: {
      address: '258 Salt Lake, Kolkata',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700064',
      bloodGroup: 'O+'
    },
    vehicle: {
      type: 'mahindra XUV500',
      model: '2021',
      registrationNumber: 'WB-01-OP-4567',
      color: 'Grey',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 8, totalRides: 5800 },
    rating: { averageRating: 4.5, totalRatings: 850 },
    languages: ['Bengali', 'Hindi', 'English'],
    serviceAreas: ['Kolkata', 'South 24 Parganas'],
    status: 'approved',
    isOnline: true,
    currentLocation: { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata', state: 'West Bengal', pincode: '700064' },
    documents: {
      aadhar: { number: '1234-5678-9019', verified: true },
      pancard: { number: 'HIJKL1234M', verified: true },
      drivingLicense: { number: 'WB-0220230000001', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  },
  {
    name: 'Deepak Ganesh',
    phone: '9876543218',
    email: 'deepak.ganesh@driveease.com',
    personalDetails: {
      address: '369 T. Nagar, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      bloodGroup: 'AB-'
    },
    vehicle: {
      type: 'Citroen C5 Aircross',
      model: '2022',
      registrationNumber: 'TN-01-QR-8901',
      color: 'Red',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 7, totalRides: 5200 },
    rating: { averageRating: 4.7, totalRatings: 1050 },
    languages: ['Tamil', 'Telugu', 'English', 'Hindi'],
    serviceAreas: ['Chennai'],
    status: 'approved',
    isOnline: true,
    currentLocation: { latitude: 13.0627, longitude: 80.2168, city: 'Chennai', state: 'Tamil Nadu', pincode: '600017' },
    documents: {
      aadhar: { number: '1234-5678-9020', verified: true },
      pancard: { number: 'IJKLM1234N', verified: true },
      drivingLicense: { number: 'TN-0220230000001', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  },
  {
    name: 'Mohan Singh',
    phone: '9876543219',
    email: 'mohan.singh@driveease.com',
    personalDetails: {
      address: '741 Sector 8, Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302004',
      bloodGroup: 'A+'
    },
    vehicle: {
      type: 'Renault Kwid',
      model: '2021',
      registrationNumber: 'RJ-01-ST-5678',
      color: 'Blue',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 5, totalRides: 3500 },
    rating: { averageRating: 4.5, totalRatings: 750 },
    languages: ['Hindi', 'English', 'Marwari'],
    serviceAreas: ['Jaipur'],
    status: 'approved',
    isOnline: true,
    currentLocation: { latitude: 26.9124, longitude: 75.7873, city: 'Jaipur', state: 'Rajasthan', pincode: '302004' },
    documents: {
      aadhar: { number: '1234-5678-9021', verified: true },
      pancard: { number: 'JKLMN1234O', verified: true },
      drivingLicense: { number: 'RJ-0220230000001', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  },
  {
    name: 'Arun Verma',
    phone: '9876543220',
    email: 'arun.verma@driveease.com',
    personalDetails: {
      address: '852 Gomti Nagar, Lucknow',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226010',
      bloodGroup: 'B+'
    },
    vehicle: {
      type: 'Datsun Go',
      model: '2020',
      registrationNumber: 'UP-01-UV-9012',
      color: 'White',
      seatCapacity: 5
    },
    experience: { yearsOfExperience: 4, totalRides: 2500 },
    rating: { averageRating: 4.4, totalRatings: 600 },
    languages: ['Hindi', 'English'],
    serviceAreas: ['Lucknow'],
    status: 'approved',
    isOnline: true,
    currentLocation: { latitude: 26.8467, longitude: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010' },
    documents: {
      aadhar: { number: '1234-5678-9022', verified: true },
      pancard: { number: 'KLMNO1234P', verified: true },
      drivingLicense: { number: 'UP-0220230000001', verified: true },
      selfie: { verified: true }
    },
    backgroundVerification: { status: 'verified' },
    training: { etiquetteTraining: true, safetyTraining: true }
  }
];

hardcodedDrivers.forEach(driver => driversData.push(driver));



const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing drivers (fresh start, no demo drivers)
    await Driver.deleteMany({});
    console.log('All drivers purged. System is now fresh.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

// src/utils/mockData.js
export const mockUser = {
  name: 'Akash',
  phone: '+91-9876543210',
};

export const mockActiveRide = {
  driverName: 'Ravi Sharma',
  status: 'On the way',
};

export const mockDrivers = [
  { id: 1, name: 'Ravi Sharma', city: 'Kanpur', status: 'Available' },
  { id: 2, name: 'Sunil Kumar', city: 'Lucknow', status: 'Offline' },
  { id: 3, name: 'Amit Singh', city: 'Kanpur', status: 'Available' },
];

export const mockBookings = [
  { id: 'RIDE123', price: 250, date: '2026-03-28', status: 'Completed' },
  { id: 'RIDE124', price: 180, date: '2026-03-25', status: 'Completed' },
];

export const mockPayments = {
  totalSpent: 430,
  lastPayment: { amount: 250, method: 'UPI' },
};

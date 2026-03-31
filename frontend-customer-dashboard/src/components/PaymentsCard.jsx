import React from 'react';

export default function PaymentsCard({ payments }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-2">Payments</h3>
      <div className="flex flex-col gap-2">
        <div>
          <span className="text-gray-400">Total Spent:</span>
          <span className="ml-2 font-bold text-emerald-400">₹{payments.totalSpent}</span>
        </div>
        <div>
          <span className="text-gray-400">Last Payment:</span>
          <span className="ml-2">₹{payments.lastPayment.amount} ({payments.lastPayment.method})</span>
        </div>
        <div>
          <span className="text-gray-400">Payment Method:</span>
          <span className="ml-2">{payments.lastPayment.method}</span>
        </div>
      </div>
    </div>
  );
}

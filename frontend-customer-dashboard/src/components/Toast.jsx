import React from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition bg-${type === 'success' ? 'emerald-500' : 'red-500'}`}
      role="alert">
      <div className="flex items-center gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-lg">×</button>
      </div>
    </div>
  );
}

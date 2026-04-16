// ✅ Default Location
export const DEFAULT_LOCATION = {
  state: "Uttar Pradesh",
  city: "Kanpur",
  area: "Kalyanpur",
};

// ✅ State Options
export const STATE_OPTIONS = [
  "Uttar Pradesh",
  "Delhi",
  "Maharashtra",
];

// ✅ Cities by State
export const getCitiesByState = (state) => {
  const data = {
    "Uttar Pradesh": ["Kanpur", "Lucknow", "Noida"],
    "Delhi": ["New Delhi", "South Delhi", "Dwarka"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  };

  return data[state] || [];
};

// ✅ Areas by City
export const getAreasByCity = (city) => {
  const data = {
    "Kanpur": ["Kalyanpur", "Rawatpur", "Govind Nagar"],
    "Lucknow": ["Gomti Nagar", "Aliganj", "Hazratganj"],
    "Noida": ["Sector 62", "Sector 18", "Sector 137"],
    "New Delhi": ["Connaught Place", "Karol Bagh"],
    "Mumbai": ["Andheri", "Bandra", "Dadar"],
    "Pune": ["Hinjewadi", "Kothrud", "Wakad"],
  };

  return data[city] || [];
};
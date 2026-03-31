// src/utils/localStorage.js
export function saveUser(user) {
  localStorage.setItem('driveease_user', JSON.stringify(user));
}

export function getUser() {
  const data = localStorage.getItem('driveease_user');
  return data ? JSON.parse(data) : null;
}

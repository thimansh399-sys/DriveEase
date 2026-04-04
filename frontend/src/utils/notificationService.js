// Notification Service - Handles sound and browser notifications
export const playNotificationSound = async () => {
  try {
    // Try to use Web Audio API for notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    // Create pleasant notification beep (two tones) with separate oscillators.
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    const toneOne = audioContext.createOscillator();
    toneOne.connect(gainNode);
    toneOne.frequency.setValueAtTime(800, audioContext.currentTime);
    toneOne.start(audioContext.currentTime);
    toneOne.stop(audioContext.currentTime + 0.1);

    // Second tone
    const toneTwo = audioContext.createOscillator();
    toneTwo.connect(gainNode);
    toneTwo.frequency.setValueAtTime(1000, audioContext.currentTime + 0.15);
    toneTwo.start(audioContext.currentTime + 0.15);
    toneTwo.stop(audioContext.currentTime + 0.25);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

export const sendBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '🚗',
      badge: '🚗',
      ...options
    });
  }
};

export const createToastNotification = (message, type = 'info', duration = 3000) => {
  return {
    id: Date.now(),
    message,
    type, // 'success', 'error', 'warning', 'info'
    duration
  };
};

const notificationService = {
  playNotificationSound,
  requestNotificationPermission,
  sendBrowserNotification,
  createToastNotification
};

export default notificationService;

const playNotifSound = () => {
  const audio = new Audio("/sounds/effects/notif.mp3");
  audio.play();
};

export default playNotifSound;
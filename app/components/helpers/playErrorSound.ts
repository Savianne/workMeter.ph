const playErrorSound = () => {
  const audio = new Audio("/sounds/effects/error.mp3");
  audio.play();
};

export default playErrorSound;
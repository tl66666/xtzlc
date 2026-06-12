const SOUND_ASSETS = {
  tap: '/assets/audio/tap.wav',
  success: '/assets/audio/success.wav',
  unlock: '/assets/audio/unlock.wav'
};

function playSound(name) {
  const src = SOUND_ASSETS[name];
  if (!src || !wx.createInnerAudioContext) return;
  const audio = wx.createInnerAudioContext();
  audio.src = src;
  audio.volume = 0.55;
  audio.onEnded(() => audio.destroy());
  audio.onError(() => audio.destroy());
  audio.play();
}

function playTapFeedback(type = 'light') {
  playSound('tap');
}

module.exports = {
  playSound,
  playTapFeedback,
  SOUND_ASSETS
};

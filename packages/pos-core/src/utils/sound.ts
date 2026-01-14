type SoundType = 'success' | 'error' | 'warning';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const frequencies: Record<SoundType, number[]> = {
  success: [800, 1000],
  error: [300, 200],
  warning: [500, 400],
};

const durations: Record<SoundType, number> = {
  success: 100,
  error: 200,
  warning: 150,
};

export function playSound(type: SoundType): void {
  if (!audioContext) return;

  try {
    const freqs = frequencies[type];
    const duration = durations[type];

    freqs.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration / 1000
      );

      oscillator.start(audioContext.currentTime + (index * duration) / 1000);
      oscillator.stop(audioContext.currentTime + ((index + 1) * duration) / 1000);
    });
  } catch (e) {
    // Audio not supported or blocked
    console.warn('Audio playback failed:', e);
  }
}

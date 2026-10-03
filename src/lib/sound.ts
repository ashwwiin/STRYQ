/**
 * STRYQ In-Gym Haptic & Audio Feedback Engine
 */

export function triggerVibration(pattern: number[] = [100, 50, 100]): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if unsupported or blocked by permissions
    }
  }
}

/**
 * Plays a clean synth beep using the Web Audio API without requiring external audio assets.
 */
export function playRestTimerBeep(type: 'short' | 'long' = 'short'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'long' ? 880 : 587.33, ctx.currentTime); // A5 or D5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'long' ? 0.4 : 0.15));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (type === 'long' ? 0.4 : 0.15));
  } catch {
    // Audio context may be restricted by browser auto-play policies
  }
}

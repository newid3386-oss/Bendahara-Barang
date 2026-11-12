export type FeedbackType =
  | 'click'
  | 'success'
  | 'error'
  | 'scan'
  | 'warning'
  | 'task_success'      // Long, triumphant vibration for task/assignment scan success
  | 'attendance_success'// Crisp double affirmative pulse for student attendance scan
  | 'duplicate_warning' // Rapid, staccato short vibration pulses for duplicate QR scan warning
  | 'scan_error';       // Sharp quick pulses for invalid/mismatched QR code error

export const playFeedback = (type: FeedbackType = 'click') => {
  try {
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('sdn6_qr_mute_feedback') === 'true' &&
      type !== 'warning' &&
      type !== 'duplicate_warning'
    ) {
      return;
    }

    // Physical Device Haptic Feedback via Vibration API with differentiated patterns & intensities
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (type === 'task_success') {
        // Continuous, deep long vibration for successful assignment submission (getaran panjang tugas)
        window.navigator.vibrate([260, 40, 180]);
      } else if (type === 'duplicate_warning') {
        // Fast, staccato rapid pulses for duplicate QR code warning (getaran pendek cepat duplikat)
        window.navigator.vibrate([35, 25, 35, 25, 35, 25, 40]);
      } else if (type === 'scan_error') {
        // Quick sharp jarring double-burst for invalid/mismatched QR
        window.navigator.vibrate([60, 35, 60, 35, 80]);
      } else if (type === 'attendance_success') {
        // Balanced double-tap for attendance check-in
        window.navigator.vibrate([50, 40, 50]);
      } else if (type === 'warning') {
        // Extended attention-grabbing alarm pattern for low battery
        window.navigator.vibrate([150, 100, 150, 100, 250]);
      } else if (type === 'success') {
        // Standard pleasant confirmation pulse
        window.navigator.vibrate([40, 50, 40]);
      } else if (type === 'error') {
        // Standard error buzz
        window.navigator.vibrate([60, 40, 60]);
      } else if (type === 'scan') {
        // Micro-tap scanner feedback
        window.navigator.vibrate([30, 20, 30]);
      } else {
        // Default subtle click micro-haptic
        window.navigator.vibrate(18);
      }
    }

    // Web Audio Synthesizer for rich auditory confirmation matching haptic sensations
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();

      if (type === 'task_success') {
        // Celebratory multi-tone chime (F5 -> A5 -> C6) with lingering harmonic warmth
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
        osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.22); // C6
        gain1.gain.setValueAtTime(0.18, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.55);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.55);

        // Low frequency subwoofer thump simulating heavy haptic resonance
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(120, ctx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
        subGain.gain.setValueAtTime(0.2, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        subOsc.start(ctx.currentTime);
        subOsc.stop(ctx.currentTime + 0.25);
      } else if (type === 'duplicate_warning') {
        // Fast buzzing staccato double-chirp warning buzzer (getaran pendek cepat duplikat)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(370, ctx.currentTime + 0.07);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.14);
        osc.frequency.setValueAtTime(370, ctx.currentTime + 0.21);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'scan_error') {
        // Sharp double descending buzz for invalid QR
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'attendance_success') {
        // Crisp dual chime for student attendance
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.24);
      } else if (type === 'warning') {
        // Distinct, attention-grabbing dual-tone alarm for low battery
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime + 0.16); // C5
        gain1.gain.setValueAtTime(0.18, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.35);

        // Secondary alert pulse
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.38); // G5
        osc2.frequency.setValueAtTime(440.0, ctx.currentTime + 0.52); // A4
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.38);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.72);
        osc2.start(ctx.currentTime + 0.38);
        osc2.stop(ctx.currentTime + 0.72);
      } else if (type === 'scan') {
        // Subtle high-frequency scanner chirp/beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    }
  } catch (e) {
    // Ignore context errors on browsers that block autoplay audio before interaction
  }
};

/**
 * Dedicated audible warning chime specifically for low battery notification
 * Plays a distinct 2-pulse alert sequence accompanied by device haptic vibration
 */
export const playBatteryAlertSound = () => {
  playFeedback('warning');
};

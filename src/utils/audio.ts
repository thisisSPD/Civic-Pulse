/**
 * High-End Web Audio API Synthesizer for CivicPulse
 * Generates beautiful, custom client-side synthesized sounds offline.
 * Zero external asset dependencies to prevent asset loading failures.
 */

let audioCtx: AudioContext | null = null;
let ambientGainNode: GainNode | null = null;
let ambientOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let isAmbientPlaying = false;
let melodyInterval: any = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

/**
 * Plays a warm, organic, high-end acoustic pluck sound for button clicks.
 * Uses a dual-sine pluck with frequency decay to sound like an elegant wooden key.
 */
export function playClickSound() {
  try {
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // Primary Pluck (Fundamental)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    // Secondary Harmonic (adds warmth/crystal bell character)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();

    // Low-pass Filter for smoothness
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    osc1.type = "sine";
    osc2.type = "sine";

    // Dynamic pitch sweep (starts high, decays fast)
    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    osc2.frequency.setValueAtTime(880, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.1);

    // Exponential volume envelope for natural pluck decay
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(filter);
    gain2.connect(filter);
    
    filter.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.18);
    osc2.stop(now + 0.1);
  } catch (err) {
    console.warn("Click sound failed to play:", err);
  }
}

/**
 * Starts a gentle, slow-pulsing background drone (light atmospheric hum).
 * Combines low-frequency harmonics with tiny LFO modulations for an immersive, high-end feel.
 */
export function startAmbientDrone() {
  try {
    if (isAmbientPlaying) return;
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    isAmbientPlaying = true;

    // Master volume control for ambient track
    ambientGainNode = audioCtx.createGain();
    ambientGainNode.gain.setValueAtTime(0, now);
    // Smoothly fade-in ambient drone to avoid shocking the user
    ambientGainNode.gain.linearRampToValueAtTime(0.05, now + 2.5);

    // Warm Low-Pass filter to keep the hum deeply soothing
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);

    // Create 3 slow pulsing oscillators (harmonics of a beautiful low A chord)
    const frequencies = [110, 165, 220]; // A2, E3, A3
    
    ambientOscillators = frequencies.map((freq, index) => {
      if (!audioCtx) throw new Error("Audio Context missing");
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      // Create a slow volume breathing cycle (LFO effect) unique to each harmonic
      const rate = 0.1 + index * 0.05; // 0.1Hz, 0.15Hz, 0.2Hz
      const lfoAmp = 0.02 + index * 0.01;
      
      gain.gain.setValueAtTime(lfoAmp, now);
      
      // Simulate slow breathing volume modulation
      let direction = 1;
      const interval = setInterval(() => {
        try {
          if (!audioCtx || !isAmbientPlaying) {
            clearInterval(interval);
            return;
          }
          const t = audioCtx.currentTime;
          const targetVol = lfoAmp * (1 + 0.4 * direction);
          gain.gain.linearRampToValueAtTime(targetVol, t + 3.0);
          direction *= -1;
        } catch {
          clearInterval(interval);
        }
      }, 3000);

      osc.connect(gain);
      gain.connect(filter);
      
      osc.start(now);

      return { osc, gain };
    });

    filter.connect(ambientGainNode);
    ambientGainNode.connect(audioCtx.destination);

    // Soft ambient music player (pentatonic melody generator)
    if (melodyInterval) {
      clearInterval(melodyInterval);
    }
    const pentatonic = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // A3, C4, D4, E4, G4, A4, C5
    melodyInterval = setInterval(() => {
      try {
        if (!audioCtx || !isAmbientPlaying) {
          if (melodyInterval) {
            clearInterval(melodyInterval);
            melodyInterval = null;
          }
          return;
        }
        const t = audioCtx.currentTime;
        
        // Pick a note and play it with very soft attack and long delay
        if (Math.random() > 0.25) {
          const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.015, t + 1.2); // Extremely soft, soothing attack
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 5.5); // long gorgeous sustain release
          
          // Add delay node for dreaminess
          const delayNode = audioCtx.createDelay();
          delayNode.delayTime.setValueAtTime(0.6, t);
          const feedbackNode = audioCtx.createGain();
          feedbackNode.gain.setValueAtTime(0.3, t);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          gain.connect(delayNode);
          delayNode.connect(feedbackNode);
          feedbackNode.connect(delayNode);
          delayNode.connect(audioCtx.destination);
          
          osc.start(t);
          osc.stop(t + 6.0);
        }
      } catch (err) {
        console.warn("Melody generator failed:", err);
      }
    }, 4000);
  } catch (err) {
    console.warn("Ambient drone failed to start:", err);
  }
}

/**
 * Stop or fade out the ambient drone.
 */
export function stopAmbientDrone() {
  if (!isAmbientPlaying) return;
  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }
  try {
    if (audioCtx && ambientGainNode) {
      const now = audioCtx.currentTime;
      ambientGainNode.gain.cancelScheduledValues(now);
      ambientGainNode.gain.setValueAtTime(ambientGainNode.gain.value, now);
      ambientGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      
      setTimeout(() => {
        try {
          ambientOscillators.forEach((item) => {
            try {
              item.osc.stop();
            } catch {}
          });
          ambientOscillators = [];
          isAmbientPlaying = false;
        } catch {}
      }, 1100);
    } else {
      isAmbientPlaying = false;
    }
  } catch (err) {
    console.warn("Failed to stop ambient drone:", err);
    isAmbientPlaying = false;
  }
}

/**
 * Returns current ambient play status.
 */
export function isAmbientRunning() {
  return isAmbientPlaying;
}

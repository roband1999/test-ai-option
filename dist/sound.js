export function createLaserPreset(variant = 0) {
  const presets = [
    { startFrequency: 920, endFrequency: 180, duration: 0.24, vibratoDepth: 20, vibratoRate: 24, gain: 0.28 },
    { startFrequency: 780, endFrequency: 120, duration: 0.2, vibratoDepth: 28, vibratoRate: 19, gain: 0.24 },
    { startFrequency: 1100, endFrequency: 260, duration: 0.3, vibratoDepth: 14, vibratoRate: 31, gain: 0.26 },
    { startFrequency: 860, endFrequency: 90, duration: 0.34, vibratoDepth: 34, vibratoRate: 16, gain: 0.3 }
  ];

  return presets[Math.abs(variant) % presets.length];
}

export function buildLaserEnvelope(preset) {
  const attack = 0.005;
  const body = Math.max(preset.duration - attack, 0.02);

  return {
    attack,
    body,
    release: preset.duration
  };
}

export function playLaserSound(audioContext, variant = 0) {
  if (!audioContext) {
    return null;
  }

  const preset = createLaserPreset(variant);
  const envelope = buildLaserEnvelope(preset);
  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(preset.startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(preset.endFrequency, now + preset.duration);

  const vibrato = audioContext.createOscillator();
  vibrato.type = "triangle";
  vibrato.frequency.setValueAtTime(preset.vibratoRate, now);

  const vibratoGain = audioContext.createGain();
  vibratoGain.gain.setValueAtTime(preset.vibratoDepth, now);

  const output = audioContext.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.linearRampToValueAtTime(preset.gain, now + envelope.attack);
  output.gain.exponentialRampToValueAtTime(0.0001, now + envelope.release);

  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(3.5, now);

  vibrato.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);
  oscillator.connect(filter);
  filter.connect(output);
  output.connect(audioContext.destination);

  oscillator.start(now);
  vibrato.start(now);
  oscillator.stop(now + envelope.release);
  vibrato.stop(now + envelope.release);

  return {
    oscillator,
    output,
    preset
  };
}

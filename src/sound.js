export function createFartPreset(variant = 0) {
  const presets = [
    { startFrequency: 180, endFrequency: 56, duration: 0.42, wobbleDepth: 18, wobbleRate: 9, gain: 0.2, raspGain: 0.1 },
    { startFrequency: 150, endFrequency: 48, duration: 0.5, wobbleDepth: 14, wobbleRate: 7, gain: 0.22, raspGain: 0.12 },
    { startFrequency: 210, endFrequency: 62, duration: 0.38, wobbleDepth: 20, wobbleRate: 11, gain: 0.18, raspGain: 0.08 },
    { startFrequency: 132, endFrequency: 42, duration: 0.56, wobbleDepth: 16, wobbleRate: 6, gain: 0.24, raspGain: 0.14 }
  ];

  return presets[Math.abs(variant) % presets.length];
}

export function buildFartEnvelope(preset) {
  const attack = 0.01;
  const hold = Math.max(preset.duration * 0.28, 0.08);
  const release = Math.max(preset.duration - attack, 0.2);

  return {
    attack,
    hold,
    release
  };
}

export function playFartSound(audioContext, variant = 0) {
  if (!audioContext) {
    return null;
  }

  const preset = createFartPreset(variant);
  const envelope = buildFartEnvelope(preset);
  const now = audioContext.currentTime;
  const stopTime = now + envelope.release;

  const bodyOscillator = audioContext.createOscillator();
  bodyOscillator.type = "sawtooth";
  bodyOscillator.frequency.setValueAtTime(preset.startFrequency, now);
  bodyOscillator.frequency.exponentialRampToValueAtTime(preset.endFrequency, stopTime);

  const subOscillator = audioContext.createOscillator();
  subOscillator.type = "triangle";
  subOscillator.frequency.setValueAtTime(Math.max(preset.startFrequency * 0.5, 32), now);
  subOscillator.frequency.exponentialRampToValueAtTime(Math.max(preset.endFrequency * 0.55, 24), stopTime);

  const wobble = audioContext.createOscillator();
  wobble.type = "sine";
  wobble.frequency.setValueAtTime(preset.wobbleRate, now);

  const wobbleGain = audioContext.createGain();
  wobbleGain.gain.setValueAtTime(preset.wobbleDepth, now);

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(240, stopTime);
  filter.Q.setValueAtTime(1.2, now);

  const raspFilter = audioContext.createBiquadFilter();
  raspFilter.type = "bandpass";
  raspFilter.frequency.setValueAtTime(420, now);
  raspFilter.Q.setValueAtTime(2.8, now);

  const output = audioContext.createGain();
  output.gain.setValueAtTime(0.0001, now);
  output.gain.linearRampToValueAtTime(preset.gain, now + envelope.attack);
  output.gain.setValueAtTime(preset.gain * 0.88, now + envelope.hold);
  output.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  const rasp = audioContext.createGain();
  rasp.gain.setValueAtTime(0.0001, now);
  rasp.gain.linearRampToValueAtTime(preset.raspGain, now + envelope.attack * 2);
  rasp.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  wobble.connect(wobbleGain);
  wobbleGain.connect(bodyOscillator.frequency);
  bodyOscillator.connect(filter);
  filter.connect(output);
  subOscillator.connect(output);
  bodyOscillator.connect(raspFilter);
  raspFilter.connect(rasp);
  output.connect(audioContext.destination);
  rasp.connect(audioContext.destination);

  bodyOscillator.start(now);
  subOscillator.start(now);
  wobble.start(now);
  bodyOscillator.stop(stopTime);
  subOscillator.stop(stopTime);
  wobble.stop(stopTime);

  return {
    bodyOscillator,
    subOscillator,
    output,
    rasp,
    preset
  };
}

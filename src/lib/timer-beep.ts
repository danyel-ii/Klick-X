let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

export async function unlockTimerBeep() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") await context.resume().catch(() => undefined);
}

export async function playTimerBeep() {
  const context = getAudioContext();
  if (!context) return;
  await unlockTimerBeep();
  if (context.state !== "running") return;

  const startedAt = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startedAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.7);
  gain.connect(context.destination);

  for (const [index, frequency] of [660, 880].entries()) {
    const oscillator = context.createOscillator();
    const offset = index * 0.22;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startedAt + offset);
    oscillator.connect(gain);
    oscillator.start(startedAt + offset);
    oscillator.stop(startedAt + offset + 0.18);
  }

  window.setTimeout(() => gain.disconnect(), 900);
}

let audioCtx = null;
let audioMuted = false;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function toggleAudioMuted() {
  audioMuted = !audioMuted;
  applyMusicMuteState();
  return audioMuted;
}

const MUSIC_SRC = {
  menu: "audio/menu.mp3",
  camp: "audio/camp.mp3",
  city: "audio/city.mp3",
  tavern: "audio/tavern.mp3",
  dungeon: "audio/dungeon.mp3",
  battle: "audio/battle.mp3",
  boss: "audio/boss.mp3",
  corruption: "audio/corruption.mp3",
};

const MUSIC_FADE_MS = 900;
const MUSIC_VOLUME_STORAGE_KEY = "raj_music_volume";

let musicVolume = (() => {
  const stored = parseFloat(localStorage.getItem(MUSIC_VOLUME_STORAGE_KEY));
  return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : 0.45;
})();
let currentMusicKey = null;
let currentMusicEl = null;

function musicEffectiveVolume() {
  return audioMuted ? 0 : musicVolume;
}

function fadeMusicElement(el, toVolume, durationMs, onDone) {
  clearInterval(el._fadeInterval);
  const steps = 18;
  const stepMs = durationMs / steps;
  const fromVolume = el.volume;
  let step = 0;
  el._fadeInterval = setInterval(() => {
    step++;
    const t = step / steps;
    el.volume = fromVolume + (toVolume - fromVolume) * t;
    if (step >= steps) {
      clearInterval(el._fadeInterval);
      el.volume = toVolume;
      if (onDone) onDone();
    }
  }, stepMs);
}

function playMusicKey(key) {
  const src = MUSIC_SRC[key];
  if (!src || key === currentMusicKey) return;
  currentMusicKey = key;

  const prevEl = currentMusicEl;
  const nextEl = new Audio(src);
  nextEl.loop = true;
  nextEl.volume = 0;
  nextEl.play().catch(() => {});
  currentMusicEl = nextEl;

  fadeMusicElement(nextEl, musicEffectiveVolume(), MUSIC_FADE_MS);
  if (prevEl) {
    fadeMusicElement(prevEl, 0, MUSIC_FADE_MS, () => prevEl.pause());
  }
}

function setMusicVolume(v) {
  musicVolume = Math.min(1, Math.max(0, v));
  localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, String(musicVolume));
  if (currentMusicEl) currentMusicEl.volume = musicEffectiveVolume();
}

function applyMusicMuteState() {
  if (currentMusicEl) currentMusicEl.volume = musicEffectiveVolume();
}

function unlockMusicPlayback() {
  if (currentMusicEl && currentMusicEl.paused) currentMusicEl.play().catch(() => {});
}
document.addEventListener("pointerdown", unlockMusicPlayback, { once: true });
document.addEventListener("keydown", unlockMusicPlayback, { once: true });

function playTone({ freq, duration, type = "sine", volume = 0.2, freqEnd = null }) {
  if (audioMuted) return;
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoiseBurst({ duration, volume = 0.2, filterFreq = 1000 }) {
  if (audioMuted) return;
  const ctx = getAudioCtx();
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + duration);
}

function playHitSound(isCrit) {
  if (isCrit) {
    playTone({ freq: 220, freqEnd: 70, duration: 0.28, type: "sawtooth", volume: 0.22 });
    playNoiseBurst({ duration: 0.18, volume: 0.28, filterFreq: 2200 });
  } else {
    playTone({ freq: 150, freqEnd: 55, duration: 0.15, type: "triangle", volume: 0.18 });
    playNoiseBurst({ duration: 0.08, volume: 0.18, filterFreq: 1200 });
  }
}

function playMissSound() {
  playTone({ freq: 500, freqEnd: 850, duration: 0.12, type: "sine", volume: 0.06 });
}

function playSpellCastSound() {
  playTone({ freq: 260, freqEnd: 950, duration: 0.28, type: "sine", volume: 0.14 });
}

function playSpellImpactSound() {
  playTone({ freq: 500, freqEnd: 90, duration: 0.3, type: "square", volume: 0.16 });
  playNoiseBurst({ duration: 0.2, volume: 0.2, filterFreq: 3000 });
}

function playDeathSound() {
  playTone({ freq: 320, freqEnd: 35, duration: 0.6, type: "sawtooth", volume: 0.18 });
}

function playMoveSound() {
  playTone({ freq: 200, freqEnd: 250, duration: 0.07, type: "sine", volume: 0.04 });
}

function playWeaponSwitchSound() {
  playTone({ freq: 400, freqEnd: 600, duration: 0.1, type: "square", volume: 0.08 });
}

function playVictorySound() {
  playTone({ freq: 440, freqEnd: 880, duration: 0.5, type: "sine", volume: 0.16 });
}

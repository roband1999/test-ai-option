import { playLaserSound } from "./sound.js";

let audioContext;

const buttons = document.querySelectorAll("[data-laser-variant]");

buttons.forEach((button) => {
  button.addEventListener("click", async () => {
    const context = await getAudioContext();
    const variant = Number(button.dataset.laserVariant || 0);
    playLaserSound(context, variant);
  });
});

async function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
}

import { playFartSound } from "./sound.js";

let audioContext;

const buttons = document.querySelectorAll("[data-sound-variant]");

buttons.forEach((button) => {
  button.addEventListener("click", async () => {
    const context = await getAudioContext();
    const variant = Number(button.dataset.soundVariant || 0);
    playFartSound(context, variant);
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

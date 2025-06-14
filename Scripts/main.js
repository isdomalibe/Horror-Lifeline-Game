// Reset cinematic flag so intro plays again
localStorage.removeItem("hasPlayed");


/* Glitch title sound*/
document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".glitch-title");
  const glitchSound = new Audio("/Assets/audio/Glitch Sound Effect (Speaker).mp3");
  glitchSound.volume = 0.1; 

  
  setInterval(() => {
    title.classList.remove("flicker");
    void title.offsetWidth; // force reflow to retrigger animation
    title.classList.add("flicker");

    glitchSound.currentTime = 0;
    glitchSound.play();
  }, 3000);
});


/* TYPING ANIMATION*/
document.addEventListener("DOMContentLoaded", async () => {
  const introEl = document.getElementById("intro-text");
  const howToEl = document.getElementById("how-to-play");
  const startBtn = document.getElementById("start-btn");

  /* 🔒 Prevent click if still disabled*/
  startBtn.addEventListener("click", (e) => {
    if (startBtn.classList.contains("disabled")) {
      e.preventDefault(); // Block navigation
    }
  });



  const introText = `
You have been selected for an experimental behavior assessment.
This simulation will observe your decisions under pressure.
Please remain calm. Please do not trust what you see.
  `;

  const howToText = `
How to Play:
- Read each situation carefully.
- Choose one of the two options.
- Some rules will help you. Some will betray you.
- You may only go back one step.
- Survive 15 decisions without being detected.
  `;


  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch("/Assets/audio/typing_click.mp3");
  const audioData = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(audioData);

  function playClick() {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.05; 
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
  }

  function typeText(text, element, speed = 30, callback) {
    let i = 0;
    function typeNextChar() {
      if (i < text.length) {
        const char = text.charAt(i);
        element.innerHTML += char === "\n" ? "<br>" : char;
        if (char !== " " && char !== "\n") {
          playClick();
        }
        i++;
        setTimeout(typeNextChar, speed);
      } else if (callback) {
        callback();
      }
    }
    typeNextChar();
  }

  // Start typing intro, then how-to-play
  typeText(introText, introEl, 30, () => {
    setTimeout(() => {
      typeText(howToText, howToEl, 25);
      document.getElementById("start-btn").classList.remove("disabled");

    }, 500);
  });
});




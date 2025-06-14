// Block browser back/forward buttons
window.history.pushState(null, "", window.location.href);
window.addEventListener("popstate", function () {
  window.history.pushState(null, "", window.location.href);
});

let undoUsed = false;
let audioCtx;
let typingBuffer;
let audioUnlocked = false;
let gameStarted = false;
let currentSceneId = "scene_loading";
let previousSceneId = null;

const sceneContainer = document.getElementById("scene-text");
const choiceButtons = document.getElementById("choices");
const undoButton = document.getElementById("undo-button");
const restartButton = document.getElementById("restart-button");
const background = document.getElementById("background");
const gameContainer = document.getElementById("game-container");
let sceneAudio = new Audio();
sceneAudio.volume = 0.6;
sceneAudio.loop = true; // Most ambient sounds should loop

/* SCENES */
const scenes = {
  scene_normal_classroom: {
    text: "",
    background: "url('/Assets/images/normal_classroom/normal_classroom.png')",
    delay: 4000,
    next: "scene_start"
  },
  scene_start: {
    text: "You open your eyes.\nYou're in your classroom — or something trying to *be* your classroom.\nEveryone is perfectly still. The clock’s second hand is frozen.",
    background: "url('/Assets/images/scene_start/creepy_classroom.png')",
    choices: [
      { text: "Pretend to still be asleep", next: "scene_2", correct: true },
      { text: "Sit up and look around", next: "bad_1", correct: false }
    ]
  },
  scene_2: {
    text: "The fire alarm rings. Nobody reacts.",
    background: "url('/Assets/images/scene_2/fire_alarm.png')",
    choices: [
      { text: "Stay frozen and listen", next: "scene_3", correct: true },
      { text: "Run to the door", next: "bad_2", correct: false }
    ]
  },
  scene_3: {
    text: "A shadowy teacher calls roll call with names that aren't yours.",
    background: "url('/Assets/images/scene_3/shadow_teacher.png')",
    choices: [
      { text: "Stay silent", next: "scene_4", correct: true },
      { text: "Say your real name", next: "bad_3", correct: false }
    ]
  },
  scene_4: {
    text: "The teacher asks you a question but stares directly into your mind.",
    background: "url('/Assets/images/scene_4/mind_probe.png')",
    choices: [
      { text: "Don't answer", next: "scene_5", correct: true },
      { text: "Answer anything", next: "bad_4", correct: false }
    ]
  },
  scene_5: {
    text: "A girl next to you starts crying blood.",
    background: "url('/Assets/images/scene_5/crying_blood.png')",
    choices: [
      { text: "Ask if she’s okay", next: "scene_6", correct: true },
      { text: "Stay still and ignore it", next: "bad_5", correct: false }
    ]
  },
  scene_6: {
    text: "A second version of you walks in.",
    background: "url('/Assets/images/scene_6/doppelganger.png')",
    choices: [
      { text: "Stand up and confront them", next: "scene_7", correct: true },
      { text: "Stay seated and observe", next: "bad_6", correct: false }
    ]
  },
  scene_7: {
    text: "The other you says \"Come with me if you want to wake up.\"",
    background: "url('/Assets/images/scene_7/offer_escape.png')",
    choices: [
      { text: "Say no", next: "scene_8", correct: true },
      { text: "Go with him", next: "bad_7", correct: false }
    ]
  },
  scene_8: {
    text: "You see a flash of your house, then you’re back in class.",
    background: "url('/Assets/images/scene_8/flash_home.png')",
    choices: [
      { text: "Write 'home' on the desk", next: "scene_9", correct: true },
      { text: "Say 'is this real?'", next: "bad_8", correct: false }
    ]
  },
  scene_9: {
    text: "The clock starts ticking backward.",
    background: "url('/Assets/images/scene_9/reverse_clock.png')",
    choices: [
      { text: "Rip the clock off the wall", next: "scene_10", correct: true },
      { text: "Watch it quietly", next: "bad_9", correct: false }
    ]
  },
  scene_10: {
    text: "The lights go out. A voice whispers your name.",
    background: "url('/Assets/images/scene_10/whisper_dark.png')",
    choices: [
      { text: "Whisper back: 'Who are you?'", next: "scene_11", correct: true },
      { text: "Stay silent", next: "bad_10", correct: false }
    ]
  },
  scene_11: {
    text: "You’re offered a pill: red or black.",
    background: "url('/Assets/images/scene_11/pill_choice.png')",
    choices: [
      { text: "Take black pill", next: "scene_12", correct: true },
      { text: "Take red pill", next: "bad_11", correct: false }
    ]
  },
  scene_12: {
    text: "You’re in a hallway of locked doors.",
    background: "url('/Assets/images/scene_12/locked_hallway.png')",
    choices: [
      { text: "Knock on the third door", next: "scene_13", correct: true },
      { text: "Open the nearest door", next: "bad_12", correct: false }
    ]
  },
  scene_13: {
    text: "A figure says: ‘You shouldn’t have come this far.’",
    background: "url('/Assets/images/scene_13/final_warning.png')",
    choices: [
      { text: "Say 'I had no choice'", next: "scene_14", correct: true },
      { text: "Apologize", next: "bad_13", correct: false }
    ]
  },
  scene_14: {
    text: "You're told you're in a simulation.",
    background: "url('/Assets/images/scene_14/simulation_reveal.png')",
    choices: [
      { text: "Say 'Then let me out.'", next: "scene_15", correct: true },
      { text: "Say 'This isn’t real.'", next: "bad_14", correct: false }
    ]
  },
  scene_15: {
    text: "A screen shows a choice: END SIMULATION or STAY.",
    background: "url('/Assets/images/scene_15/end_screen.png')",
    choices: [
      { text: "End Simulation", next: "true_ending", correct: true },
      { text: "Stay", next: "bad_15", correct: false }
    ]
  },
   true_ending: {
    text: "You chose to end it. The screen fades. You wake up. Or do you?",
    background: "url('/Assets/images/true_ending/true_ending.png')",
    choices: []
  },
  /* SCENES */


  /* BAD ENDINGS */
  bad_1: { text: "Everyone turns to look at you at once.", background: "url('/Assets/images/bad_endings/bad1.png')", choices: [] },
  bad_2: { text: "The door melts as you reach it. You're trapped.", background: "url('/Assets/images/bad_endings/bad2.png')", choices: [] },
  bad_3: { text: "The teacher calls your name last. Then your heart stops.", background: "url('/Assets/images/bad_endings/bad3.png')", choices: [] },
  bad_4: { text: "Your voice echoes forever. You never stop speaking.", background: "url('/Assets/images/bad_endings/bad4.png')", choices: [] },
  bad_5: { text: "She looks at you. Now your eyes bleed too.", background: "url('/Assets/images/bad_endings/bad5.png')", choices: [] },
  bad_6: { text: "The other you takes your place. You're erased.", background: "url('/Assets/images/bad_endings/bad6.png')", choices: [] },
  bad_7: { text: "You walk with him. Then you forget who you were.", background: "url('/Assets/images/bad_endings/bad7.png')", choices: [] },
  bad_8: { text: "The classroom laughs at you. You can't speak anymore.", background: "url('/Assets/images/bad_endings/bad8.png')", choices: [] },
  bad_9: { text: "The clock reaches zero. Time stops for you alone.", background: "url('/Assets/images/bad_endings/bad9.png')", choices: [] },
  bad_10: { text: "The whisper grows louder until it fills your mind.", background: "url('/Assets/images/bad_endings/bad10.png')", choices: [] },
  bad_11: { text: "The red pill burns your mouth. You fall endlessly.", background: "url('/Assets/images/bad_endings/bad11.png')", choices: [] },
  bad_12: { text: "The door opens to darkness. It pulls you in.", background: "url('/Assets/images/bad_endings/bad12.png')", choices: [] },
  bad_13: { text: "The figure sighs. You’re deleted from memory.", background: "url('/Assets/images/bad_endings/bad13.png')", choices: [] },
  bad_14: { text: "The room shatters. You fall through the void.", background: "url('/Assets/images/bad_endings/bad14.png')", choices: [] },
  bad_15: { text: "You chose to stay. The simulation resets — without you.", background: "url('/Assets/images/bad_endings/bad15.png')", choices: [] }
};
/* BAD ENDINGS */


/* SOUNDS FOR SCENES */
const sceneSounds = {
  scene_start: "/Assets/audio/scene_1/scene1_combined_final.mp3",
  scene_2: "/Assets/audio/scene_2/fire_alarm_simulation.mp3", // Example placeholder
  scene_3: "/Assets/audio/scene_3/scene3_whispers_rollcall.mp3",
  scene_4: "/Assets/audio/scene_4/scene4_droning_heartbeat.mp3",
  scene_5: "/Assets/audio/scene_5/scene5_mixed_final.mp3",
  scene_6: "/Assets/audio/scene_6/footsteps-stairs-slow-106711.mp3",
  scene_7: "/Assets/audio/scene_7/scene7_coldwind_whispers_softer.mp3",
  scene_8: "/Assets/audio/scene_8/scene8_dreamy_glitch.mp3",
  scene_9: "/Assets/audio/scene_9/scene9_reverse_tick_tock_improved.mp3",
  scene_10: "/Assets/audio/scene_10/scene10_final_mixed_whisper_wind.mp3",
  scene_11: "/Assets/audio/scene_11/scene11_sci_fi_pill_build_up.mp3",
  scene_12: "/Assets/audio/scene_12/scene12_hallway_wind_bangs_rattles.mp3",
  scene_13: "/Assets/audio/scene_13/horror-rumble-winds-253834.mp3",
  scene_14: "/Assets/audio/scene_14/scene14_digital_distortion_longer.mp3",
  scene_15: "/Assets/audio/scene_15/scene15_glitchy_hum_countdown_beep.mp3",
  true_ending: "/Assets/audio/true_ending/true_ending_glitchy_hum_pulse.mp3",
  /* SOUNDS FOR SCENES */

  /* BAD ENDING */
  bad_1: "/Assets/audio/bad_ending1/bad_1_headturn_whispers.mp3",
  bad_2: "/Assets/audio/bad_ending2/bad_2_melting_slam.mp3",
  bad_3: "/Assets/audio/bad_ending3/bad_3_rollcall_thump_silence.mp3",
  bad_4: "/Assets/audio/bad_ending4/bad_4_voice_echo_loop_reverb.mp3",
  bad_5: "/Assets/audio/bad_ending5/Water Blood Dripping SOUND EFFECT",
  bad_6: "/Assets/audio/bad_ending6/heartbeat_effect_scene.mp3",
  bad_7: "/Assets/audio/bad_ending7/bad_ending_6_mix.mp3",
  bad_8: "/Assets/audio/bad_ending8/uncanny_student_laugh_extreme.mp3",
  bad_9: "/Assets/audio/bad_ending9/Spooky Clock Ticking Sound Effect.mp3",
  bad_10: "/Assets/audio/bad_ending10/Four Voices Whispering _ Horror Film Sound Effects.mp3",
  bad_11: "/Assets/audio/bad_ending11/uncanny_falling_scream_quieter.mp3",
  bad_12: "/Assets/audio/bad_ending12/bad_ending_12_mixed.mp3",
  bad_13: "/Assets/audio/bad_ending13/glitch_uncanny_valley_v2.mp3",
  bad_14: "/Assets/audio/bad_ending14/bad_ending_14_void_chaos_mix.mp3",
  bad_15: "/Assets/audio/bad_ending15/Fail Sound Effect.mp3"
};
 /* BAD ENDING */

 

async function initTypingSound() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch("/Assets/audio/typing_click.mp3");
  const audioData = await response.arrayBuffer();
  typingBuffer = await audioCtx.decodeAudioData(audioData);
}

async function unlockAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch("/Assets/audio/typing_click.mp3");
  const audioData = await response.arrayBuffer();
  typingBuffer = await audioCtx.decodeAudioData(audioData);
}


function playTypingSound() {
  if (!typingBuffer || !audioCtx) return;
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.04;
  source.buffer = typingBuffer;
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
}


function typeTextWithSound(text, container, callback) {
  let index = 0;
  container.innerHTML = "";

  function typeNextChar() {
    if (index < text.length) {
      const char = text.charAt(index);
      container.innerHTML += char === "\n" ? "<br>" : char;
      if (char !== " " && char !== "\n") {
        playTypingSound();
      }
      index++;
      setTimeout(typeNextChar, 40);
    } else if (callback) {
      callback();
    }
  }

  typeNextChar();
}


function renderScene(id) {
  const scene = scenes[id];
  if (!scene) return;
  gameStarted = true;
  currentSceneId = id;
  
  if (id === "scene_normal_classroom") {
    gameContainer.style.display = "none";
  } else {
    gameContainer.style.display = "block";
  }

  // Fade out everything
  background.classList.add("fade-out");
  sceneContainer.classList.add("fade-out");
  choiceButtons.classList.add("fade-out");

  setTimeout(() => {

    // Stop previous sound
sceneAudio.pause();
sceneAudio.currentTime = 0;

// Load and play new scene sound
if (sceneSounds[id]) {
  sceneAudio.src = sceneSounds[id];
  sceneAudio.play().catch(err => console.warn("Audio play failed:", err));
}

    // Change background and text during fade-out
    background.style.backgroundImage = scene.background;
    if (id === "bad_14") {
      background.classList.add("earthquake");
      sceneContainer.classList.add("earthquake");
    } else {
      background.classList.remove("earthquake");
    }
    sceneContainer.style.display = scene.text ? "block" : "none";

    // Clear and rebuild choices
    choiceButtons.innerHTML = "";
    choiceButtons.style.display = "none"; // Hide initially
    
    if (scene.choices && scene.choices.length > 0) {
      const randomizedOrder = Math.random() < 0.5
        ? [...scene.choices]
        : [...scene.choices].reverse(); // Only reverses visual order
    
      randomizedOrder.forEach((choice, index) => {
        const btn = document.createElement("button");
        btn.textContent = choice.text;
        btn.onclick = () => handleChoice(choice, id);
        btn.classList.add("choice-button");
        btn.style.setProperty('--delay', `${index * 0.2}s`);
        choiceButtons.appendChild(btn);
      });
    
      // Reveal choices after typing is done
      typeTextWithSound(scene.text, sceneContainer, () => {
        choiceButtons.style.display = "block";
      });
    } else {
      // No choices? Just type the text.
      typeTextWithSound(scene.text, sceneContainer);
    }
    
    
    // Reset animation classes
    sceneContainer.classList.remove("flicker", "floating");
    choiceButtons.classList.remove("floating");
    void sceneContainer.offsetWidth; 

    if (id === "scene_start") {
      sceneContainer.classList.add("flicker", "floating");
      choiceButtons.classList.add("floating");
    }

    // Fade back in
    background.classList.remove("fade-out");
    sceneContainer.classList.remove("fade-out");
    choiceButtons.classList.remove("fade-out");

    background.classList.add("fade-in");
    sceneContainer.classList.add("fade-in");
    choiceButtons.classList.add("fade-in");

   
    setTimeout(() => {
      background.classList.remove("fade-in");
      sceneContainer.classList.remove("fade-in");
      choiceButtons.classList.remove("fade-in");
    }, 800);

    // Handle delay logic for automatic transitions
    if (scene.delay && scene.next) {
      setTimeout(() => {
        if (id === "scene_normal_classroom" && scene.next === "scene_start") {
          triggerBlink(() => renderScene(scene.next));
        } else {
          renderScene(scene.next);
        }
      }, scene.delay);
      return;
    }

    // undo/restart visibility
    const banner = document.getElementById("bad-ending-banner");

if (id.startsWith("bad_")) {
  banner.classList.add("show");

  if (!undoUsed) {
    undoButton.style.display = "inline-block";
    restartButton.style.display = "none";
  } else {
    undoButton.style.display = "none";
    restartButton.style.display = "inline-block";
  }
} else {
  banner.classList.remove("show");

  if (id === "true_ending") {
    undoButton.style.display = "none";
    restartButton.style.display = "inline-block";
  } else {
    undoButton.style.display = "none";
    restartButton.style.display = undoUsed ? "inline-block" : "none";
  }
}


  }, 300); 
}


function handleChoice(choice, fromId) {
  previousSceneId = fromId;
  const nextId = choice.next;
  const nextScene = scenes[nextId];

  // Safely play click sound
  try {
    clickSound.currentTime = 0;
    clickSound.play();
  } catch (err) {
    console.warn("Click sound failed:", err);
  }


  if (nextScene.delay) {
    sceneContainer.textContent = nextScene.text;
    background.style.backgroundImage = nextScene.background;

    setTimeout(() => {
      if (fromId === "scene_loading") {
        document.getElementById("loading-screen").classList.add("hidden");
      }
      renderScene(nextScene.next);
    }, nextScene.delay);
  } else {
    renderScene(nextId);
  }
}




undoButton.onclick = () => {
  if (!undoUsed && previousSceneId) {
    undoUsed = true;
    renderScene(previousSceneId);
    undoButton.style.display = "none";
    restartButton.style.display = "inline-block";
  }
};

restartButton.onclick = () => {
  window.location.reload();
};

window.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading-screen");

  setTimeout(() => {
    loadingScreen.classList.add("hidden");
    renderScene("scene_normal_classroom");
  }, 3000);
});

document.addEventListener("click", (e) => {
  if (!audioUnlocked) {
    initTypingSound();
    audioUnlocked = true;
  }
});




const hoverSound = document.getElementById("hover-sound");
const clickSound = document.getElementById("click-sound");

hoverSound.volume = 0.3;
clickSound.volume = 0.5;


document.addEventListener("mouseover", (e) => {
  if (e.target.tagName === "BUTTON") {
    hoverSound.currentTime = 0;
    hoverSound.play();
  }
});


function triggerBlink(callback) {
  const fadeOverlay = document.getElementById("fade-overlay");

  // Fade to black
  fadeOverlay.classList.add("fade-in");

  setTimeout(() => {
    callback(); 

    // Fade back in
    fadeOverlay.classList.remove("fade-in");
  }, 2000);
}

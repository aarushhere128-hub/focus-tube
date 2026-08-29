const STORAGE_KEY = "focustube_state";
const COOLDOWN_MS = 30 * 60 * 1000;

const AI_API_URL =
  "https://focustube-api.aarushhere128.workers.dev/";

let state = loadState();
let timerInterval = null;


// ===============================
// STATE
// ===============================

function getDefaultState() {
  return {
    mode: "none",

    workStartedAt: null,

    entertainmentEndsAt: null,

    cooldownEndsAt: null
  };
}


function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return getDefaultState();
    }

    return {
      ...getDefaultState(),
      ...JSON.parse(saved)
    };

  } catch (error) {
    return getDefaultState();
  }
}


function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


// ===============================
// ELEMENTS
// ===============================

const homeScreen =
  document.getElementById("homeScreen");

const entertainmentSetup =
  document.getElementById("entertainmentSetup");

const sessionScreen =
  document.getElementById("sessionScreen");

const blockedScreen =
  document.getElementById("blockedScreen");

const aiScreen =
  document.getElementById("aiScreen");

const statusText =
  document.getElementById("statusText");

const timer =
  document.getElementById("timer");

const cooldownTimer =
  document.getElementById("cooldownTimer");

const cooldownText =
  document.getElementById("cooldownText");

const videoTitle =
  document.getElementById("videoTitle");

const videoDescription =
  document.getElementById("videoDescription");

const classifyButton =
  document.getElementById("classifyButton");

const aiLoading =
  document.getElementById("aiLoading");

const aiResult =
  document.getElementById("aiResult");

const resultClassification =
  document.getElementById("resultClassification");

const resultConfidence =
  document.getElementById("resultConfidence");

const resultReason =
  document.getElementById("resultReason");

const resultIcon =
  document.getElementById("resultIcon");


// ===============================
// SCREEN CONTROL
// ===============================

function hideAllScreens() {

  homeScreen.classList.add("hidden");

  entertainmentSetup.classList.add("hidden");

  sessionScreen.classList.add("hidden");

  blockedScreen.classList.add("hidden");

  aiScreen.classList.add("hidden");
}


function showScreen(screen) {

  hideAllScreens();

  screen.classList.remove("hidden");
}


// ===============================
// WORK MODE
// ===============================

function startWork() {

  clearInterval(timerInterval);

  if (
    state.mode !== "work" ||
    !state.workStartedAt
  ) {
    state.workStartedAt = Date.now();
  }

  state.mode = "work";

  state.entertainmentEndsAt = null;

  saveState();

  document.getElementById(
    "sessionIcon"
  ).textContent = "📚";

  document.getElementById(
    "sessionTitle"
  ).textContent = "Work Mode";

  document.getElementById(
    "sessionDescription"
  ).textContent =
    "Unlimited work time.";

  statusText.textContent =
    "Work mode active.";

  showScreen(sessionScreen);

  startWorkStopwatch();
}


function startWorkStopwatch() {

  clearInterval(timerInterval);

  updateWorkStopwatch();

  timerInterval = setInterval(
    updateWorkStopwatch,
    1000
  );
}


function updateWorkStopwatch() {

  if (!state.workStartedAt) {
    state.workStartedAt = Date.now();
    saveState();
  }

  const elapsed =
    Date.now() - state.workStartedAt;

  timer.textContent =
    formatTime(elapsed);
}


// ===============================
// ENTERTAINMENT SETUP
// ===============================

function openEntertainmentSetup() {

  if (isCooldownActive()) {

    showBlockedScreen();

    return;
  }

  showScreen(entertainmentSetup);

  statusText.textContent =
    "Choose your entertainment time.";
}


// ===============================
// ENTERTAINMENT MODE
// ===============================

function startEntertainment(minutes) {

  if (isCooldownActive()) {

    showBlockedScreen();

    return;
  }

  clearInterval(timerInterval);

  const now = Date.now();

  state.mode = "entertainment";

  state.workStartedAt = null;

  state.entertainmentEndsAt =
    now + minutes * 60 * 1000;

  saveState();

  document.getElementById(
    "sessionIcon"
  ).textContent = "🎮";

  document.getElementById(
    "sessionTitle"
  ).textContent =
    "Entertainment Mode";

  document.getElementById(
    "sessionDescription"
  ).textContent =
    `${minutes} minute session`;

  statusText.textContent =
    "Entertainment session active.";

  showScreen(sessionScreen);

  startEntertainmentTimer();
}


function startEntertainmentTimer() {

  clearInterval(timerInterval);

  updateEntertainmentTimer();

  timerInterval = setInterval(
    updateEntertainmentTimer,
    1000
  );
}


function updateEntertainmentTimer() {

  const remaining =
    state.entertainmentEndsAt -
    Date.now();

  if (remaining <= 0) {

    endEntertainment();

    return;
  }

  timer.textContent =
    formatTime(remaining);
}


function endEntertainment() {

  clearInterval(timerInterval);

  state.mode = "blocked";

  state.entertainmentEndsAt = null;

  state.cooldownEndsAt =
    Date.now() + COOLDOWN_MS;

  saveState();

  showBlockedScreen();
}


// ===============================
// COOLDOWN
// ===============================

function isCooldownActive() {

  return (
    state.cooldownEndsAt !== null &&
    Date.now() < state.cooldownEndsAt
  );
}


function showBlockedScreen() {

  showScreen(blockedScreen);

  statusText.textContent =
    "Entertainment is on cooldown.";

  startCooldownTimer();
}


function startCooldownTimer() {

  clearInterval(timerInterval);

  updateCooldown();

  timerInterval = setInterval(
    updateCooldown,
    1000
  );
}


function updateCooldown() {

  if (!state.cooldownEndsAt) {
    cooldownTimer.textContent = "00:00";
    cooldownText.textContent = "";
    return;
  }

  const remaining =
    state.cooldownEndsAt -
    Date.now();

  if (remaining <= 0) {

    state.cooldownEndsAt = null;

    if (state.mode === "blocked") {
      state.mode = "none";
    }

    saveState();

    clearInterval(timerInterval);

    cooldownTimer.textContent = "00:00";

    cooldownText.textContent = "";

    if (state.mode === "none") {
      showHome();
    }

    return;
  }

  const formatted =
    formatTime(remaining);

  cooldownTimer.textContent =
    formatted;

  cooldownText.textContent =
    `Entertainment cooldown: ${formatted}`;
}


// ===============================
// EXIT SESSION
// ===============================

function exitSession() {

  clearInterval(timerInterval);

  if (state.mode === "work") {

    state.mode = "none";

    state.workStartedAt = null;

  } else if (
    state.mode === "entertainment"
  ) {

    endEntertainment();

    return;
  }

  saveState();

  showHome();
}


// ===============================
// HOME
// ===============================

function showHome() {

  clearInterval(timerInterval);

  showScreen(homeScreen);

  statusText.textContent =
    "Choose how you're using YouTube.";

  updateHomeCooldown();
}


function updateHomeCooldown() {

  if (!isCooldownActive()) {

    cooldownText.textContent = "";

    return;
  }

  const remaining =
    state.cooldownEndsAt -
    Date.now();

  cooldownText.textContent =
    `Entertainment cooldown: ${formatTime(remaining)}`;
}


// ===============================
// AI SCREEN
// ===============================

function openAIScreen() {

  clearInterval(timerInterval);

  showScreen(aiScreen);

  statusText.textContent =
    "Test FocusTube's AI classifier.";

  aiLoading.classList.add("hidden");

  aiResult.classList.add("hidden");
}


async function classifyVideo() {

  const title =
    videoTitle.value.trim();

  const description =
    videoDescription.value.trim();


  if (!title && !description) {

    alert(
      "Please enter a video title or description."
    );

    return;
  }


  classifyButton.disabled = true;

  aiResult.classList.add("hidden");

  aiLoading.classList.remove("hidden");


  try {

    const response =
      await fetch(
        AI_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            title: title,
            description: description
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI request failed."
      );
    }


    displayAIResult(data);


  } catch (error) {

    aiLoading.classList.add("hidden");

    alert(
      "AI connection failed:\n\n" +
      error.message
    );


  } finally {

    classifyButton.disabled = false;

  }
}


function displayAIResult(data) {

  aiLoading.classList.add("hidden");

  aiResult.classList.remove("hidden");


  const classification =
    String(
      data.classification ||
      "UNCERTAIN"
    ).toUpperCase();


  const confidence =
    Number(
      data.confidence || 0
    );


  resultClassification.textContent =
    classification;


  resultConfidence.textContent =
    `Confidence: ${Math.round(
      confidence * 100
    )}%`;


  resultReason.textContent =
    data.reason ||
    "No reason provided.";


  if (classification === "WORK") {

    resultIcon.textContent = "📚";

  } else if (
    classification === "ENTERTAINMENT"
  ) {

    resultIcon.textContent = "🎮";

  } else {

    resultIcon.textContent = "❓";
  }
}


// ===============================
// TIME FORMAT
// ===============================

function formatTime(milliseconds) {

  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        milliseconds / 1000
      )
    );


  const hours =
    Math.floor(
      totalSeconds / 3600
    );


  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );


  const seconds =
    totalSeconds % 60;


  if (hours > 0) {

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0")
    );
  }


  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}


// ===============================
// BUTTONS
// ===============================

document
  .getElementById("workButton")
  .addEventListener(
    "click",
    startWork
  );


document
  .getElementById("blockedWorkButton")
  .addEventListener(
    "click",
    startWork
  );


document
  .getElementById("entertainmentButton")
  .addEventListener(
    "click",
    openEntertainmentSetup
  );


document
  .getElementById("backButton")
  .addEventListener(
    "click",
    showHome
  );


document
  .getElementById("exitButton")
  .addEventListener(
    "click",
    exitSession
  );


document
  .getElementById("aiTestButton")
  .addEventListener(
    "click",
    openAIScreen
  );


document
  .getElementById("aiBackButton")
  .addEventListener(
    "click",
    showHome
  );


document
  .getElementById("classifyButton")
  .addEventListener(
    "click",
    classifyVideo
  );


document
  .querySelectorAll(".time-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const minutes =
          Number(
            button.dataset.minutes
          );

        startEntertainment(minutes);
      }
    );

  });


// ===============================
// STARTUP
// ===============================

function initialize() {

  // Active Work

  if (
    state.mode === "work" &&
    state.workStartedAt
  ) {

    document.getElementById(
      "sessionIcon"
    ).textContent = "📚";

    document.getElementById(
      "sessionTitle"
    ).textContent = "Work Mode";

    document.getElementById(
      "sessionDescription"
    ).textContent =
      "Unlimited work time.";

    statusText.textContent =
      "Work mode active.";

    showScreen(sessionScreen);

    startWorkStopwatch();

    return;
  }


  // Active Entertainment

  if (
    state.mode === "entertainment" &&
    state.entertainmentEndsAt
  ) {

    if (
      Date.now() <
      state.entertainmentEndsAt
    ) {

      document.getElementById(
        "sessionIcon"
      ).textContent = "🎮";

      document.getElementById(
        "sessionTitle"
      ).textContent =
        "Entertainment Mode";

      document.getElementById(
        "sessionDescription"
      ).textContent =
        "Entertainment session active.";

      statusText.textContent =
        "Entertainment session active.";

      showScreen(sessionScreen);

      startEntertainmentTimer();

      return;
    }


    // Entertainment expired while closed

    endEntertainment();

    return;
  }


  // Cooldown

  if (
    state.mode === "blocked" &&
    isCooldownActive()
  ) {

    showBlockedScreen();

    return;
  }


  // Nothing active

  state.mode = "none";

  saveState();

  showHome();
}


initialize();


// ===============================
// SERVICE WORKER
// ===============================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("./sw.js")
    .catch(error => {

      console.error(
        "Service worker registration failed:",
        error
      );

    });
      }

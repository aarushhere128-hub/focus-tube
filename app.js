const STORAGE_KEY = "focustube_state";
const COOLDOWN_MS = 30 * 60 * 1000;

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
    console.error("State loading failed:", error);
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

const statusText =
  document.getElementById("statusText");

const timer =
  document.getElementById("timer");

const cooldownTimer =
  document.getElementById("cooldownTimer");

const cooldownText =
  document.getElementById("cooldownText");


// ===============================
// SCREEN CONTROL
// ===============================

function hideAllScreens() {
  homeScreen.classList.add("hidden");
  entertainmentSetup.classList.add("hidden");
  sessionScreen.classList.add("hidden");
  blockedScreen.classList.add("hidden");
}


function showScreen(screen) {
  hideAllScreens();
  screen.classList.remove("hidden");
}


// ===============================
// WORK
// ===============================

function startWork() {

  clearInterval(timerInterval);

  /*
   * Only create a timestamp if we aren't
   * already in Work mode.
   */

  if (
    state.mode !== "work" ||
    !state.workStartedAt
  ) {
    state.workStartedAt = Date.now();
  }

  state.mode = "work";

  /*
   * Entertainment session is definitely over.
   *
   * BUT cooldown is preserved.
   */

  state.entertainmentEndsAt = null;

  saveState();

  document.getElementById("sessionIcon").textContent = "📚";

  document.getElementById("sessionTitle").textContent =
    "Work Mode";

  document.getElementById("sessionDescription").textContent =
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
// ENTERTAINMENT
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

  document.getElementById("sessionIcon").textContent = "🎮";

  document.getElementById("sessionTitle").textContent =
    "Entertainment Mode";

  document.getElementById("sessionDescription").textContent =
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
    state.entertainmentEndsAt - Date.now();

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

  startCooldownTimer();
}


// ===============================
// BLOCKED
// ===============================

function showBlockedScreen() {

  showScreen(blockedScreen);

  statusText.textContent =
    "Entertainment is on cooldown.";

  startCooldownTimer();
}


function startCooldownTimer() {

  clearInterval(timerInterval);

  updateCooldown();

  /*
   * This interval only exists while the
   * PWA is open.
   *
   * The actual cooldown is based on the
   * timestamp, so closing the PWA doesn't
   * pause it.
   */

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
    state.cooldownEndsAt - Date.now();


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


function isCooldownActive() {

  return (
    state.cooldownEndsAt !== null &&
    Date.now() < state.cooldownEndsAt
  );
}


// ===============================
// EXIT
// ===============================

function exitSession() {

  clearInterval(timerInterval);

  if (state.mode === "work") {

    state.mode = "none";

    state.workStartedAt = null;

  } else if (state.mode === "entertainment") {

    /*
     * Manually ending entertainment starts
     * the cooldown.
     */

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
    state.cooldownEndsAt - Date.now();

  cooldownText.textContent =
    `Entertainment cooldown: ${formatTime(remaining)}`;
}


// ===============================
// TIME
// ===============================

function formatTime(milliseconds) {

  const totalSeconds =
    Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

  const hours =
    Math.floor(totalSeconds / 3600);

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
  .querySelectorAll(".time-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const minutes =
          Number(button.dataset.minutes);

        startEntertainment(minutes);

      }
    );

  });


// ===============================
// STARTUP
// ===============================

function initialize() {

  /*
   * ACTIVE WORK
   */

  if (
    state.mode === "work" &&
    state.workStartedAt
  ) {

    document.getElementById("sessionIcon").textContent = "📚";

    document.getElementById("sessionTitle").textContent =
      "Work Mode";

    document.getElementById("sessionDescription").textContent =
      "Unlimited work time.";

    statusText.textContent =
      "Work mode active.";

    showScreen(sessionScreen);

    startWorkStopwatch();

    return;
  }


  /*
   * ACTIVE ENTERTAINMENT
   */

  if (
    state.mode === "entertainment" &&
    state.entertainmentEndsAt
  ) {

    if (
      Date.now() <
      state.entertainmentEndsAt
    ) {

      document.getElementById("sessionIcon").textContent = "🎮";

      document.getElementById("sessionTitle").textContent =
        "Entertainment Mode";

      document.getElementById("sessionDescription").textContent =
        "Entertainment session active.";

      statusText.textContent =
        "Entertainment session active.";

      showScreen(sessionScreen);

      startEntertainmentTimer();

      return;
    }

    /*
     * Session expired while app was closed.
     */

    endEntertainment();

    return;
  }


  /*
   * COOLDOWN
   */

  if (
    state.mode === "blocked" &&
    isCooldownActive()
  ) {

    showBlockedScreen();

    return;
  }


  /*
   * Nothing active.
   */

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

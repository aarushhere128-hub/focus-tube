const STORAGE_KEY = "focustube_state";

const COOLDOWN_MS = 30 * 60 * 1000;


// ===============================
// STATE
// ===============================

let state = loadState();

let timerInterval = null;


// ===============================
// DEFAULT STATE
// ===============================

function defaultState() {
  return {
    mode: "none",

    workStartedAt: null,

    entertainmentStartedAt: null,
    entertainmentEndsAt: null,

    cooldownEndsAt: null
  };
}


// ===============================
// STORAGE
// ===============================

function loadState() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultState();
    }

    return {
      ...defaultState(),
      ...JSON.parse(saved)
    };

  } catch (error) {

    console.error(
      "Failed to load state:",
      error
    );

    return defaultState();
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
// SCREEN MANAGEMENT
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
// WORK MODE
// ===============================

function startWork() {

  clearInterval(timerInterval);

  /*
   * Only create a new start time if
   * we aren't already in Work mode.
   *
   * This means reopening the app doesn't
   * reset the stopwatch.
   */

  if (state.mode !== "work") {

    state.workStartedAt =
      Date.now();

  }

  state.mode = "work";

  /*
   * IMPORTANT:
   * We do NOT delete cooldownEndsAt.
   *
   * Entertainment can remain on cooldown
   * while Work is active.
   */

  state.entertainmentStartedAt = null;

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
    "Work mode is active.";

  statusText.textContent =
    "Work mode active.";

  showScreen(sessionScreen);

  startWorkStopwatch();

}


// ===============================
// WORK STOPWATCH
// ===============================

function startWorkStopwatch() {

  clearInterval(timerInterval);

  updateWorkStopwatch();

  timerInterval =
    setInterval(
      updateWorkStopwatch,
      1000
    );

}


function updateWorkStopwatch() {

  if (!state.workStartedAt) {

    state.workStartedAt =
      Date.now();

    saveState();

  }

  const elapsed =
    Date.now() -
    state.workStartedAt;

  timer.textContent =
    formatTime(elapsed);

}


// ===============================
// ENTERTAINMENT SETUP
// ===============================

function openEntertainmentSetup() {

  if (isCooldownActive()) {

    /*
     * Don't allow entertainment during
     * the cooldown.
     */

    showScreen(blockedScreen);

    startCooldownTimer();

    return;
  }

  showScreen(entertainmentSetup);

  statusText.textContent =
    "Choose your entertainment time.";

}


// ===============================
// START ENTERTAINMENT
// ===============================

function startEntertainment(minutes) {

  /*
   * Safety check.
   */

  if (isCooldownActive()) {

    showScreen(blockedScreen);

    startCooldownTimer();

    return;
  }

  const now =
    Date.now();

  const duration =
    minutes * 60 * 1000;

  state.mode =
    "entertainment";

  state.entertainmentStartedAt =
    now;

  state.entertainmentEndsAt =
    now + duration;

  /*
   * Work stopwatch is no longer
   * the active session.
   */

  state.workStartedAt = null;

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

  showScreen(sessionScreen);

  statusText.textContent =
    "Entertainment session active.";

  startEntertainmentTimer();

}


// ===============================
// ENTERTAINMENT TIMER
// ===============================

function startEntertainmentTimer() {

  clearInterval(timerInterval);

  updateEntertainmentTimer();

  timerInterval =
    setInterval(
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


// ===============================
// END ENTERTAINMENT
// ===============================

function endEntertainment() {

  clearInterval(timerInterval);

  const cooldownEnds =
    Date.now() + COOLDOWN_MS;

  state.mode =
    "blocked";

  state.entertainmentStartedAt =
    null;

  state.entertainmentEndsAt =
    null;

  state.cooldownEndsAt =
    cooldownEnds;

  saveState();

  statusText.textContent =
    "Entertainment is on cooldown.";

  showScreen(blockedScreen);

  startCooldownTimer();

}


// ===============================
// COOLDOWN
// ===============================

function isCooldownActive() {

  if (!state.cooldownEndsAt) {
    return false;
  }

  return Date.now() <
    state.cooldownEndsAt;

}


function startCooldownTimer() {

  clearInterval(timerInterval);

  updateCooldownDisplay();

  timerInterval =
    setInterval(
      updateCooldownDisplay,
      1000
    );

}


function updateCooldownDisplay() {

  if (!state.cooldownEndsAt) {

    cooldownText.textContent =
      "";

    return;
  }

  const remaining =
    state.cooldownEndsAt -
    Date.now();

  if (remaining <= 0) {

    state.cooldownEndsAt =
      null;

    /*
     * Only change the mode if we are
     * actually on the blocked screen.
     *
     * If Work is active, Work stays active.
     */

    if (state.mode === "blocked") {

      state.mode = "none";

    }

    saveState();

    clearInterval(timerInterval);

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

  /*
   * Ending Work does NOT affect
   * entertainment cooldown.
   */

  if (state.mode === "work") {

    state.mode = "none";

    state.workStartedAt = null;

  }

  /*
   * Ending entertainment manually:
   * for V0.1, treat it as ending the
   * entertainment session normally.
   */

  else if (
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


// ===============================
// HOME COOLDOWN DISPLAY
// ===============================

function updateHomeCooldown() {

  if (!state.cooldownEndsAt) {

    cooldownText.textContent =
      "";

    return;
  }

  if (!isCooldownActive()) {

    state.cooldownEndsAt =
      null;

    saveState();

    cooldownText.textContent =
      "";

    return;
  }

  const remaining =
    state.cooldownEndsAt -
    Date.now();

  cooldownText.textContent =
    `Entertainment cooldown: ${formatTime(remaining)}`;

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
      String(hours).padStart(2, "0")
      + ":"
      + String(minutes).padStart(2, "0")
      + ":"
      + String(seconds).padStart(2, "0")
    );

  }

  return (
    String(minutes).padStart(2, "0")
    + ":"
    + String(seconds).padStart(2, "0")
  );

}


// ===============================
// STARTUP
// ===============================

function initialize() {

  /*
   * 1. Active Entertainment
   */

  if (
    state.mode === "entertainment" &&
    state.entertainmentEndsAt
  ) {

    if (
      Date.now() <
      state.entertainmentEndsAt
    ) {

      showScreen(sessionScreen);

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

      startEntertainmentTimer();

      return;
    }

    /*
     * Entertainment expired while
     * the app was closed.
     */

    endEntertainment();

    return;
  }


  /*
   * 2. Work mode
   *
   * This MUST be checked before the
   * cooldown.
   */

  if (
    state.mode === "work" &&
    state.workStartedAt
  ) {

    showScreen(sessionScreen);

    document.getElementById(
      "sessionIcon"
    ).textContent = "📚";

    document.getElementById(
      "sessionTitle"
    ).textContent =
      "Work Mode";

    document.getElementById(
      "sessionDescription"
    ).textContent =
      "Work mode is active.";

    startWorkStopwatch();

    return;
  }


  /*
   * 3. Entertainment cooldown
   */

  if (
    state.mode === "blocked" &&
    isCooldownActive()
  ) {

    showScreen(blockedScreen);

    startCooldownTimer();

    return;
  }


  /*
   * 4. Nothing active
   */

  state.mode = "none";

  saveState();

  showHome();

}


// ===============================
// EVENT LISTENERS
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
          Number(
            button.dataset.minutes
          );

        startEntertainment(minutes);

      }
    );

  });


// ===============================
// APP START
// ===============================

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
  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultState();
    }

    return {
      ...defaultState(),
      ...JSON.parse(saved)
    };

  } catch (error) {

    console.error(
      "Failed to load state:",
      error
    );

    return defaultState();
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
// SCREEN MANAGEMENT
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
// WORK MODE
// ===============================

function startWork() {

  clearInterval(timerInterval);

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
    "Unlimited access for productive work.";

  timer.textContent = "∞";

  statusText.textContent =
    "Work mode active.";

  showScreen(sessionScreen);

}


// ===============================
// ENTERTAINMENT SETUP
// ===============================

function openEntertainmentSetup() {

  if (isCooldownActive()) {

    updateCooldownDisplay();

    return;
  }

  showScreen(entertainmentSetup);

  statusText.textContent =
    "Choose your entertainment time.";

}


// ===============================
// START ENTERTAINMENT
// ===============================

function startEntertainment(minutes) {

  const now = Date.now();

  const duration =
    minutes * 60 * 1000;

  state.mode = "entertainment";

  state.entertainmentEndsAt =
    now + duration;

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

  showScreen(sessionScreen);

  statusText.textContent =
    "Entertainment session active.";

  startEntertainmentTimer();

}


// ===============================
// ENTERTAINMENT TIMER
// ===============================

function startEntertainmentTimer() {

  clearInterval(timerInterval);

  updateEntertainmentTimer();

  timerInterval =
    setInterval(
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


// ===============================
// END ENTERTAINMENT
// ===============================

function endEntertainment() {

  clearInterval(timerInterval);

  const cooldownEnds =
    Date.now() + COOLDOWN_MS;

  state.mode = "blocked";

  state.entertainmentEndsAt = null;

  state.cooldownEndsAt =
    cooldownEnds;

  saveState();

  statusText.textContent =
    "Entertainment is on cooldown.";

  showScreen(blockedScreen);

  startCooldownTimer();

}


// ===============================
// COOLDOWN
// ===============================

function isCooldownActive() {

  if (!state.cooldownEndsAt) {
    return false;
  }

  return Date.now() <
    state.cooldownEndsAt;

}


function startCooldownTimer() {

  clearInterval(timerInterval);

  updateCooldownDisplay();

  timerInterval =
    setInterval(
      updateCooldownDisplay,
      1000
    );

}


function updateCooldownDisplay() {

  const remaining =
    state.cooldownEndsAt -
    Date.now();

  if (remaining <= 0) {

    state.cooldownEndsAt = null;

    state.mode = "none";

    saveState();

    clearInterval(timerInterval);

    showHome();

    return;
  }

  const formatted =
    formatTime(remaining);

  cooldownTimer.textContent =
    formatted;

  cooldownText.textContent =
    `Cooldown remaining: ${formatted}`;

}


// ===============================
// EXIT SESSION
// ===============================

function exitSession() {

  clearInterval(timerInterval);

  state.mode = "none";

  state.entertainmentEndsAt = null;

  saveState();

  showHome();

}


// ===============================
// HOME
// ===============================

function showHome() {

  updateCooldownDisplay();

  showScreen(homeScreen);

  statusText.textContent =
    "Choose how you're using YouTube.";

}


// ===============================
// TIME FORMAT
// ===============================

function formatTime(milliseconds) {

  const totalSeconds =
    Math.ceil(
      milliseconds / 1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0")
    +
    ":"
    +
    String(seconds).padStart(2, "0")
  );

}


// ===============================
// EVENT LISTENERS
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
          Number(
            button.dataset.minutes
          );

        startEntertainment(minutes);

      }
    );

  });


// ===============================
// APP STARTUP
// ===============================

function initialize() {

  if (
    state.mode === "entertainment" &&
    state.entertainmentEndsAt
  ) {

    if (
      Date.now() <
      state.entertainmentEndsAt
    ) {

      startEntertainmentTimer();

      showScreen(sessionScreen);

      return;
    }

    endEntertainment();

    return;
  }


  if (
    state.cooldownEndsAt &&
    isCooldownActive()
  ) {

    showScreen(blockedScreen);

    startCooldownTimer();

    return;
  }


  state.mode = "none";

  saveState();

  showHome();

}

initialize();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .catch(error => {
      console.error(
        "Service worker registration failed:",
        error
      );
    });
}


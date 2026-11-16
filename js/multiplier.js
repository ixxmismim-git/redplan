
(() => {

    // ===============================
    // ELEMENT
    // ===============================

    const multiplierElement =
        document.getElementById("multiplier");

    if (!multiplierElement) return;


    // ===============================
    // MULTIPLIER VARIABLES
    // ===============================

    let multiplier = 1.00;
    let isRunning = false;
    let startTime = 0;
    let nextUpdateTime = 0;


    // ===============================
    // SPEED SETTINGS
    // ===============================
// ===============================
// SPEED SETTINGS
// ===============================

const BASE_STEP = 0.015;

const BASE_MIN_GAP = 180;
const BASE_MAX_GAP = 260;

const LEVEL_GAP_POWER = 0.85;
const LEVEL_SPEED_POWER = 0.95;

const TIME_ACCELERATION = 40000;


    // ===============================
    // UPDATE MULTIPLIER
    // ===============================

function updateMultiplier(time) {

    if (!isRunning) return;

    if (!startTime) {
        startTime = time;
        nextUpdateTime = time;
    }

    if (time >= nextUpdateTime) {

        // Current multiplier level
        const level = Math.max(1, Math.floor(multiplier));

        // ===============================
        // GAP DISTANCE BY LEVEL
        // ===============================

        let gapDistance;

        if (level === 1) {
            gapDistance = 15;
        } else {
            gapDistance = level * 10;
        }

        // Random gap distance
        const randomGapDistance =
            1 + Math.random() * (gapDistance - 1);

        // ===============================
        // SPEED BY LEVEL
        // ===============================

        const speedBoost =
            1 + (level - 1) * 0.25;

        // Time-based acceleration
        const elapsedTime = time - startTime;

        const timeBoost =
            1 + elapsedTime / 60000;

        // Multiplier increment
        const step =
            0.012 * speedBoost * timeBoost;

        multiplier += step;

        // ===============================
        // UPDATE DISPLAY
        // ===============================

        multiplierElement.textContent =
            multiplier.toFixed(2) + "x";

        // Update lighting
        if (window.lightingBackground) {
            window.lightingBackground.setMultiplierColor(multiplier);
        }

        // ===============================
        // NEXT UPDATE GAP
        // ===============================

        const finalGap =
            randomGapDistance * 12 / (speedBoost * timeBoost);

        nextUpdateTime = time + finalGap;
    }

    requestAnimationFrame(updateMultiplier);
}


    // ===============================
    // START
    // ===============================

    function start() {

        multiplier = 1.00;

        startTime = 0;
        nextUpdateTime = 0;

        isRunning = true;

        multiplierElement.classList.remove("crashed");
        multiplierElement.textContent = "1.00x";

        if (window.lightingBackground) {
            window.lightingBackground.setMultiplierColor(1);
        }

        requestAnimationFrame(updateMultiplier);
    }


    // ===============================
    // CRASH
    // ===============================

    function crash() {

        isRunning = false;

        multiplierElement.classList.add("crashed");
    }


    // ===============================
    // RESET
    // ===============================

    function reset() {

        isRunning = false;

        multiplier = 1.00;

        startTime = 0;
        nextUpdateTime = 0;

        multiplierElement.classList.remove("crashed");
        multiplierElement.textContent = "1.00x";

        if (window.lightingBackground) {
            window.lightingBackground.setMultiplierColor(1);
        }
    }


    // ===============================
    // PUBLIC CONTROL
    // ===============================

    window.multiplierAnimation = {
        start,
        crash,
        reset,
        getValue: () => multiplier
    };

})();

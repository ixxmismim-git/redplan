
(() => {

    // ===============================
    // CRASH POINTS
    // ===============================

    const crashPoints = [
        1.10,
        1.10,
        1.10,
       2.70,
        2.62,
        2.,
        10.75,
        2.20
    ];

    let roundIndex = 0;
    let roundRunning = false;
    let roundTimer = null;

    // ===============================
    // ROUND TIMING
    // ===============================

    const CRASH_DISPLAY_TIME = 3000;
    const PREPARATION_TIME = 6500;

    // ===============================
    // GAME STATE
    // ===============================

    let gameState = "PREPARING";

    // ===============================
    // WAITING START CALLBACK
    // ===============================

    function notifyWaitingStart() {

        console.log("WAITING START CALLBACK");

        window.dispatchEvent(
            new CustomEvent("roundWaitingStart")
        );
    }

    // ===============================
    // START ROUND
    // ===============================

 
let roundStartPending = false;

function startRound() {

    if (roundRunning || roundStartPending) return;

    if (roundIndex >= crashPoints.length) {
        roundIndex = 0;
    }

    const progressLayout =
        document.getElementById("progressLayout");

    const planeBottomLayout =
        document.getElementById("plane-bottom-layout");

    // Progress বর্তমানে visible কি না
    const progressVisible =
        progressLayout &&
        window.getComputedStyle(progressLayout).display !== "none";

    // Progress visible থাকলে আগে সেটি hide হবে
    if (progressVisible) {

        progressLayout.style.display = "none";

        // Shadow দেখাবে
        if (planeBottomLayout) {
            planeBottomLayout.classList.add("progress-delay");
        }

        roundStartPending = true;

        // Random delay: 500–1000ms
        const delay = 100 + Math.floor(Math.random() * 800);

        setTimeout(() => {

            // Shadow সরিয়ে ফেলবে
            if (planeBottomLayout) {
                planeBottomLayout.classList.remove("progress-delay");
            }

            roundStartPending = false;

            // এখন Fly শুরু হবে
            beginRound();

        }, delay);

        return;
    }

    // প্রথমবার Progress না থাকলে সরাসরি Fly শুরু
    beginRound();
}


// =================================
// ACTUAL ROUND START
// =================================

function beginRound() {

    roundRunning = true;
    gameState = "FLYING";

    window.dispatchEvent(
        new CustomEvent("roundStarted")
    );

    const crashPoint = crashPoints[roundIndex];

    console.log(
        "ROUND STARTED:",
        roundIndex + 1,
        "CRASH POINT:",
        crashPoint
    );

    // Show multiplier
    const multiplierElement =
        document.getElementById("multiplier");

    if (multiplierElement) {
        multiplierElement.style.display = "flex";
    }

    // Reset progress bar
    const progressBar =
        document.getElementById("progressBar");

    if (progressBar) {
        progressBar.style.transition = "none";
        progressBar.style.width = "100%";
        progressBar.offsetWidth;
    }

    // Reset multiplier
    if (window.multiplierAnimation) {
        window.multiplierAnimation.reset();
        window.multiplierAnimation.start();
    }

    // Set crash point
    window.roundManagerCrashPoint = crashPoint;

    // Resume rotate animation
    if (window.rotateBackground) {
        window.rotateBackground.resumeRotate();
    }

    // Start lighting animation
    if (window.lightingBackground) {
        window.lightingBackground.startGlow();
        window.lightingBackground.setMultiplierColor(1);
    }

    // Restore crash graph
    if (window.crashGraph) {
        window.crashGraph.restoreAnimation();
    }

    // Monitor multiplier
    monitorMultiplier();
}


    // ===============================
    // MONITOR MULTIPLIER
    // ===============================

 
function monitorMultiplier() {

    if (!roundRunning) return;

    const currentMultiplier =
        window.multiplierAnimation
            ? window.multiplierAnimation.getValue()
            : 1;

    // SEND MULTIPLIER UPDATE EVENT
    window.dispatchEvent(
        new CustomEvent("roundMultiplierUpdate", {
            detail: {
                multiplier: currentMultiplier
            }
        })
    );

    if (currentMultiplier >= window.roundManagerCrashPoint) {

        crashRound();
        return;
    }

    requestAnimationFrame(monitorMultiplier);
}


    // ===============================
    // CRASH ROUND
    // ===============================

    function crashRound() {

        if (!roundRunning) return;

        roundRunning = false;
        gameState = "CRASHED";
        window.dispatchEvent(
    new CustomEvent("roundCrashed")
);

        // Stop crash graph
        if (window.crashGraph) {
            window.crashGraph.stopAnimation();
        }

        // Pause rotate animation
        if (window.rotateBackground) {
            window.rotateBackground.pauseRotate();
        }

        // Stop lighting
        if (window.lightingBackground) {
            window.lightingBackground.stopGlow();
        }

        // Stop multiplier animation
        if (window.multiplierAnimation) {
            window.multiplierAnimation.crash();
        }

        // Multiplier element
        const multiplierElement =
            document.getElementById("multiplier");

        if (multiplierElement) {
            multiplierElement.style.display = "flex";
        }

        // Show crash point
        const crashPointElement =
            document.getElementById("crashPoint");

        if (crashPointElement) {
            crashPointElement.style.display = "block";
            crashPointElement.style.color = "red";
        }

        // Show FLEW AWAY
        const flewAway =
            document.getElementById("flewAway");

        if (flewAway) {
            flewAway.style.display = "block";
        }

        console.log(
            "CRASHED!",
            window.roundManagerCrashPoint
        );

        // ===============================
        // ADD CRASH TO HISTORY
        // ===============================

        if (window.historyManager) {
            window.historyManager.addResult(
                window.roundManagerCrashPoint
            );
        }

        // Random crash display time: 3–5 seconds
        const hideDelay = 3000 + Math.random() * 2000;

        // ===============================
        // AFTER CRASH DISPLAY
        // ===============================

        setTimeout(() => {

            // Hide crash point
            if (crashPointElement) {
                crashPointElement.style.display = "none";
            }

            // Hide FLEW AWAY
            if (flewAway) {
                flewAway.style.display = "none";
            }

            // Hide multiplier
            if (multiplierElement) {
                multiplierElement.style.display = "none";
            }

            // ===============================
            // SHOW PROGRESS LAYOUT
            // ===============================

            const progressLayout =
                document.getElementById("progressLayout");

            if (progressLayout) {
                progressLayout.style.display = "flex";
            }

            // ===============================
            // PREPARE PLANE
            // ===============================

            if (window.crashGraph) {
                window.crashGraph.preparePlane();
            }

            // Reset multiplier
            if (window.multiplierAnimation) {
                window.multiplierAnimation.reset();
            }

            gameState = "PREPARING";

            // ===============================
            // WAITING START CALLBACK
            // ===============================

            notifyWaitingStart();

            // ===============================
            // PROGRESS BAR COUNTDOWN
            // ===============================

            const progressBar =
                document.getElementById("progressBar");

            if (progressBar) {

                progressBar.style.transition = "none";
                progressBar.style.width = "100%";

                progressBar.offsetWidth;

                progressBar.style.transition =
                    `width ${PREPARATION_TIME}ms linear`;

                progressBar.style.width = "0%";
            }

            console.log("PROGRESS LAYOUT SHOWN");

            // ===============================
            // NEXT ROUND
            // ===============================

            clearTimeout(roundTimer);

            roundTimer = setTimeout(() => {

                roundIndex++;

                startRound();

            }, PREPARATION_TIME);

        }, hideDelay);
    }

    // ===============================
    // INITIAL START
    // ===============================

    window.roundManager = {

        startRound,

        getState: () => gameState,

        getRoundIndex: () => roundIndex,

        setOnWaitingStartListener: (callback) => {

            if (typeof callback === "function") {

                window.addEventListener(
                    "roundWaitingStart",
                    callback
                );

            }

        }

    };

    // Start first round
    startRound();

})();


(() => {

    // ===============================
    // CRASH POINTS
    // ===============================

    const crashPoints = [
        1.10,
        1.12,
        1.50,
        1.22,
        1.05,
        2.25,
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
    // START ROUND
    // ===============================

    function startRound() {

        if (roundRunning) return;

        if (roundIndex >= crashPoints.length) {
            roundIndex = 0;
        }

        roundRunning = true;
        gameState = "FLYING";

        const crashPoint = crashPoints[roundIndex];

        console.log(
            "ROUND STARTED:",
            roundIndex + 1,
            "CRASH POINT:",
            crashPoint
        );

        // Hide progress layout
        const progressLayout =
            document.getElementById("progressLayout");

        if (progressLayout) {
            progressLayout.style.display = "none";
        }

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

        // Stop multiplier animation (keep multiplier visible)
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

            // Show progress layout
            const progressLayout =
                document.getElementById("progressLayout");

            if (progressLayout) {
                progressLayout.style.display = "flex";
            }

            // ===============================
            // PREPARE PLANE
            // Plane visible, but does not fly
            // Propeller keeps rotating
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
            // PROGRESS BAR COUNTDOWN
            // ===============================

            // Progress bar countdown
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
        getRoundIndex: () => roundIndex
    };

    // Start first round
    startRound();

})();

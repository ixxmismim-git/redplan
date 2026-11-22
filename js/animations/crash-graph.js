
(() => {
    const canvas = document.getElementById("crashCanvas");

    if (!canvas) {
        console.error("crashCanvas not found!");
        return;
    }

    const ctx = canvas.getContext("2d");

    // ===============================
    // IMAGE FILES
    // ===============================

    const bodyImage = new Image();
    const leftPropellerImage = new Image();
    const rightPropellerImage = new Image();

    bodyImage.src = "assets/planes/plane_body.png";
    leftPropellerImage.src = "assets/planes/propeller_left.png";
    rightPropellerImage.src = "assets/planes/propeller_right.png";

    // ===============================
    // PLANE SIZE
    // ===============================

    const BODY_WIDTH = 210;
    const BODY_HEIGHT = 130;

    const PROP_WIDTH = 8;
    const PROP_HEIGHT = 29;

    const SIZE_RATIO = 210 / 420;

    const planeOffsetX = 100 * SIZE_RATIO;
    const planeOffsetY = -50 * SIZE_RATIO;

    // ===============================
    // ANIMATION VARIABLES
    // ===============================

    let width = 0;
    let height = 0;
    let dpr = 1;

    let planeX = 10;
    let planeY = 0;

    let moveProgress = 0;
    let secondProgress = 0;

    let state = 0;
    let reverse = false;

    let firstEndX = 0;
    let firstEndY = 0;

    let startGraphAnimation = false;

    let bladeScale = 1;

    let isStopping = false;
    let stopProgress = 0;
    let stopScale = 1;
    let stopAlpha = 1;

    // Plane visibility
    let planeVisible = true;

    let animationFrame = null;
    let lastFrameTime = 0;

    // ===============================
    // GRAPH STYLE
    // ===============================

    const LINE_COLOR = "#F00B3E";
    const FILL_COLOR = "rgba(225, 6, 6, 0.45)";

    // ===============================
    // RESIZE CANVAS
    // ===============================

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();

        width = rect.width;
        height = rect.height;

        dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!isStopping && moveProgress === 0) {
            planeX = 10;
            planeY = height - 2;
        }

        draw();
    }

    // ===============================
    // PROPELLER ANIMATION
    // ALWAYS RUNNING
    // 250ms forward + 250ms reverse
    // ===============================

    function updatePropeller(time) {
        const cycle = (time % 500) / 500;

        if (cycle < 0.5) {
            bladeScale = 0.53 + (cycle / 0.5) * 0.47;
        } else {
            bladeScale = 1 - ((cycle - 0.5) / 0.5) * 0.47;
        }
    }

    // ===============================
    // DRAW GRAPH
    // ===============================

    function drawGraph() {
        if (!startGraphAnimation) return;

        const startX = 8;
        const startY = height + 1;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const cx1 = planeX * 0.5;
        const cy1 = startY;

        const cx2 = planeX;
        const cy2 = planeY;

        ctx.bezierCurveTo(
            cx1,
            cy1,
            cx2,
            cy2,
            planeX,
            planeY
        );

        // Graph line
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Graph fill
        ctx.lineTo(planeX, startY);
        ctx.lineTo(startX, startY);
        ctx.closePath();

        ctx.fillStyle = FILL_COLOR;
        ctx.fill();
    }

    // ===============================
    // DRAW PROPELLER
    // ===============================

    function drawPropeller(image, x, y, angle, pivotAtBottom) {
        if (!image.complete || !image.naturalWidth) return;

        const pivotX = x + PROP_WIDTH / 2;
        const pivotY = pivotAtBottom
            ? y + PROP_HEIGHT
            : y;

        ctx.save();

        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle * Math.PI / 180);
        ctx.scale(1, bladeScale);

        ctx.drawImage(
            image,
            -PROP_WIDTH / 2,
            pivotAtBottom ? -PROP_HEIGHT : 0,
            PROP_WIDTH,
            PROP_HEIGHT
        );

        ctx.restore();
    }

    // ===============================
    // DRAW PLANE
    // ===============================

    function drawPlane() {

        if (!planeVisible) return;

        if (
            !bodyImage.complete ||
            !bodyImage.naturalWidth ||
            !leftPropellerImage.complete ||
            !leftPropellerImage.naturalWidth ||
            !rightPropellerImage.complete ||
            !rightPropellerImage.naturalWidth
        ) {
            return;
        }

        const bodyX =
            planeX - BODY_WIDTH / 2 + planeOffsetX;

        const bodyY =
            planeY - BODY_HEIGHT / 2 + planeOffsetY;

        ctx.save();

        // Stop animation scale and fade
        ctx.globalAlpha = stopAlpha;

        ctx.translate(planeX, planeY);
        ctx.scale(stopScale, stopScale);
        ctx.translate(-planeX, -planeY);

        // Plane body
        ctx.drawImage(
            bodyImage,
            bodyX,
            bodyY,
            BODY_WIDTH,
            BODY_HEIGHT
        );

        // Left propeller
        const leftX = bodyX + 308.8 * SIZE_RATIO;
        const leftY = bodyY + 49.1 * SIZE_RATIO;

        drawPropeller(
            leftPropellerImage,
            leftX,
            leftY,
            -12.5,
            true
        );

        // Right propeller
        const rightX = bodyX + 314.8 * SIZE_RATIO;
        const rightY = bodyY + 125.1 * SIZE_RATIO;

        drawPropeller(
            rightPropellerImage,
            rightX,
            rightY,
            -9,
            false
        );

        ctx.restore();
    }

    // ===============================
    // MAIN DRAW
    // ===============================

    function draw() {
        ctx.clearRect(0, 0, width, height);

        drawGraph();
        drawPlane();
    }

    // ===============================
    // MAIN ANIMATION
    // PROPELLER LOOP NEVER STOPS
    // ===============================

    function animate(time) {

        if (!lastFrameTime) {
            lastFrameTime = time;
        }

        const delta = Math.min(time - lastFrameTime, 50);
        lastFrameTime = time;

        // ===========================
        // PROPELLER ALWAYS ANIMATES
        // ===========================

        updatePropeller(time);

        // ===========================
        // CRASH EXIT ANIMATION
        // ===========================

        if (isStopping) {

            stopProgress += delta / 2000;

            if (stopProgress >= 1) {
                stopProgress = 1;
            }

            const t = stopProgress;
            const ease = 1 - Math.pow(1 - t, 3);

            const targetX = width + 180;
            const targetY = 10;

            planeX += (targetX - planeX) * ease;
            planeY += (targetY - planeY) * ease;

            stopScale = Math.max(
                0.35,
                1 - (0.65 * ease)
            );

            stopAlpha = Math.max(0, 1 - ease);

            if (stopProgress >= 1) {

                isStopping = false;

                stopScale = 1;
                stopAlpha = 1;

                // Plane disappears, but Canvas loop continues
                planeVisible = false;

                draw();

                animationFrame = requestAnimationFrame(animate);
                return;
            }

            draw();

            animationFrame = requestAnimationFrame(animate);
            return;
        }

        // ===========================
        // PLANE MOVEMENT
        // Android CrashGraphView Logic
        // ===========================

        if (startGraphAnimation) {

            // ===========================
            // FIRST ANIMATION
            // ===========================

            if (state === 0) {

                moveProgress += delta * 0.002 / 16;

                if (moveProgress >= 1) {

                    moveProgress = 1;

                    // First Animation-এর শেষ অবস্থান
                    firstEndX = width - 220;
                    firstEndY = height - height * 0.82;

                    // First শেষ, Second শুরু
                    state = 1;
                    secondProgress = 0;
                    reverse = false;
                }

                // Smooth ease-out
                const t = 1 - Math.pow(
                    1 - moveProgress,
                    1.75
                );

                const startX = 8;
                const startY = height + 1;

                const targetX = width - 220;
                const targetY = height - height * 0.833;

                planeX = startX + t * (targetX - startX);
                planeY = startY + t * (targetY - startY);
            }

            // ===========================
            // SECOND ANIMATION
            // Smooth Up-Down + Left-Right
            // ===========================

            else if (state === 1) {

                const frameStep = delta / 16;

                if (!reverse) {

                    secondProgress += 0.0047 * frameStep;

                    if (secondProgress >= 1) {
                        secondProgress = 1;
                        reverse = true;
                    }

                } else {

                    secondProgress -= 0.0047 * frameStep;

                    if (secondProgress <= 0) {
                        secondProgress = 0;
                        reverse = false;
                    }
                }

                // প্রথম অবস্থান
                const point1X = width - 220;
                const point1Y = height - height * 0.833;

                // দ্বিতীয় অবস্থান
                const point2X = width - 130;
                const point2Y = height - height * 0.5;

                // Android-এর মতো একই Smooth movement
                const t = 1 - Math.pow(1 - secondProgress, 1.75);

                // Plane movement
                planeX = point1X + t * (point2X - point1X);
                planeY = point1Y + t * (point2Y - point1Y);
            }
        }

        draw();

        // Animation loop always continues
        animationFrame = requestAnimationFrame(animate);
    }

    // ===============================
    // START ANIMATION LOOP
    // ===============================

    function startAnimation() {

        // Already running হলে নতুন Loop তৈরি হবে না
        if (animationFrame !== null) return;

        lastFrameTime = 0;
        animationFrame = requestAnimationFrame(animate);
    }

    // ===============================
    // PREPARE PLANE
    // Plane visible, but does not fly
    // Propeller keeps rotating
    // ===============================

    function preparePlane() {

        canvas.style.display = "block";

        isStopping = false;
        stopProgress = 0;

        stopScale = 1;
        stopAlpha = 1;

        moveProgress = 0;
        secondProgress = 0;

        state = 0;
        reverse = false;

        firstEndX = 0;
        firstEndY = 0;

        planeX = 10;
        planeY = height - 2;

        planeVisible = true;

        startGraphAnimation = false;

        lastFrameTime = 0;

        draw();

        // Propeller animation continues
        startAnimation();
    }

    // ===============================
    // RESET PLANE
    // Reset and prepare for flight
    // ===============================

    function resetPlane() {

        preparePlane();

        startGraphAnimation = true;

        if (window.multiplierAnimation) {
            window.multiplierAnimation.crash();
        }

        draw();
        startAnimation();
    }

    // ===============================
    // RESTORE ANIMATION
    // START NEW ROUND
    // ===============================

    function restoreAnimation() {

        resetPlane();

        startGraphAnimation = true;

        if (window.multiplierAnimation) {
            window.multiplierAnimation.start();
        }

        draw();
        startAnimation();
    }

    // ===============================
    // STOP ANIMATION
    // CRASH PLANE EXIT
    // ===============================

    function stopAnimation() {

        startGraphAnimation = false;

        isStopping = true;
        stopProgress = 0;

        stopScale = 1;
        stopAlpha = 1;

        planeVisible = true;

        if (window.multiplierAnimation) {
            window.multiplierAnimation.crash();
        }

        // Do not stop the animation loop
        startAnimation();
    }

    // ===============================
    // INITIALIZE
    // ===============================

    function initialize() {

        resizeCanvas();

        planeX = 10;
        planeY = height - 2;

        startGraphAnimation = false;
        planeVisible = true;

        draw();

        // Start permanent propeller animation loop
        startAnimation();
    }

    // ===============================
    // WAIT FOR ALL IMAGES
    // ===============================

    let loadedImages = 0;

    const images = [
        bodyImage,
        leftPropellerImage,
        rightPropellerImage
    ];

    images.forEach(image => {

        image.onload = () => {

            loadedImages++;

            if (loadedImages === images.length) {
                initialize();
            }
        };

        image.onerror = () => {
            console.error("Plane image load failed:", image.src);
        };
    });

    // ===============================
    // RESIZE SUPPORT
    // ===============================

    window.addEventListener("resize", resizeCanvas);

    // ===============================
    // PUBLIC CONTROLS
    // ===============================

    window.crashGraph = {
        resetPlane,
        preparePlane,
        restoreAnimation,
        stopAnimation
    };

})();

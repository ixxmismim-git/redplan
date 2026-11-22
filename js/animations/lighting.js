class LightingBackground {

    // ==============================
    // CONSTRUCTOR
    // ==============================

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.isRunning = false;

        // Default color: Blue
        this.nextColor = {
            r: 52,
            g: 180,
            b: 255
        };

        this.resize();

        window.addEventListener("resize", () => {
            this.resize();
        });
    }


    // ==============================
    // RESIZE CANVAS
    // ==============================

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = Math.round(this.width * dpr);
        this.canvas.height = Math.round(this.height * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.draw();
    }


    // ==============================
    // DRAW LIGHTING EFFECT
    // ==============================

    draw() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.isRunning) return;

        const centerX = this.width * 0.50;
        const centerY = this.height * 0.50;

        const radius = this.width * 0.43;

        const { r, g, b } = this.nextColor;
        

        const glow = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            radius
        );

glow.addColorStop(
    0.0,
    `rgba(${r}, ${g}, ${b}, ${150 / 255})`
);

glow.addColorStop(
    0.25,
    `rgba(${r}, ${g}, ${b}, ${100 / 255})`
);

glow.addColorStop(
    0.55,
    `rgba(${r}, ${g}, ${b}, ${50 / 255})`
);

glow.addColorStop(
    1.0,
    "rgba(0, 0, 0, 0)"
);

        ctx.save();

        ctx.translate(centerX, centerY);
        ctx.scale(1.2, 0.50);
        ctx.translate(-centerX, -centerY);
        const outerGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.65,
    centerX,
    centerY,
    radius * 1.15
);

outerGlow.addColorStop(
    0.0,
    `rgba(${r}, ${g}, ${b}, ${12 / 255})`
);

outerGlow.addColorStop(
    1.0,
    "rgba(0, 0, 0, 0)"
);

ctx.fillStyle = outerGlow;

ctx.beginPath();

ctx.arc(
    centerX,
    centerY,
    radius * 1.15,
    0,
    Math.PI * 2
);

ctx.fill();

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }


    // ==============================
    // SET GLOW COLOR
    // ==============================

    setGlowColor(r, g, b) {
        this.nextColor = { r, g, b };

        this.draw();
    }


    // ==============================
    // CHANGE COLOR BY MULTIPLIER
    // ==============================

    setMultiplierColor(multiplier) {

        if (multiplier >= 10) {

            // 10.00x and above: Red
            this.setGlowColor(192, 23, 180);

        } else if (multiplier >= 2) {

            // 2.00x - 9.99x: Purple
            this.setGlowColor(145, 62, 248);

        } else {

            // 1.00x - 1.99x: Blue
            this.setGlowColor(52, 180, 255);

        }
    }


    // ==============================
    // START GLOW
    // ==============================

    startGlow() {
        this.isRunning = true;

        this.draw();
    }


    // ==============================
    // STOP GLOW
    // ==============================

    stopGlow() {
        this.isRunning = false;

        this.draw();
    }
}


// ==============================
// CREATE LIGHTING BACKGROUND
// ==============================

const lightingBackground =
    new LightingBackground("lightingCanvas");


// ==============================
// MAKE GLOBALLY ACCESSIBLE
// ==============================

window.lightingBackground = lightingBackground;


// ==============================
// START GLOW
// ==============================

lightingBackground.startGlow();
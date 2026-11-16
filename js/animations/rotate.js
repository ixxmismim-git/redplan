
class RotateBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.rotationAngle = 0;
        this.animationFrame = null;

        this.rayCount = 68;
        this.rotationDuration = 32000;

        this.lastTime = null;
        this.startTime = null;
        this.isRunning = false;

        this.resize();

        window.addEventListener("resize", () => {
            this.resize();
        });
    }

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

    draw() {
        const ctx = this.ctx;

        const w = this.width;
        const h = this.height;

        // Android pivot point
        const pivotX = w * 0.00;
        const pivotY = h * 1.00;

        // Android radius
        const radius = Math.hypot(w, h) * 2.5;

        const angleStep = 360 / this.rayCount;

        ctx.clearRect(0, 0, w, h);

        ctx.save();

        // Rotate animation
        ctx.translate(pivotX, pivotY);
        ctx.rotate(this.rotationAngle * Math.PI / 180);
        ctx.translate(-pivotX, -pivotY);

        // Draw 68 rays
        for (let i = 0; i < this.rayCount; i++) {

            ctx.beginPath();

            ctx.moveTo(pivotX, pivotY);

            const startAngle = i * angleStep;
            const endAngle = startAngle + angleStep + 0.01;

            ctx.arc(
                pivotX,
                pivotY,
                radius,
                startAngle * Math.PI / 180,
                endAngle * Math.PI / 180
            );

            ctx.closePath();

            ctx.fillStyle = (i % 2 === 0)
                ? "#000000"
                : "#0C0C0C";

            ctx.fill();
        }

        ctx.restore();
    }

    animate(timestamp) {
        if (!this.isRunning) return;

        if (this.startTime === null) {
            this.startTime = timestamp;
        }

        const elapsed = timestamp - this.startTime;

        // 360 degrees in 32 seconds
        this.rotationAngle =
            (elapsed % this.rotationDuration) /
            this.rotationDuration * 360;

        this.draw();

        this.animationFrame =
            requestAnimationFrame((time) => this.animate(time));
    }

    startRotate() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = null;

        this.animationFrame =
            requestAnimationFrame((time) => this.animate(time));
    }

    pauseRotate() {
        if (!this.isRunning) return;

        this.isRunning = false;

        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
    }

    stopRotate() {
        this.pauseRotate();

        this.rotationAngle = 0;
        this.startTime = null;

        this.draw();
    }

    resumeRotate() {
        this.startRotate();
    }
}

// Create and start Rotate Animation
// Create Rotate Animation
const rotateBackground = new RotateBackground("rotateCanvas");

// Make globally accessible
window.rotateBackground = rotateBackground;

// Start Rotate Animation
rotateBackground.startRotate();

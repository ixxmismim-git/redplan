
(() => {
    const slots = [
        {
            layout: document.getElementById("cashoutPop1"),
            multiplier: document.getElementById("cashoutPop1-multiplier"),
            amount: document.getElementById("cashoutPop1-win-amount"),
            busy: false
        },
        {
            layout: document.getElementById("cashoutPop2"),
            multiplier: document.getElementById("cashoutPop2-multiplier"),
            amount: document.getElementById("cashoutPop2-win-amount"),
            busy: false
        }
    ];

    function formatAmount(amount) {
        return Number(amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    async function animatePopup(slot) {
        const el = slot.layout;

        // আগের Animation এবং Style Reset
        el.getAnimations().forEach(animation => {
            animation.cancel();
        });

        el.style.display = "none";
        el.style.opacity = "";
        el.style.transform = "";
        el.style.clipPath = "";

        void el.offsetHeight;

        // Popup আবার শুরু থেকে দেখানো
        el.style.display = "flex";

        const height = el.getBoundingClientRect().height || 50;

        el.style.opacity = "0.2";
        el.style.transform = `translateY(${height}px) scale(1)`;
        el.style.clipPath = "inset(0 0 100% 0)";

        // Popup Reveal: 300ms
        await el.animate([
            {
                clipPath: "inset(0 0 100% 0)",
                transform: `translateY(${height}px) scale(1)`,
                opacity: 0.3
            },
            {
                clipPath: "inset(0 0 0 0)",
                transform: "translateY(0) scale(1)",
                opacity: 0.8
            }
        ], {
            duration: 300,
            easing: "ease-out",
            fill: "forwards"
        }).finished;

        // Fade to full opacity: 120ms
        await el.animate([
            { opacity: 0.8 },
            { opacity: 1 }
        ], {
            duration: 120,
            fill: "forwards"
        }).finished;

        // Stay visible: 2000ms
        await new Promise(resolve => setTimeout(resolve, 2600));

        // Move upward: 300ms
        await el.animate([
            {
                transform: "translateY(0) scale(1)"
            },
            {
                transform: "translateY(-70px) scale(1)"
            }
        ], {
            duration: 250,
            easing: "ease-in",
            fill: "forwards"
        }).finished;

        // Shrink and fade: 50ms
        await el.animate([
            {
                transform: "translateY(-70px) scale(1)",
                opacity: 1
            },
            {
                transform: "translateY(-70px) scale(0.5)",
                opacity: 0
            }
        ], {
            duration: 50,
            easing: "ease-in",
            fill: "forwards"
        }).finished;
    }

    window.showCashoutPopup = function (multiplier, amount) {
        const slot = slots.find(item => !item.busy);

        if (!slot) {
            console.log("Both cashout popup slots are busy.");
            return;
        }

        if (!slot.layout || !slot.multiplier || !slot.amount) {
            console.log("Cashout popup HTML elements not found.");
            return;
        }

        slot.busy = true;

        slot.multiplier.textContent =
            Number(multiplier).toFixed(2) + "x";

        slot.amount.textContent = formatAmount(amount);
        const parent = document.getElementById("popup-parent");

        if (slot.layout.id === "cashoutPop1") {
            parent.classList.remove("popup1-gone");
        }
        animatePopup(slot)
            .catch(error => {
                console.log("Popup animation error:", error);
            })
            .finally(() => {
                // সম্পূর্ণ Reset
                slot.layout.getAnimations().forEach(animation => {
                    animation.cancel();
                });

                slot.layout.style.display = "none";
                slot.layout.style.opacity = "";
                slot.layout.style.transform = "";
                slot.layout.style.clipPath = "";
                if (slot.layout.id === "cashoutPop1") {
                    parent.classList.add("popup1-gone");
                }
                slot.busy = false;
            });
    };

    // শুরুতে দুটি Popup-ই Hidden থাকবে
    slots.forEach(slot => {
        if (slot.layout) {
            slot.layout.style.display = "none";
        }
    });

})();

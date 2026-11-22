
(() => {
    // ===============================
    // HISTORY SETTINGS
    // ===============================
    const historyContainer = document.getElementById("history-items");
    const historyOverlay = document.getElementById("history-overlay-layout");
    if (!historyContainer) {
        console.error("History container not found!");
        return;
    }
    // Top bar-এ সর্বোচ্চ History
    const MAX_TOP_HISTORY = 25;
    // Overlay-তে সর্বোচ্চ History
    const MAX_HISTORY = 70;
    let historyList = [];

    // ===============================
    // OVERLAY HISTORY CONTAINER
    // ===============================

    let overlayHistoryContainer = document.getElementById("history-overlay-items");

    // HTML-এ না থাকলে নিজে তৈরি করবে
    if (historyOverlay && !overlayHistoryContainer) {

        overlayHistoryContainer = document.createElement("div");
        overlayHistoryContainer.id = "history-overlay-items";
        historyOverlay.appendChild(
            overlayHistoryContainer
        );
    }

    // ===============================
    // GENERATE RANDOM DEFAULT HISTORY
    // ===============================
    const defaultHistoryCount = Math.floor(Math.random() * 4) + 25;
    for (let i = 0; i < defaultHistoryCount; i++) {
        const randomValue = Math.random();
        let crashPoint;
        if (randomValue < 0.60) {
            // LOW: 1.00x - 1.99x
            crashPoint = 1 + Math.random() * 0.99;
        } else if (randomValue < 0.90) {
            // MEDIUM: 2.00x - 9.99x
            crashPoint = 2 + Math.random() * 7.99;
        } else {
            // HIGH: 10.00x - 28.00x
            crashPoint = 10 + Math.random() * 18;
        }
        historyList.push(
            Number(crashPoint.toFixed(2))
        );
    }

    // ===============================
    // GET RESULT COLOR
    // ===============================
    function getResultColor(value) {

        if (value >= 10) {
            return "history-high";
        }
        if (value >= 2) {
            return "history-medium";
        }
        return "history-low";
    }


    // ===============================
    // ADD CRASH HISTORY
    // ===============================

    function addResult(crashPoint, animate = true) {
        const result = Number(crashPoint);
        if (!Number.isFinite(result)) return;

        // নতুন History সবার আগে যোগ হবে
        historyList.unshift(result);

        // সর্বোচ্চ 70টি History রাখা হবে
        if (historyList.length > MAX_HISTORY) {
            // সবচেয়ে পুরোনো History বাদ যাবে
            historyList.pop();
        }
        renderHistory(animate);
    }

    // ===============================
    // CREATE HISTORY ITEM
    // ===============================
    function createHistoryItem(value, index, animate = false) {
        const item = document.createElement("div");
        item.className = "history-item " + getResultColor(value);
        item.textContent = value.toFixed(2) + "x";

        // ===============================
        // INITIAL ANIMATION POSITION
        // ===============================
        if (index === 0 && animate) {
            item.style.transform = "translateX(-80px) scale(1.3, 1.42)";
            item.style.zIndex = "2";
        } else {
            item.style.transform = "translateX(0px) scale(1, 0.96)";
        }

        // ===============================
        // NEW ITEM ANIMATION
        // ===============================
        if (index === 0 && animate) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Move from left to original position
                    item.style.transition = "transform 600ms cubic-bezier(0, 0, 0.2, 1)";

                    item.style.transform = "translateX(0px) scale(1.3, 1.42)";

                    // Wait before reducing size
                    setTimeout(() => {
                        item.style.transition = "transform 600ms cubic-bezier(0, 0, 0.2, 1)";
                        item.style.transform = "translateX(0px) scale(1, 1)";
                    }, 650);
                });
            });
        }
        return item;
    }


    // ===============================
    // RENDER TOP HISTORY
    // ===============================
    function renderTopHistory(animate = false) {

        historyContainer.innerHTML = "";
        const topHistory = historyList.slice(0, MAX_TOP_HISTORY);

        topHistory.forEach((value, index) => {
            const item = createHistoryItem(
                value,
                index,
                animate
            );
            historyContainer.appendChild(item);
        });
    }

    // ===============================
    // RENDER OVERLAY HISTORY
    // ===============================
    function renderOverlayHistory() {

        if (!overlayHistoryContainer) return;
        overlayHistoryContainer.innerHTML = "";
        const overlayHistory = historyList.slice(0, MAX_HISTORY);

        overlayHistory.forEach((value, index) => {
            const item = createHistoryItem(
                value,
                index,
                false
            );
            overlayHistoryContainer.appendChild(item);
        });
    }


    // ===============================
    // RENDER ALL HISTORY
    // ===============================
    function renderHistory(animate = false) {

        // Top history: maximum 28
        renderTopHistory(animate);

        // Overlay history: maximum 70
        renderOverlayHistory();

    }

    // ===============================
    // INITIAL HISTORY RENDER
    // ===============================
    renderHistory();

    // ===============================
    // PUBLIC CONTROL
    // ===============================
    window.historyManager = {
        addResult,
        getHistory: () => [...historyList]
    };


    // ===============================
    // HISTORY OVERLAY CONTROL
    // ===============================

    const historyButton = document.getElementById("history-right-inner");
    const historyCloseButton = document.getElementById("history-overlay-right");

    if (historyButton && historyOverlay) {
       const horizontalScroll = document.getElementById("horizontal-scroll");
            let scrollHideTimer;
            historyButton.addEventListener("click", (event) => {

                event.stopPropagation();
                historyOverlay.classList.add("active");

                // আগের timer বন্ধ
                clearTimeout(scrollHideTimer);

                // Scroll visible
                horizontalScroll.classList.add("active");

                // 10 seconds পর hide
                scrollHideTimer = setTimeout(() => {
                    horizontalScroll.classList.remove("active");
                }, 7000);
            });


        // Close icon click করলে History বন্ধ হবে
        if (historyCloseButton) {
            historyCloseButton.addEventListener("click", (event) => {
                event.stopPropagation();
                historyOverlay.classList.remove("active");
                horizontalScroll.classList.remove("active");
            });
        }


        // Screen-এর অন্য জায়গায় click করলে History বন্ধ হবে
        document.addEventListener("click", (event) => {
            if (
                historyOverlay.classList.contains("active") &&
                !historyOverlay.contains(event.target)
            ) {
                event.stopPropagation();
                historyOverlay.classList.remove("active");
                horizontalScroll.classList.remove("active");
            }
        });
    }

})();

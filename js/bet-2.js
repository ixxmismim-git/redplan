
/* ==================================================
   BET 2 TABS / BACKSPACE / SWITCHES
================================================== */

(() => {

    const bottomRightLayout =
        document.getElementById("bottom-right-layout");

    const betTab =
        document.getElementById("right-bet-btn");

    const autoBetTab =
        document.getElementById("right-autobet-btn");

    // ==============================
    // BET / AUTOBET TABS
    // ==============================

    betTab.addEventListener("click", function () {

        bottomRightLayout.classList.remove("auto-mode");

        betTab.classList.add("active");
        autoBetTab.classList.remove("active");

    });

    autoBetTab.addEventListener("click", function () {

        bottomRightLayout.classList.add("auto-mode");

        autoBetTab.classList.add("active");
        betTab.classList.remove("active");

    });

    // ==============================
    // BACKSPACE SETUP
    // ==============================

    function setupBackspace(inputId) {

        const input = document.getElementById(inputId);

        if (!input) return;

        input.addEventListener("keydown", function (e) {

            if (e.key === "Backspace") {

                const start = this.selectionStart;
                const end = this.selectionEnd;
                const value = this.value;

                if (start !== end) {

                    e.preventDefault();

                    this.value =
                        value.substring(0, start) +
                        value.substring(end);

                    this.setSelectionRange(start, start);

                    return;
                }

                e.preventDefault();

                if (start > 0) {

                    this.value =
                        value.substring(0, start - 1) +
                        value.substring(start);

                    this.setSelectionRange(start - 1, start - 1);

                } else if (value.length > 0) {

                    this.value = value.substring(1);

                    this.setSelectionRange(0, 0);
                }
            }

        });
    }

    setupBackspace("bet2-amount-input");
    setupBackspace("bet2-cashout-input");

    // ==============================
    // SWITCHES
    // ==============================

    const autoBetSwitch =
        document.getElementById("bet2-auto-bet-switch");

    const cashoutSwitch =
        document.getElementById("bet2-cashout-switch");

    autoBetSwitch.addEventListener("click", function () {

        this.classList.toggle("on");
        this.classList.toggle("off");

    });

    cashoutSwitch.addEventListener("click", function () {

        this.classList.toggle("on");
        this.classList.toggle("off");

    });

})();


// ==================================================
// BET 2 AMOUNT AND BET MANAGEMENT
// ==================================================

(() => {

    // ==============================
    // ELEMENTS
    // ==============================

    const amountInput =
        document.getElementById("bet2-amount-input");

    const betButton =
        document.getElementById("bet2-betBtn");

    const waitingButton =
        document.getElementById("bet2-waitingBtn");

    const cancelButton =
        document.getElementById("bet2-cancelBtn");

    const cashoutButton =
        document.getElementById("bet2-cashoutBtn");

    const cashoutAmountText = document.querySelector(
        "#bet2-cashoutBtn .cashout-amount span"
    );

    const progressLayout =
        document.getElementById("progressLayout");

    // ==============================
    // TIMERS / STATES
    // ==============================

    let cancelRefundTimer = null;
    let cancelInProgress = false;

    let cashoutInProgress = false;
    let cashoutTimer = null;
    let currentMultiplier = 1;
    let pendingBet = false;
    let pendingAmount = 0;
    let pendingRequestId = 0;
    let pendingTimer = null;


    // ==============================
    // AMOUNT FORMAT
    // ==============================

    function formatAmount(amount) {

        return amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    }

    function getAmount() {

        return parseFloat(
            amountInput.value.replace(/,/g, "")
        ) || 0;

    }

    function setAmount(amount) {

        if (amount > 10000) {
            amount = 10000;
        }

        if (amount < 10) {
            amount = 10;
        }

        amountInput.value = formatAmount(amount);

        const betAmountText = document.querySelector(
            "#bet2-betBtn .amount span"
        );

        if (betAmountText) {

            betAmountText.textContent =
                formatAmount(amount);

        }

    }


    // ==============================
    // AMOUNT LAYOUT LOCK
    // ==============================

    function lockAmountLayout() {

        document
            .getElementById("bet2-amount-layout")
            .classList.add("locked");

    }

    function unlockAmountLayout() {

        document
            .getElementById("bet2-amount-layout")
            .classList.remove("locked");

    }


    // ==============================
    // AMOUNT BUTTONS
    // ==============================

    let lastButton = -1;

    const amountButtons = [
        { id: "bet2-btn-100", amount: 100, index: 1 },
        { id: "bet2-btn-200", amount: 200, index: 2 },
        { id: "bet2-btn-500", amount: 500, index: 3 },
        { id: "bet2-btn-10000", amount: 10000, index: 4 }
    ];

    amountButtons.forEach(item => {

        const button = document.getElementById(item.id);

        button.addEventListener("click", function () {

            let currentAmount = getAmount();

            if (lastButton === item.index) {

                currentAmount += item.amount;

            } else {

                currentAmount = item.amount;
                lastButton = item.index;

            }

            setAmount(currentAmount);

        });

    });


    // ==============================
    // PLUS BUTTON (+10)
    // ==============================

    const plusBtn =
        document.getElementById("bet2-right-icon");

    plusBtn.addEventListener("click", function () {

        let amount = getAmount();

        amount += 10;

        setAmount(amount);

    });


    // ==============================
    // MINUS BUTTON (-10)
    // ==============================

    const minusBtn =
        document.getElementById("bet2-left-icon");

    minusBtn.addEventListener("click", function () {

        let amount = getAmount();

        amount -= 10;

        if (amount < 10) {
            amount = 10;
        }

        setAmount(amount);

    });


    // ==============================
    // CHECK PROGRESS VISIBILITY
    // ==============================

    function isProgressVisible() {

        if (!progressLayout) {
            return false;
        }

        return window.getComputedStyle(
            progressLayout
        ).display !== "none";

    }


    // ==============================
    // SHOW BET BUTTON
    // ==============================

    function showBetButton() {

        betButton.style.display = "block";
        waitingButton.style.display = "none";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "none";

    }


    // ==============================
    // SHOW WAITING BUTTON
    // ==============================

    function showWaitingButton() {

        betButton.style.display = "none";
        waitingButton.style.display = "block";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "none";

    }


    // ==============================
    // SHOW CANCEL BUTTON
    // ==============================

    function showCancelButton() {

        betButton.style.display = "none";
        waitingButton.style.display = "none";
        cancelButton.style.display = "block";
        cashoutButton.style.display = "none";

    }


    // ==============================
    // SHOW CASHOUT BUTTON
    // ==============================

    function showCashoutButton() {

        betButton.style.display = "none";
        waitingButton.style.display = "none";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "flex";

    }


    // ==============================
    // RESTORE BET BUTTON
    // ==============================

    function restoreBetButton() {

        if (pendingTimer !== null) {

            clearTimeout(pendingTimer);
            pendingTimer = null;

        }

        pendingBet = false;
        pendingAmount = 0;
        pendingRequestId++;

        const bottomRightLayout =
            document.getElementById("bottom-right-layout");

        if (bottomRightLayout) {

            bottomRightLayout.classList.remove("balance-delay");

        }

        showBetButton();

    }


    // ==============================
    // CANCEL WAITING BET
    // ==============================

    waitingButton.addEventListener("click", function () {

        if (!pendingBet) {
            return;
        }

        restoreBetButton();

        unlockAmountLayout();

        console.log("BET 2 WAITING BET CANCELLED");

    });


    // ==============================
    // CANCEL ACTIVE BET
    // ==============================

    cancelButton.addEventListener("click", function () {

        if (
            cancelInProgress ||
            cashoutInProgress
        ) {
            return;
        }

        const activeBet =
            window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        cancelInProgress = true;

        const bottomRightLayout =
            document.getElementById("bottom-right-layout");

        if (bottomRightLayout) {

            bottomRightLayout.classList.add("balance-delay");

        }

        // Random delay: 50–349ms
        const delay = 50 + Math.floor(Math.random() * 300);

        cancelRefundTimer = setTimeout(() => {

            cancelRefundTimer = null;

            if (bottomRightLayout) {

                bottomRightLayout.classList.remove("balance-delay");

            }

            const result =
                window.balanceManager.cancelBet(2);

            cancelInProgress = false;

            if (!result.success) {

                console.log(
                    "BET 2 CANCEL FAILED:",
                    result.reason
                );

                return;
            }

            unlockRemoveBetLayout();
            showBetButton();
            unlockAmountLayout();

        }, delay);

    });
const removeBetLayout = document.getElementById("right-top-right-corner");

function lockRemoveBetLayout() {
    removeBetLayout.classList.add("locked");
}

function unlockRemoveBetLayout() {
    removeBetLayout.classList.remove("locked");
}

    // ==============================
    // DEDUCT BALANCE
    // ==============================

    function deductBet(amount) {

        const result =
            window.balanceManager.placeBet(2, amount);

        if (!result.success) {

            console.log(
                "BET 2 DEDUCTION FAILED:",
                result.reason
            );

            if (result.reason === "insufficient_balance") {
                if (typeof window.showNoBalancePopup === "function") {
                    window.showNoBalancePopup();
                } else {
                    console.error("showNoBalancePopup function not loaded!");
                }
            }

            restoreBetButton();

            unlockAmountLayout();

            return false;
        }

        lockRemoveBetLayout();
        pendingBet = false;
        pendingAmount = 0;
        pendingTimer = null;

        console.log(
            "BET 2 ACCEPTED:",
            amount,
            "NEW BALANCE:",
            result.balance
        );

        showCancelButton();

        return true;

    }


    // ==============================
    // PROCESS PENDING BET
    // ==============================

    function processPendingBet() {

        if (!pendingBet) return;

        if (!isProgressVisible()) return;

        if (pendingTimer !== null) return;

        const requestId = pendingRequestId;
        const amount = pendingAmount;

        if (
            !pendingBet ||
            requestId !== pendingRequestId
        ) {
            return;
        }

        const bottomRightLayout =
            document.getElementById("bottom-right-layout");

        // Cancel Button এবং Shadow একসাথে দেখাবে
        showCancelButton();

        if (bottomRightLayout) {

            bottomRightLayout.classList.add("balance-delay");

        }

        // Random delay: 300–599ms
        const delay = 300 + Math.floor(Math.random() * 300);

        pendingTimer = setTimeout(() => {

            if (bottomRightLayout) {

                bottomRightLayout.classList.remove("balance-delay");

            }

            pendingTimer = null;

            if (
                !pendingBet ||
                requestId !== pendingRequestId
            ) {
                return;
            }

            // Shadow চলে যাওয়ার পর Balance কাটবে
            deductBet(amount);

        }, delay);

    }


    // ==============================
    // BET BUTTON CLICK
    // ==============================

    betButton.addEventListener("click", function () {

        if (
            cancelInProgress ||
            cancelRefundTimer !== null ||
            cashoutInProgress
        ) {
            return;
        }

        if (pendingBet) {
            return;
        }

        if (
            window.balanceManager.getActiveBet(2) !== null
        ) {
            return;
        }

        const amount = getAmount();

        setAmount(amount);

        // FIRST: BALANCE CHECK
        const check =
            window.balanceManager.canPlaceBet(2, amount);

        if (!check.success) {

            if (check.reason === "insufficient_balance") {

                if (typeof window.showNoBalancePopup === "function") {
                    window.showNoBalancePopup();
                } else {
                    console.error("showNoBalancePopup function not loaded!");
                }

            }

            return;
        }

        // AMOUNT LAYOUT LOCK
        lockAmountLayout();

        console.log("BET 2 CLICKED");

        // CASE 1: PROGRESS VISIBLE
        if (isProgressVisible()) {

            pendingBet = true;
            pendingAmount = amount;
            pendingRequestId++;

            processPendingBet();

            return;
        }

        // CASE 2: FLYING OR CRASHED
        pendingBet = true;
        pendingAmount = amount;
        pendingRequestId++;

        showWaitingButton();

        console.log(
            "BET 2 PENDING:",
            pendingAmount
        );

    });


    // ==============================
    // ROUND WAITING START EVENT
    // ==============================

    window.addEventListener("roundWaitingStart", function () {

        console.log("BET 2: ROUND WAITING START EVENT");

        processPendingBet();

    });


    // ==============================
    // ROUND START EVENT
    // ==============================

    window.addEventListener("roundStarted", function () {

        if (
            cancelInProgress ||
            cashoutInProgress
        ) {
            return;
        }

        const activeBet =
            window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        console.log("BET 2 ROUND STARTED");
        currentMultiplier = 1;
        showCashoutButton();

        if (cashoutAmountText) {

            cashoutAmountText.textContent =
                formatAmount(activeBet.amount);

        }

    });


    // ==============================
    // CASHOUT BUTTON
    // ==============================


cashoutButton.addEventListener("click", function () {

    if (
        cancelInProgress ||
        cancelRefundTimer !== null ||
        cashoutInProgress
    ) {
        return;
    }

    const activeBet =
        window.balanceManager.getActiveBet(2);

    if (activeBet === null) {
        return;
    }

    // Click করার মুহূর্তের Amount ধরে রাখবে
    const payout = cashoutAmountText
        ? Number(
            cashoutAmountText.textContent.replace(/,/g, "")
        )
        : activeBet.amount;

    if (!Number.isFinite(payout)) {
        return;
    }

    const cashoutMultiplier = currentMultiplier;

    cashoutInProgress = true;

    const bottomRightLayout =
        document.getElementById("bottom-right-layout");

    // Shadow দেখাবে
    if (bottomRightLayout) {
        bottomRightLayout.classList.add("balance-delay");
    }

    // Random delay: 100–500ms
    const delay = 100 + Math.floor(Math.random() * 401);

    cashoutTimer = setTimeout(() => {

        cashoutTimer = null;

        // Cashout সম্পন্ন
        const result =
            window.balanceManager.cashoutBet(2, payout);

        // Shadow সরাবে
        if (bottomRightLayout) {
            bottomRightLayout.classList.remove("balance-delay");
        }

        cashoutInProgress = false;

        if (!result.success) {
            console.log(
                "BET 2 CASHOUT FAILED:",
                result.reason
            );
            return;
        }

        console.log(
            "BET 2 CASHOUT SUCCESS:",
            result.payout
        );

        // আগের Layout Unlock
        unlockRemoveBetLayout();

        // Cashout Button সরিয়ে Bet Button দেখাবে
        showBetButton();

        // Amount Unlock
        unlockAmountLayout();

        // শুধু সফল Cashout হলে Popup দেখাবে
        if (typeof window.showCashoutPopup === "function") {
            window.showCashoutPopup(
                cashoutMultiplier.toFixed(2),
                payout.toFixed(2)
            );
        } else {
            console.error("showCashoutPopup function not loaded!");
        }

    }, delay);

});



    // ==============================
    // MULTIPLIER UPDATE EVENT
    // ==============================

    window.addEventListener("roundMultiplierUpdate", function (event) {

        // Cashout চলাকালে Amount Update হবে না
        if (cashoutInProgress) {
            return;
        }

        const activeBet =
            window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        const multiplier = event.detail.multiplier;
        const cashoutAmount = activeBet.amount * multiplier;
currentMultiplier = Number(multiplier);
        if (cashoutAmountText) {

            cashoutAmountText.textContent =
                formatAmount(cashoutAmount);

        }

    });


    // ==============================
    // ROUND CRASH EVENT
    // ==============================

    window.addEventListener("roundCrashed", function () {

        // Cancel বা Cashout চলমান থাকলে Crash logic চলবে না
        if (
            cancelInProgress ||
            cashoutInProgress
        ) {
            return;
        }

        const bottomRightLayout =
            document.getElementById("bottom-right-layout");

        // Shadow সরাবে
        if (bottomRightLayout) {

            bottomRightLayout.classList.remove("balance-delay");

        }

        // Cashout Button লুকাবে
        cashoutButton.style.display = "none";

        // Active Bet হারাবে
        const result =
            window.balanceManager.loseBet(2);

        if (result.success) {

            unlockRemoveBetLayout();
            // Bet Button দেখাবে
            showBetButton();

            // Amount Unlock করবে
            unlockAmountLayout();

            console.log("BET 2: READY FOR NEXT ROUND");

        }

    });


    // ==============================
    // INITIAL BUTTON STATE
    // ==============================

    showBetButton();


    // ==============================
    // INITIAL AMOUNT FORMAT
    // ==============================

    setAmount(getAmount());

})();





// REMOVE BET 2 LAYOUT
(() => {

    const addLayout = document.getElementById("left-top-right-corner");
    const removeLayout = document.getElementById("right-top-right-corner");
    const rightLayout = document.getElementById("bottom-right-layout");

    const waitingBtn = document.getElementById("bet2-waitingBtn");
    const cancelBtn = document.getElementById("bet2-cancelBtn");

    if (!removeLayout) return;

    removeLayout.addEventListener("click", function () {

        // Waiting অবস্থায় থাকলে Waiting cancel হবে
        if (waitingBtn && waitingBtn.offsetParent !== null) {
            waitingBtn.click();
        }

        // Cancel অবস্থায় থাকলে Refund হবে
        else if (cancelBtn && cancelBtn.offsetParent !== null) {
            cancelBtn.click();
        }

        // Layout remove
        removeLayout.style.display = "none";

        if (addLayout) {
            addLayout.style.display = "flex";
        }

        if (rightLayout) {
            rightLayout.style.display = "none";
        }

    });

})();
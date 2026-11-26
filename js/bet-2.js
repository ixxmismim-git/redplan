
// ==================================================
// BET 2 AMOUNT AND BET MANAGEMENT
// ==================================================
(() => {
    const amountInput = document.getElementById("bet2-amount-input");
    const betButton = document.getElementById("bet2-betBtn");
    const waitingButton = document.getElementById("bet2-waitingBtn");
    const cancelButton = document.getElementById("bet2-cancelBtn");
    const cashoutButton = document.getElementById("bet2-cashoutBtn");
    const cashoutAmountText = document.querySelector(
        "#bet2-cashoutBtn .cashout-amount span"
    );
    const progressLayout = document.getElementById("progressLayout");
    const plusBtn = document.getElementById("bet2-right-icon");
    const minusBtn = document.getElementById("bet2-left-icon");
    const autoBetSwitch = document.getElementById("bet2-auto-bet-switch");

    // ==============================
    // TIMERS / STATES
    // ==============================
    let cancelRefundTimer = null;
    let cancelInProgress = false;
    let cashoutInProgress = false;
    let cashoutTimer = null;
    let currentMultiplier = 1;
    let autoCashoutTarget = null;
    let autoCashoutCancelled = false;

    let pendingBet = false;
    let pendingAmount = 0;
    let pendingRequestId = 0;
    let pendingTimer = null;
    let autoBetStopRequested = false;
    let autoBetSwitchLock = false;
    let cashoutButtonVisible = false;


    // ==============================
    // AMOUNT LAYOUT LOCK UNLOCK
    // ==============================
    function lockAmountLayout() {
        document.getElementById("bet2-amount-layout").classList.add("locked");
        const cashoutSwitch = document.getElementById("bet2-cashout-switch");
        const cashoutRight = document.getElementById("bet2-cashout-right");
        const cashoutInput = document.getElementById("bet2-cashout-input");
        cashoutSwitch.classList.add("bet-locked");
        if (cashoutSwitch.classList.contains("on")) {
            cashoutRight.classList.add("bet-locked");
        }
        cashoutInput.disabled = true;
    }


    function unlockAmountLayout() {
        document.getElementById("bet2-amount-layout").classList.remove("locked");
        const cashoutSwitch = document.getElementById("bet2-cashout-switch");
        const cashoutRight = document.getElementById("bet2-cashout-right");
        const cashoutInput = document.getElementById("bet2-cashout-input");
        cashoutSwitch.classList.remove("bet-locked");
        cashoutRight.classList.remove("bet-locked");
        cashoutInput.disabled =!cashoutSwitch.classList.contains("on");
        window.unlockBet2RemoveLayout();
    }


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
            betAmountText.textContent = formatAmount(amount);
        }
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


    // PLUS BUTTON (+10)
    plusBtn.addEventListener("click", function () {
        let amount = getAmount();
        amount += 10;
        setAmount(amount);
    });


    // MINUS BUTTON (-10)
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
        return window.getComputedStyle(progressLayout).display !== "none";
    }


    // ==============================
    // SHOW BET BUTTON
    // ==============================
    function showBetButton() {
        cashoutButtonVisible = false;
        betButton.style.display = "block";
        waitingButton.style.display = "none";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "none";
    }


    // ==============================
    // SHOW WAITING BUTTON
    // ==============================
    function showWaitingButton() {
        cashoutButtonVisible = false;
        betButton.style.display = "none";
        waitingButton.style.display = "block";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "none";
    }


    // ==============================
    // SHOW CANCEL BUTTON
    // ==============================
    function showCancelButton() {
        cashoutButtonVisible = false;
        betButton.style.display = "none";
        waitingButton.style.display = "none";
        cancelButton.style.display = "block";
        cashoutButton.style.display = "none";
    }


    // ==============================
    // SHOW CASHOUT BUTTON
    // ==============================
    function showCashoutButton() {
        cashoutButtonVisible = true;
        betButton.style.display = "none";
        waitingButton.style.display = "none";
        cancelButton.style.display = "none";
        cashoutButton.style.display = "flex";
    }

    
    // ==============================
    // START CASHOUT
    // ==============================
    function startCashout(isAuto = false, targetMultiplier = null) {

        if (
            cancelInProgress ||
            cancelRefundTimer !== null ||
            cashoutInProgress
        ) {
            return;
        }

        const activeBet = window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        // Manual Cashout হলে Auto Cashout বাতিল
        if (!isAuto) {
            autoCashoutCancelled = true;
            autoCashoutTarget = null;
        }

        // Auto Cashout-এর নির্দিষ্ট Target
        const cashoutMultiplier = isAuto
            ? Number(Number(targetMultiplier).toFixed(2))
            : Number(currentMultiplier.toFixed(2));

        // Target অনুযায়ী Payout হিসাব
        const payout = Number(
            (activeBet.amount * cashoutMultiplier).toFixed(2)
        );

        // Auto Cashout শুরু হলে Target Reset
        if (isAuto) {
            autoCashoutTarget = null;
        }

        cashoutInProgress = true;

        const bottomRightLayout = document.getElementById("bottom-right-layout");

        if (bottomRightLayout) {
            bottomRightLayout.classList.add("balance-delay");
        }

        // ==============================
        // COMPLETE CASHOUT
        // ==============================
        function completeCashout() {

            cashoutTimer = null;

            const result = window.balanceManager.cashoutBet(2, payout);

            if (bottomRightLayout) {
                bottomRightLayout.classList.remove("balance-delay");
            }

            cashoutInProgress = false;

            if (!result.success) {
                console.log("BET 2 CASHOUT FAILED:", result.reason);
                return;
            }

            console.log(
                isAuto
                    ? "BET 2 AUTO CASHOUT SUCCESS:"
                    : "BET 2 MANUAL CASHOUT SUCCESS:",
                result.payout,
                "AT:",
                cashoutMultiplier
            );

            if (typeof window.showCashoutPopup === "function") {
                window.showCashoutPopup(
                    cashoutMultiplier.toFixed(2),
                    payout.toFixed(2)
                );
            }

            // AUTO BET NEXT ROUND
            // AUTO BET NEXT ROUND
            if (autoBetSwitch.classList.contains("on")) {
                window.unlockBet2RemoveLayout();
                const nextBet = placeBet2();
                if (nextBet === false) {
                    autoBetSwitch.classList.remove("on");
                    autoBetSwitch.classList.add("off");
                    showBetButton();
                    unlockAmountLayout();
                }
            } else {
                showBetButton();
                unlockAmountLayout();
            }
        }

        // ==============================
        // AUTO / MANUAL DELAY
        // ==============================
        if (isAuto) {

            // Auto Cashout: কোনো Delay নেই
            completeCashout();

        } else {

            // Manual Cashout: শুধু Button Click-এ Delay
            const delay = 100 + Math.floor(Math.random() * 400);

            cashoutTimer = setTimeout(() => {
                completeCashout();
            }, delay);
        }
    }


    // ==============================
    // CASHOUT BUTTON
    // ==============================
    cashoutButton.addEventListener("click", function () {
        startCashout(false);
    });



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

        const bottomRightLayout = document.getElementById("bottom-right-layout");
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

        // AUTO BET SWITCH OFF
        if (autoBetSwitch.classList.contains("on")) {
            autoBetStopRequested = false;
            autoBetSwitch.classList.remove("on");
            autoBetSwitch.classList.add("off");
        }
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

        const activeBet = window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        cancelInProgress = true;

        const bottomRightLayout = document.getElementById("bottom-right-layout");

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

            const result = window.balanceManager.cancelBet(2);

            cancelInProgress = false;

            if (!result.success) {
                console.log(
                    "BET 2 CANCEL FAILED:",
                    result.reason
                );

                autoBetStopRequested = false;
                return;
            }

            showBetButton();
            unlockAmountLayout();

            // AUTO BET SWITCH OFF
            if (autoBetSwitch.classList.contains("on")) {
                autoBetStopRequested = false;
                autoBetSwitch.classList.remove("on");
                autoBetSwitch.classList.add("off");
            }

        }, delay);
    });


    // ==============================
    // DEDUCT BALANCE
    // ==============================
    function deductBet(amount) {
        const result = window.balanceManager.placeBet(2, amount);
        if (!result.success) {
            console.log("BET 2 DEDUCTION FAILED:", result.reason);
            if (result.reason === "insufficient_balance") {
                window.showNoBalancePopup();
            }
            restoreBetButton();
            return false;
        }

        pendingBet = false;
        pendingAmount = 0;
        pendingTimer = null;

        console.log(
            "BET 2 ACCEPTED:",
            amount,
            "NEW BALANCE:",
            result.balance
        );
        window.lockBet2RemoveLayout();
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

        if (!pendingBet || requestId !== pendingRequestId) {
            return;
        }

        if (!isProgressVisible()) return;

        const bottomRightLayout = document.getElementById("bottom-right-layout");

        // Waiting Button এবং Shadow একসাথে দেখাবে
        showWaitingButton();

        if (bottomRightLayout) {
            bottomRightLayout.classList.add("balance-delay");
        }

        // Random delay: 100–599ms
        const delay = 100 + Math.floor(Math.random() * 500);

        pendingTimer = setTimeout(() => {

            if (bottomRightLayout) {
                bottomRightLayout.classList.remove("balance-delay");
            }

            pendingTimer = null;

            if (!pendingBet || requestId !== pendingRequestId) {
                return;
            }

            // Betting Time শেষ হলে Bet নেওয়া হবে না
            if (!isProgressVisible()) {

                pendingBet = false;
                pendingAmount = 0;
                pendingRequestId++;

                showBetButton();
                unlockAmountLayout();

                console.log("BET 2 STATE TIMEOUT: BET NOT ACCEPTED");

                if (typeof window.showStateTimeoutPopup === "function") {
                    window.showStateTimeoutPopup();
                }

                return;
            }

            // সময় ঠিক থাকলে Balance কাটবে
            if (!pendingBet || requestId !== pendingRequestId) {
                return;
            }

            deductBet(amount);

        }, delay);
    }


    // ==============================
    // PLACE BET 2 FUNCTION
    // ==============================
    function placeBet2() {

        if (cancelInProgress || cancelRefundTimer !== null || cashoutInProgress) {
            return false;
        }

        if (pendingBet) {
            return false;
        }

        if (window.balanceManager.getActiveBet(2) !== null) {
            return false;
        }

        // GET BET AMOUNT
        const amount = getAmount();
        setAmount(amount);

        // BALANCE CHECK
        const check = window.balanceManager.canPlaceBet(2, amount);

        if (!check.success) {
            if (check.reason === "insufficient_balance") {
                if (typeof window.showNoBalancePopup === "function") {
                    window.showNoBalancePopup();
                }
            }
            return false;
        }

        // AUTO CASHOUT TARGET SETUP
        const cashoutSwitch = document.getElementById("bet2-cashout-switch");
        const cashoutInput = document.getElementById("bet2-cashout-input");

        autoCashoutTarget = null;
        autoCashoutCancelled = false;

        if (cashoutSwitch.classList.contains("on")) {
            validateAutoCashoutValue2();
            autoCashoutTarget = parseFloat(cashoutInput.value);
            console.log("BET 2 AUTO CASHOUT TARGET:", autoCashoutTarget);
        }

        // AMOUNT LAYOUT LOCK
        lockAmountLayout();

        // PROGRESS VISIBLE
        if (isProgressVisible()) {
            pendingBet = true;
            pendingAmount = amount;
            pendingRequestId++;
            processPendingBet();
            return true;
        }

        // FLYING OR CRASHED
        pendingBet = true;
        pendingAmount = amount;
        pendingRequestId++;

        showWaitingButton();

        console.log("BET 2 PENDING:", pendingAmount);

        return true;
    }

    // ==============================
    // BET BUTTON CLICK
    // ==============================
    betButton.addEventListener("click", function () {
        placeBet2();
    });

    // ==============================
    // SWITCHES
    // ==============================
    if (autoBetSwitch) {
        autoBetSwitch.addEventListener("click", function () {

            if (autoBetSwitchLock) {
                return;
            }

            // SWITCH OFF → ON
            if (!this.classList.contains("on")) {
                this.classList.remove("off");
                this.classList.add("on");

                autoBetStopRequested = false;

                // আগে থেকেই Bet Pending অথবা Active থাকলে নতুন Bet হবে না
                if (
                    pendingBet ||
                    window.balanceManager.getActiveBet(2) !== null
                ) {
                    return;
                }

                const result = placeBet2();

                if (result === false) {
                    this.classList.remove("on");
                    this.classList.add("off");
                }

                return;
            }

            // SWITCH ON → OFF REQUEST

            // CASHOUT BUTTON দৃশ্যমান থাকলে শুধু Switch OFF
            if (
                cashoutButtonVisible ||
                cashoutInProgress ||
                cashoutTimer !== null
            ) {
                this.classList.remove("on");
                this.classList.add("off");
                autoBetStopRequested = false;
                return;
            }

            const activeBet = window.balanceManager.getActiveBet(2);

            // ACTIVE BET CANCEL
            if (activeBet !== null) {
                autoBetStopRequested = true;
                cancelButton.click();
                return;
            }

            // WAITING BET CANCEL
            if (pendingBet) {
                autoBetStopRequested = true;
                waitingButton.click();
                return;
            }

            this.classList.remove("on");
            this.classList.add("off");
        });
    }

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
        if (cancelInProgress || cashoutInProgress) {
            return;
        }
        const activeBet = window.balanceManager.getActiveBet(2);
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
    // MULTIPLIER UPDATE EVENT
    // ==============================
    window.addEventListener("roundMultiplierUpdate", function (event) {

        if (cashoutInProgress) {
            return;
        }

        const activeBet = window.balanceManager.getActiveBet(2);

        if (activeBet === null) {
            return;
        }

        const actualMultiplier = Number(event.detail.multiplier);

        if (!Number.isFinite(actualMultiplier)) {
            return;
        }

        // Auto Cashout Check
        if (
            autoCashoutTarget !== null &&
            !autoCashoutCancelled &&
            !cashoutInProgress &&
            actualMultiplier >= autoCashoutTarget
        ) {
            // নির্দিষ্ট Target-এ Cashout
            currentMultiplier = autoCashoutTarget;

            const targetPayout = Number(
                (activeBet.amount * autoCashoutTarget).toFixed(2)
            );

            if (cashoutAmountText) {
                cashoutAmountText.textContent = formatAmount(targetPayout);
            }

            startCashout(true, autoCashoutTarget);
            return;
        }

        // Normal Multiplier Display
        const multiplier = Number(actualMultiplier.toFixed(2));

        currentMultiplier = multiplier;

        const cashoutAmount = Number(
            (activeBet.amount * multiplier).toFixed(2)
        );

        if (cashoutAmountText) {
            cashoutAmountText.textContent = formatAmount(cashoutAmount);
        }

    });


    // ==============================
    // ROUND CRASH EVENT
    // ==============================
    // ==============================
    // ROUND CRASH EVENT
    // ==============================
    window.addEventListener("roundCrashed", function () {

        if (cancelInProgress || cashoutInProgress) return;

        const bottomRightLayout = document.getElementById("bottom-right-layout");

        if (bottomRightLayout) {
            bottomRightLayout.classList.remove("balance-delay");
        }

        const activeBet = window.balanceManager.getActiveBet(2);

        if (activeBet !== null) {
            const result = window.balanceManager.loseBet(2);

            if (result.success) {
                console.log("BET 2 LOST:", result.lostAmount);
            }
        }

        if (autoBetSwitch.classList.contains("on")) {

            // শুধু Remove Layout Unlock
            window.unlockBet2RemoveLayout();

            // আগে থেকেই Pending Bet থাকলে নতুন Bet নয়
            if (!pendingBet) {
                const result = placeBet2();

                if (result === false) {
                    autoBetSwitch.classList.remove("on");
                    autoBetSwitch.classList.add("off");
                    showBetButton();
                    unlockAmountLayout();
                }
            }

        } else {
            showBetButton();
            unlockAmountLayout();
        }

        console.log("BET 2: READY FOR NEXT ROUND");

    });


    // INITIAL BUTTON STATE
    showBetButton();

    // INITIAL AMOUNT FORMAT
    setAmount(getAmount());

})();




// ==================================================
// REMOVE BET 2 LAYOUT
// ==================================================
(() => {
    const addLayout = document.getElementById("left-top-right-corner");
    const removeLayout = document.getElementById("right-top-right-corner");
    const rightLayout = document.getElementById("bottom-right-layout");
    const waitingBtn = document.getElementById("bet2-waitingBtn");
    const cancelBtn = document.getElementById("bet2-cancelBtn");
    const cashoutSwitch = document.getElementById("bet2-cashout-switch");
    const autoBetSwitch = document.getElementById("bet2-auto-bet-switch");
    const betTab = document.getElementById("right-bet-btn");
    const autoBetTab = document.getElementById("right-autobet-btn");

    if (!removeLayout) return;

    // LOCK / UNLOCK
    window.lockBet2RemoveLayout = () => removeLayout.classList.add("locked");
    window.unlockBet2RemoveLayout = () => removeLayout.classList.remove("locked");

    removeLayout.addEventListener("click", function () {

        // Waiting Bet Cancel
        if (waitingBtn && waitingBtn.offsetParent !== null) {
            waitingBtn.click();
        }

        // Active Bet Refund
        else if (cancelBtn && cancelBtn.offsetParent !== null) {
            cancelBtn.click();
        }

        // Auto Cashout OFF
        if (cashoutSwitch && cashoutSwitch.classList.contains("on")) {
            cashoutSwitch.click();
        }

        // Auto Bet OFF
        if (autoBetSwitch && autoBetSwitch.classList.contains("on")) {
            autoBetSwitch.click();
        }

        // Auto Tab থেকে Bet Tab
        if (autoBetTab && autoBetTab.classList.contains("active")) {
            betTab.click();
        }

        // Layout Remove
        window.unlockBet2RemoveLayout();
        removeLayout.style.display = "none";

        if (addLayout) addLayout.style.display = "flex";
        if (rightLayout) rightLayout.style.display = "none";
    });
})();




/* ==================================================
   BET 2 TABS / BACKSPACE / SWITCHES / AUTO CASHOUT
================================================== */
(() => {
    const bottomRightLayout = document.getElementById("bottom-right-layout");
    const betTab = document.getElementById("right-bet-btn");
    const autoBetTab = document.getElementById("right-autobet-btn");

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

        input.addEventListener("beforeinput", function (e) {
            if (e.inputType !== "deleteContentBackward") return;

            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;

            if (start !== end) {
                e.preventDefault();

                this.value =
                    value.substring(0, start) +
                    value.substring(end);

                this.setSelectionRange(start, start);

            } else if (start > 0) {
                e.preventDefault();

                this.value =
                    value.substring(0, start - 1) +
                    value.substring(start);

                this.setSelectionRange(start - 1, start - 1);

            } else if (value.length > 0) {
                e.preventDefault();

                this.setSelectionRange(value.length, value.length);
            }

            if (e.defaultPrevented) {
                this.dispatchEvent(new Event("input", {
                    bubbles: true
                }));
            }
        });
    }

    setupBackspace("bet2-amount-input");
    setupBackspace("bet2-cashout-input");




    // ==============================
    // AUTO CASHOUT ELEMENTS
    // ==============================
    const cashoutSwitch = document.getElementById("bet2-cashout-switch");
    const cashoutInput = document.getElementById("bet2-cashout-input");
    const cashoutRight = document.getElementById("bet2-cashout-right");
    const cashoutIcon = document.getElementById("bet2-cashout-icon");
    const autoBetLayout = document.getElementById("right-top-autobet");

    // ==============================
    // AUTO CASHOUT VALUE VALIDATION
    // ==============================
    window.validateAutoCashoutValue2 = function () {
        let value = parseFloat(cashoutInput.value.trim());

        if (isNaN(value)) {
            value = 1.01;
        }

        if (value <= 1.00) {
            value = 1.01;
        } else if (value > 100.00) {
            value = 100.00;
        }

        cashoutInput.value = value.toFixed(2);
    };

    // ==============================
    // AUTO CASHOUT SWITCH
    // ==============================
    function setAutoCashout2(enabled) {
        if (!enabled) {
            window.validateAutoCashoutValue2();
        }

        cashoutSwitch.classList.toggle("on", enabled);
        cashoutSwitch.classList.toggle("off", !enabled);
        cashoutInput.disabled = !enabled;
        cashoutRight.classList.toggle("locked", !enabled);
        cashoutIcon.style.pointerEvents = enabled ? "auto" : "none";

        // ON = AutoBet locked
        // OFF = AutoBet unlocked
        autoBetLayout.classList.toggle("locked", enabled);
    }

    // ==============================
    // DEFAULT OFF
    // ==============================
    setAutoCashout2(false);

    // ==============================
    // SWITCH CLICK
    // ==============================
    cashoutSwitch.addEventListener("click", function () {
        const enabled = !cashoutSwitch.classList.contains("on");
        setAutoCashout2(enabled);
    });

    // ==============================
    // ICON CLICK
    // ==============================
    cashoutIcon.addEventListener("click", function () {
        window.validateAutoCashoutValue2();
    });

})();

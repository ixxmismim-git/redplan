

/* ==================================================
   BET 2 TABS / BACKSPACE / SWITCHES
================================================== */
(() => {
    const bottomLeftLayout = document.getElementById("bottom-left-layout");
    const betBtn = document.getElementById("left-bet-btn");
    const autoBetBtn = document.getElementById("left-autobet-btn");
    
    // ==============================
    // BET / AUTOBET TABS
    // ==============================
    betBtn.addEventListener("click", function () {
        bottomLeftLayout.classList.remove("auto-mode");
        betBtn.classList.add("active");
        autoBetBtn.classList.remove("active");
    });

    autoBetBtn.addEventListener("click", function () {
        bottomLeftLayout.classList.add("auto-mode");
        autoBetBtn.classList.add("active");
        betBtn.classList.remove("active");
    });

  // ===============================
  // BACKSPACE SETUP
  // ===============================
  function setupBackspace(inputId) {
      const input = document.getElementById(inputId);
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

  setupBackspace("bet1-amount-input");
  setupBackspace("bet1-cashout-input");

  // ===============================
  // SWITCHES
  // ===============================
  const autoBetSwitch = document.getElementById("bet1-auto-bet-switch");
  const cashoutSwitch = document.getElementById("bet1-cashout-switch");

  autoBetSwitch.addEventListener("click", function () {
      this.classList.toggle("on");
      this.classList.toggle("off");
  });

})();



// ==================================================
// BET 1 AMOUNT AND BET MANAGEMENT
// ==================================================
(() => {
    const amountInput = document.getElementById("bet1-amount-input");
    const betButton = document.getElementById("betBtn");
    const waitingButton = document.getElementById("waitingBtn");
    const cancelButton = document.getElementById("cancelBtn");
    const cashoutButton = document.getElementById("cashoutBtn");
    const cashoutAmountText = document.querySelector(
        "#cashoutBtn .cashout-amount span"
    );
    const progressLayout = document.getElementById("progressLayout");
    const plusBtn = document.getElementById("bet1-right-icon");
    const minusBtn = document.getElementById("bet1-left-icon");

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


    // ==============================
    // AMOUNT LAYOUT LOCK UNLOCK
    // ==============================
    function lockAmountLayout() {
        document.getElementById("amount-layout").classList.add("locked");
        const cashoutSwitch = document.getElementById("bet1-cashout-switch");
        const cashoutRight = document.getElementById("bet1-cashout-right");
        const cashoutInput = document.getElementById("bet1-cashout-input");
        cashoutSwitch.classList.add("bet-locked");
        if (cashoutSwitch.classList.contains("on")) {
            cashoutRight.classList.add("bet-locked");
        }
        cashoutInput.disabled = true;
    }


    function unlockAmountLayout() {
        document.getElementById("amount-layout").classList.remove("locked");
        const cashoutSwitch = document.getElementById("bet1-cashout-switch");
        const cashoutRight = document.getElementById("bet1-cashout-right");
        const cashoutInput = document.getElementById("bet1-cashout-input");
        cashoutSwitch.classList.remove("bet-locked");
        cashoutRight.classList.remove("bet-locked");
        cashoutInput.disabled = !cashoutSwitch.classList.contains("on");
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
            "#betBtn .amount span"
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
        { id: "btn-100", amount: 100, index: 1 },
        { id: "btn-200", amount: 200, index: 2 },
        { id: "btn-500", amount: 500, index: 3 },
        { id: "btn-10000", amount: 10000, index: 4 }
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
        cashoutButton.style.display = "block";
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

        const activeBet = window.balanceManager.getActiveBet(1);

        if (activeBet === null) {
            return;
        }

        // Manual Cashout হলে Auto Cashout বাতিল
        if (!isAuto) {
            autoCashoutCancelled = true;
            autoCashoutTarget = null;
        }

        // Auto অথবা Manual Cashout Multiplier
        const cashoutMultiplier = isAuto
            ? Number(Number(targetMultiplier).toFixed(2))
            : Number(currentMultiplier.toFixed(2));

        // নির্দিষ্ট Multiplier অনুযায়ী Payout
        const payout = Number(
            (activeBet.amount * cashoutMultiplier).toFixed(2)
        );

        // Auto Cashout Target Reset
        if (isAuto) {
            autoCashoutTarget = null;
        }

        cashoutInProgress = true;

        const bottomLeftLayout = document.getElementById("bottom-left-layout");

        // Shadow দেখাবে
        if (bottomLeftLayout) {
            bottomLeftLayout.classList.add("balance-delay");
        }

        // ==============================
        // COMPLETE CASHOUT
        // ==============================
        function completeCashout() {

            cashoutTimer = null;

            const result = window.balanceManager.cashoutBet(1, payout);

            // Shadow সরাবে
            if (bottomLeftLayout) {
                bottomLeftLayout.classList.remove("balance-delay");
            }

            cashoutInProgress = false;

            if (!result.success) {
                console.log("CASHOUT FAILED:", result.reason);
                return;
            }

            console.log(
                isAuto
                    ? "AUTO CASHOUT SUCCESS:"
                    : "MANUAL CASHOUT SUCCESS:",
                result.payout
            );

            // Cashout Button সরিয়ে Bet Button দেখাবে
            showBetButton();

            // Amount Unlock
            unlockAmountLayout();

            // Cashout Popup
            if (typeof window.showCashoutPopup === "function") {
                window.showCashoutPopup(
                    cashoutMultiplier.toFixed(2),
                    payout.toFixed(2)
                );
            }
        }

        // ==============================
        // AUTO / MANUAL DELAY
        // ==============================
        if (isAuto) {

            // Auto Cashout: কোনো Delay নেই
            completeCashout();

        } else {

            // Manual Cashout: 100–500ms Delay
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

        const bottomLeftLayout = document.getElementById("bottom-left-layout");
        if (bottomLeftLayout) {
            bottomLeftLayout.classList.remove("balance-delay");
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
        console.log("BET 1 WAITING BET CANCELLED");
    });

    // ==============================
    // CANCEL ACTIVE BET
    // ==============================
    cancelButton.addEventListener("click", function () {
        if (cancelInProgress) {
            return;
        }
        const activeBet = window.balanceManager.getActiveBet(1);
        if (activeBet === null) {
            return;
        }
        cancelInProgress = true;
        const bottomLeftLayout = document.getElementById("bottom-left-layout");
        if (bottomLeftLayout) {
            bottomLeftLayout.classList.add("balance-delay");
        }
        
        // Random delay: 50–349ms
        const delay = 50 + Math.floor(Math.random() * 300);
        cancelRefundTimer = setTimeout(() => {
            cancelRefundTimer = null;
            if (bottomLeftLayout) {
                bottomLeftLayout.classList.remove("balance-delay");
            }
            const result = window.balanceManager.cancelBet(1);
            cancelInProgress = false;
            if (!result.success) {
                console.log("BET 1 CANCEL FAILED:", result.reason);
                return;
            }
            console.log(
                "BET 1 CANCELLED",
                "REFUNDED:",
                result.balance
            );
            showBetButton();
            unlockAmountLayout();
        }, delay);
    });

    // ==============================
    // DEDUCT BALANCE
    // ==============================
    function deductBet(amount) {
        const result = window.balanceManager.placeBet(1, amount);
        if (!result.success) {
            console.log("BET 1 DEDUCTION FAILED:", result.reason);
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
            "BET 1 ACCEPTED:",
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
        if (!pendingBet || requestId !== pendingRequestId) {
            return;
        }
        if (!isProgressVisible()) return;
        const bottomLeftLayout = document.getElementById("bottom-left-layout");
        // CancelLayout এবং Shadow একসাথে দেখাও
        showCancelButton();
        if (bottomLeftLayout) {
            bottomLeftLayout.classList.add("balance-delay");
        }
        // Random delay: 500–1000ms
        const delay = 300 + Math.floor(Math.random() * 300);
        pendingTimer = setTimeout(() => {
            if (bottomLeftLayout) {
                bottomLeftLayout.classList.remove("balance-delay");
            }
            pendingTimer = null;
            if (!pendingBet || requestId !== pendingRequestId) {
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

    if (cancelInProgress || cancelRefundTimer !== null || cashoutInProgress) {
        return;
    }

    if (pendingBet) {
        return;
    }

    if (window.balanceManager.getActiveBet(1) !== null) {
        return;
    }

    // ==============================
    // GET BET AMOUNT
    // ==============================
    const amount = getAmount();
    setAmount(amount);

    // ==============================
    // FIRST: BALANCE CHECK
    // ==============================
    const check = window.balanceManager.canPlaceBet(1, amount);
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

    // ==============================
    // AUTO CASHOUT TARGET SETUP
    // ==============================
    const cashoutSwitch = document.getElementById("bet1-cashout-switch");
    const cashoutInput = document.getElementById("bet1-cashout-input");

    // আগের Bet-এর Auto Cashout Target Reset
    autoCashoutTarget = null;
    autoCashoutCancelled = false;

    // Switch ON থাকলেই Auto Cashout চালু হবে
    if (cashoutSwitch.classList.contains("on")) {
        window.validateAutoCashoutValue1();
        autoCashoutTarget = parseFloat(cashoutInput.value);
        console.log("BET 1 AUTO CASHOUT TARGET:", autoCashoutTarget);
    }

    // AMOUNT LAYOUT LOCK
    lockAmountLayout();

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
    console.log("BET 1 PENDING:",pendingAmount,"ROUND STATE:",roundState);

    });


    // ==============================
    // ROUND WAITING START EVENT
    // ==============================
    window.addEventListener("roundWaitingStart", function () {
        console.log("BET 1: ROUND WAITING START EVENT");
        processPendingBet();
    });


    // ==============================
    // ROUND START EVENT
    // ==============================
    window.addEventListener("roundStarted", function () {
        if (cancelInProgress || cashoutInProgress) return;
        const activeBet = window.balanceManager.getActiveBet(1);
        if (activeBet === null) {
            return;
        }
        console.log("BET 1 ROUND STARTED");
        showCashoutButton();
        if (cashoutAmountText) {
            cashoutAmountText.textContent = formatAmount(
                activeBet.amount
            );
        }
    });


    // ==============================
    // MULTIPLIER UPDATE EVENT
    // ==============================
    window.addEventListener("roundMultiplierUpdate", function (event) {

        if (cashoutInProgress) {
            return;
        }

        const activeBet = window.balanceManager.getActiveBet(1);

        if (activeBet === null) {
            return;
        }

        const actualMultiplier = Number(event.detail.multiplier);

        if (!Number.isFinite(actualMultiplier)) {
            return;
        }

        // ==============================
        // AUTO CASHOUT CHECK
        // ==============================
        if (
            autoCashoutTarget !== null &&
            !autoCashoutCancelled &&
            actualMultiplier >= autoCashoutTarget
        ) {

            // নির্দিষ্ট Target অনুযায়ী Multiplier
            currentMultiplier = autoCashoutTarget;

            // Target অনুযায়ী Payout
            const targetPayout = Number(
                (activeBet.amount * autoCashoutTarget).toFixed(2)
            );

            if (cashoutAmountText) {
                cashoutAmountText.textContent = formatAmount(targetPayout);
            }

            // Auto Cashout — কোনো Delay নেই
            startCashout(true, autoCashoutTarget);

            return;
        }

        // ==============================
        // NORMAL MULTIPLIER UPDATE
        // ==============================
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
    window.addEventListener("roundCrashed", function () {
    // Cancel বা Cashout চলমান থাকলে Crash logic চলবে না
    if (cancelInProgress || cashoutInProgress) return;

    const bottomLeftLayout = document.getElementById("bottom-left-layout");
    // Shadow সরাবে
    if (bottomLeftLayout) {
        bottomLeftLayout.classList.remove("balance-delay");
    }

    // Cashout Button লুকাবে
    cashoutButton.style.display = "none";
    // Active Bet হারাবে
    const result = window.balanceManager.loseBet(1);
    if (result.success) {
        console.log("BET 1 LOST:", result.lostAmount);
        // Bet Button দেখাবে
        showBetButton();
        // Amount Unlock করবে
        unlockAmountLayout();
        console.log("BET 1: READY FOR NEXT ROUND");
    }
    });

    // INITIAL BUTTON STATE
    showBetButton();

    // INITIAL AMOUNT FORMAT
    setAmount(getAmount());

})();



// ==================================================
// ADD BET 2 LAYOUT
// ==================================================
(() => {
    const addLayout = document.getElementById("left-top-right-corner");
    const removeLayout = document.getElementById("right-top-right-corner");
    const rightLayout = document.getElementById("bottom-right-layout");
    if (!addLayout) return;
    addLayout.addEventListener("click", function () {
        addLayout.style.display = "none";
        if (removeLayout) {
            removeLayout.style.display = "flex";
        }
        if (rightLayout) {
            rightLayout.style.display = "flex";
        }
    });

})();




// ==================================================
// AUTO CASHOUT SWITCH BET 1
// ==================================================
(() => {
    const switchBtn = document.getElementById("bet1-cashout-switch");
    const input = document.getElementById("bet1-cashout-input");
    const cashoutRight = document.getElementById("bet1-cashout-right");
    const icon = document.getElementById("bet1-cashout-icon");
    const autoBetLayout = document.getElementById("left-top-autobet");

    // ==============================
    // AUTO CASHOUT VALUE VALIDATION
    // ==============================
    window.validateAutoCashoutValue1 = function () {
        let value = parseFloat(input.value.trim());
        if (isNaN(value)) {
            value = 1.01;
        }
        if (value <= 1.00) {
            value = 1.01;
        } else if (value > 100.00) {
            value = 100.00;
        }
        input.value = value.toFixed(2);
    };

    // ==============================
    // AUTO CASHOUT SWITCH
    // ==============================
    function setAutoCashout(enabled) {
        // Switch OFF হলে Value Format
        if (!enabled) {
            validateAutoCashoutValue1();
        }
        switchBtn.classList.toggle("on", enabled);
        switchBtn.classList.toggle("off", !enabled);
        input.disabled = !enabled;
        cashoutRight.classList.toggle("locked", !enabled);
        icon.style.pointerEvents = enabled ? "auto" : "none";
        // ON = AutoBet locked
        // OFF = AutoBet unlocked
        autoBetLayout.classList.toggle("locked", enabled);
    }

    // ==============================
    // DEFAULT OFF
    // ==============================
    setAutoCashout(false);

    // ==============================
    // SWITCH CLICK
    // ==============================
    switchBtn.addEventListener("click", () => {
        const enabled = !switchBtn.classList.contains("on");
        setAutoCashout(enabled);
    });

    // ==============================
    // ICON CLICK
    // ==============================
    icon.addEventListener("click", () => {
        validateAutoCashoutValue1();
    });
})();
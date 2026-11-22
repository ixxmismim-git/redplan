(() => {
  const bottomLeftLayout = document.getElementById("bottom-left-layout");
  const betBtn = document.getElementById("left-bet-btn");
  const autoBetBtn = document.getElementById("left-autobet-btn");

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

  cashoutSwitch.addEventListener("click", function () {
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

    let cancelRefundTimer = null;
    let cancelInProgress = false;
    let cashoutInProgress = false;
    let cashoutTimer = null;
    let currentMultiplier = 1;

  const cashoutAmountText = document.querySelector(
      "#cashoutBtn .cashout-amount span"
  );

  const progressLayout = document.getElementById("progressLayout");

  // ==============================
  // AMOUNT FORMAT
  // ==============================

  function lockAmountLayout() {
      document
          .getElementById("amount-layout")
          .classList.add("locked");
  }

  function unlockAmountLayout() {
      document
          .getElementById("amount-layout")
          .classList.remove("locked");
  }

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

  // ==============================
  // PLUS BUTTON (+10)
  // ==============================

  const plusBtn = document.getElementById("bet1-right-icon");

  plusBtn.addEventListener("click", function () {
      let amount = getAmount();
      amount += 10;
      setAmount(amount);
  });

  // ==============================
  // MINUS BUTTON (-10)
  // ==============================

  const minusBtn = document.getElementById("bet1-left-icon");

  minusBtn.addEventListener("click", function () {
      let amount = getAmount();
      amount -= 10;

      if (amount < 10) {
          amount = 10;
      }

      setAmount(amount);
  });  // ==============================
  // BET STATE
  // ==============================

  let pendingBet = false;
  let pendingAmount = 0;
  let pendingRequestId = 0;
  let pendingTimer = null;

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

      const bottomLeftLayout =
          document.getElementById("bottom-left-layout");

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

      const bottomLeftLayout =
          document.getElementById("bottom-left-layout");

      if (bottomLeftLayout) {
          bottomLeftLayout.classList.add("balance-delay");
      }

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

      const bottomLeftLayout =
          document.getElementById("bottom-left-layout");

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
  }  // ==============================
  // BET BUTTON CLICK
  // ==============================

  betButton.addEventListener("click", function () {
      if (cancelInProgress || cancelRefundTimer !== null) {
          return;
      }

      if (pendingBet) {
          return;
      }

      if (window.balanceManager.getActiveBet(1) !== null) {
          return;
      }

      const amount = getAmount();
      setAmount(amount);

      // FIRST: BALANCE CHECK
        // FIRST: BALANCE CHECK
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

      // AMOUNT LAYOUT LOCK
      lockAmountLayout();

      // CHECK ROUND STATE
      const roundState = window.roundManager.getState();

      console.log("BET 1 CLICKED. ROUND STATE:", roundState);

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
          "BET 1 PENDING:",
          pendingAmount,
          "ROUND STATE:",
          roundState
      );
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
      if (cancelInProgress) return;

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

    const activeBet = window.balanceManager.getActiveBet(1);

    if (activeBet === null) {
        return;
    }

    // Click করার মুহূর্তের Amount এবং Multiplier ধরে রাখবে
    const payout = Number(
        cashoutAmountText.textContent.replace(/,/g, "")
    );

    const cashoutMultiplier = currentMultiplier;

    cashoutInProgress = true;

    const bottomLeftLayout =
        document.getElementById("bottom-left-layout");

    // Shadow দেখাবে
    if (bottomLeftLayout) {
        bottomLeftLayout.classList.add("balance-delay");
    }

    // আগের Delay ঠিক রাখা হয়েছে
    const delay = 100 + Math.floor(400);

    cashoutTimer = setTimeout(() => {

        cashoutTimer = null;

        // Cashout সম্পন্ন
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

        console.log("BET 1 CASHOUT SUCCESS:", result.payout);

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

    // Cashout চলাকালে Amount আর Update হবে না
    if (cashoutInProgress) {
        return;
    }

    const activeBet = window.balanceManager.getActiveBet(1);

    if (activeBet === null) {
        return;
    }

    const multiplier = event.detail.multiplier;
    const cashoutAmount = activeBet.amount * multiplier;
    currentMultiplier = Number(multiplier);

    if (cashoutAmountText) {
        cashoutAmountText.textContent = formatAmount(
            cashoutAmount
        );
    }

});

  // ==============================
  // ROUND CRASH EVENT
  // ==============================

window.addEventListener("roundCrashed", function () {

    // Cancel বা Cashout চলমান থাকলে Crash logic চলবে না
    if (cancelInProgress || cashoutInProgress) return;

    const bottomLeftLayout =
        document.getElementById("bottom-left-layout");

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

  // ==============================
  // INITIAL BUTTON STATE
  // ==============================

  showBetButton();
  // ==============================
  // INITIAL AMOUNT FORMAT
  // ==============================

  setAmount(getAmount());

})();

// ADD BET 2 LAYOUT
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
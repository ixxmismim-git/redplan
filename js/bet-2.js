
(() => {

    // ==============================
    // BET / AUTOBET TABS
    // ==============================

    const bottomRightLayout = document.getElementById("bottom-right-layout");

    const betBtn = document.getElementById("right-bet-btn");
    const autoBetBtn = document.getElementById("right-autobet-btn");

    betBtn.addEventListener("click", function () {

        bottomRightLayout.classList.remove("auto-mode");

        betBtn.classList.add("active");
        autoBetBtn.classList.remove("active");

    });

    autoBetBtn.addEventListener("click", function () {

        bottomRightLayout.classList.add("auto-mode");

        autoBetBtn.classList.add("active");
        betBtn.classList.remove("active");

    });


    // ==============================
    // BACKSPACE SYSTEM
    // ==============================

    function setupBackspace(inputId) {

        const input = document.getElementById(inputId);

        input.addEventListener("keydown", function (e) {

            if (e.key === "Backspace") {

                const start = this.selectionStart;
                const end = this.selectionEnd;
                const value = this.value;

                // Selected text delete
                if (start !== end) {

                    e.preventDefault();

                    this.value =
                        value.substring(0, start) +
                        value.substring(end);

                    this.setSelectionRange(start, start);

                    return;
                }

                e.preventDefault();

                // Delete left side character
                if (start > 0) {

                    this.value =
                        value.substring(0, start - 1) +
                        value.substring(start);

                    this.setSelectionRange(start - 1, start - 1);

                }

                // Delete right side character
                else if (value.length > 0) {

                    this.value = value.substring(1);

                    this.setSelectionRange(0, 0);

                }

            }

        });

    }

    setupBackspace("bet2-amount-input");
    setupBackspace("bet2-cashout-input");


    // ==============================
    // AUTOBET / CASHOUT SWITCH
    // ==============================

    const autoBetSwitch = document.getElementById("bet2-auto-bet-switch");
    const cashoutSwitch = document.getElementById("bet2-cashout-switch");

    autoBetSwitch.addEventListener("click", function () {

        this.classList.toggle("on");
        this.classList.toggle("off");

    });

    cashoutSwitch.addEventListener("click", function () {

        this.classList.toggle("on");
        this.classList.toggle("off");

    });


    // ==============================
    // AMOUNT SYSTEM
    // ==============================

    const amountInput = document.getElementById("bet2-amount-input");

    // Amount formatting
    function formatAmount(amount) {

        return amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    }

    // Get current amount
    function getAmount() {

        return parseFloat(
            amountInput.value.replace(/,/g, "")
        ) || 0;

    }

    // Set amount with min/max limit
    function setAmount(amount) {

        if (amount > 10000) {
            amount = 10000;
        }

        if (amount < 10) {
            amount = 10;
        }

        amountInput.value = formatAmount(amount);

        // Update Bet Button Amount
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


    // ==============================
    // PLUS BUTTON (+10)
    // ==============================

    const plusBtn = document.getElementById("bet2-right-icon");

    plusBtn.addEventListener("click", function () {

        let amount = getAmount();

        amount += 10;

        setAmount(amount);

    });


    // ==============================
    // MINUS BUTTON (-10)
    // ==============================

    const minusBtn = document.getElementById("bet2-left-icon");

    minusBtn.addEventListener("click", function () {

        let amount = getAmount();

        amount -= 10;

        if (amount < 10) {
            amount = 10;
        }

        setAmount(amount);

    });


    // ==============================
    // BET BUTTON VALIDATION
    // ==============================

    const betButton = document.getElementById("bet2-betBtn");

    betButton.addEventListener("click", function () {

        let amount = parseFloat(
            amountInput.value.replace(/,/g, "")
        );

        // Invalid or empty input
        if (isNaN(amount)) {
            amount = 10;
        }

        // Minimum amount
        if (amount < 10) {
            amount = 10;
        }

        // Maximum amount
        if (amount > 10000) {
            amount = 10000;
        }

        // Update input and Bet button
        setAmount(amount);

    });


    // ==============================
    // INITIAL FORMAT
    // ==============================

    setAmount(getAmount());


})();

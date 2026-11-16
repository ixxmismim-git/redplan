
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


    function setupBackspace(inputId) {

        const input = document.getElementById(inputId);

        input.addEventListener("keydown", function (e) {

            if (e.key === "Backspace") {

                const start = this.selectionStart;
                const end = this.selectionEnd;
                const value = this.value;

                // কোনো text select করা থাকলে
                if (start !== end) {

                    e.preventDefault();

                    this.value =
                        value.substring(0, start) +
                        value.substring(end);

                    this.setSelectionRange(start, start);
                    return;
                }

                e.preventDefault();

                // Cursor-এর বাম পাশের সংখ্যা delete
                if (start > 0) {

                    this.value =
                        value.substring(0, start - 1) +
                        value.substring(start);

                    this.setSelectionRange(start - 1, start - 1);

                }

                // বাম পাশে কিছু না থাকলে ডান পাশের সংখ্যা delete
                else if (value.length > 0) {

                    this.value = value.substring(1);
                    this.setSelectionRange(0, 0);

                }

            }

        });

    }


    // দুইটি input-এ একই system
    setupBackspace("bet1-amount-input");
    setupBackspace("bet1-cashout-input");


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



(() => {

    const amountInput = document.getElementById("bet1-amount-input");

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

    // UPDATE BET BUTTON AMOUNT
    const betAmountText = document.querySelector("#betBtn .amount span");

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

    });

const betButton = document.getElementById("betBtn");

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

    // Format and update both
    setAmount(amount);

});



    // ==============================
    // INITIAL FORMAT
    // ==============================

    setAmount(getAmount());

})();





})();

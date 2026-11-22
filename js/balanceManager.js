
(() => {
    // ===============================
    // MAIN BALANCE
    // ===============================
    let balance = 500;
    // ===============================
    // UPDATE BALANCE UI
    // ===============================
    function updateBalanceUI() {

        const balanceText = document.querySelector(
            "#header-balance span"
        );
        if (balanceText) {

            balanceText.textContent = balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        }

    }

    // ===============================
    // GET BALANCE
    // ===============================

    function getBalance() {
        return balance;
    }

    // ===============================
    // CHECK BET
    // ===============================

    function canPlaceBet(lane, amount) {

        amount = Number(amount);

        if (lane !== 1 && lane !== 2) {
            return { success: false, reason: "invalid_lane" };
        }

        if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
            return { success: false, reason: "invalid_amount" };
        }

        if (balance < amount) {
            return { success: false, reason: "insufficient_balance" };
        }

        return { success: true };

    }

    // ===============================
    // PLACE BET / DEDUCT BALANCE
    // ===============================

    const activeBets = {
        1: null,
        2: null
    };

    function placeBet(lane, amount) {

        const check = canPlaceBet(lane, amount);

        if (!check.success) {
            return check;
        }

        if (activeBets[lane] !== null) {
            return { success: false, reason: "bet_already_active" };
        }

        amount = Number(amount);

        balance = Number((balance - amount).toFixed(2));

        activeBets[lane] = {
            amount: amount
        };

        updateBalanceUI();

        return {
            success: true,
            balance: balance
        };

    }

    // ===============================
    // GET ACTIVE BET
    // ===============================

    function getActiveBet(lane) {
        return activeBets[lane];
    }



function cancelBet(lane) {

    const activeBet = activeBets[lane];

    if (activeBet === null) {
        return {
            success: false,
            reason: "no_active_bet"
        };
    }

    // Bet amount refund
    balance = Number((balance + activeBet.amount).toFixed(2));

    // Active bet remove
    activeBets[lane] = null;

    updateBalanceUI();

    return {
        success: true,
        balance: balance
    };

}

function cashoutBet(lane, payout) {

    const activeBet = activeBets[lane];

    if (activeBet === null) {
        return {
            success: false,
            reason: "no_active_bet"
        };
    }

    payout = Number(payout);

    if (!Number.isFinite(payout) || payout <= 0) {
        return {
            success: false,
            reason: "invalid_payout"
        };
    }

    // Cashout amount balance-এ যোগ
    balance = Number((balance + payout).toFixed(2));

    // Active bet clear
    activeBets[lane] = null;

    updateBalanceUI();

    return {
        success: true,
        balance: balance,
        payout: payout
    };
}

function loseBet(lane) {

    const activeBet = activeBets[lane];

    if (activeBet === null) {
        return {
            success: false,
            reason: "no_active_bet"
        };
    }

    const lostAmount = activeBet.amount;

    // টাকা ফেরত হবে না
    // শুধু Active Bet clear হবে
    activeBets[lane] = null;

    return {
        success: true,
        lostAmount: lostAmount
    };
}


    // ===============================
    // INITIAL BALANCE DISPLAY
    // ===============================

    updateBalanceUI();

    // ===============================
    // EXPORT
    // ===============================

window.balanceManager = {
    getBalance,
    canPlaceBet,
    placeBet,
    getActiveBet,
    cancelBet,
    cashoutBet,
    loseBet,
    updateBalanceUI
};

})();

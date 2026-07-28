const tg = window.Telegram.WebApp;

// Инициализация WebApp
tg.expand();
tg.ready();

// Отправка ставки обратно в бота
function submitBet(categoryId) {
    const inputField = document.getElementById(`bet-${categoryId}`);
    const amount = parseFloat(inputField.value);

    if (!amount || amount <= 0) {
        tg.showAlert("Введите корректную сумму ставки!");
        return;
    }

    // Данные, которые улетят на бэкенд бота
    const payload = {
        action: "make_bet",
        category_id: categoryId,
        amount: amount
    };

    tg.sendData(JSON.stringify(payload));
}

// Кнопка пополнения
document.getElementById('buy-points-btn').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: "open_shop" }));
});

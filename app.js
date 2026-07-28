const tg = window.Telegram.WebApp;

// Вызов полной адаптации под экран Telegram
tg.expand();
tg.ready();

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    initUser();
    startRoundCountdown();
});

// 1. Считывание профиля пользователя из Telegram API
function initUser() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentUser = tg.initDataUnsafe.user;
        
        document.getElementById("username").innerText = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || "Игрок";
        document.getElementById("user-id").innerText = `ID: ${currentUser.id}`;

        if (currentUser.photo_url) {
            document.getElementById("user-avatar").innerHTML = `<img src="${currentUser.photo_url}" style="width:100%;height:100%;object-fit:cover;">`;
        }

        // Пример включения админ-панели для владельца
        // Если твоя айдишка совпадает — откроет панель добавления категорий
        if (currentUser.id === 123456789 || currentUser.username === "dimaserezhkin14") {
            document.getElementById("admin-panel").style.display = "block";
        }
    } else {
        document.getElementById("username").innerText = "Тестовый Юзер";
        document.getElementById("user-id").innerText = "ID: 7777777";
    }
}

// 2. Таймер суточного раунда (до 00:00 UTC)
function startRoundCountdown() {
    function tick() {
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const diff = endOfDay - now;
        if (diff <= 0) {
            document.getElementById("round-timer").innerText = "00:00:00";
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("round-timer").innerText = 
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    tick();
    setInterval(tick, 1000);
}

// 3. Обработка ставок
function makeBet(categoryId) {
    const inputEl = document.getElementById(`input-cat-${categoryId}`);
    const amount = parseFloat(inputEl.value);

    if (!amount || amount < 50) {
        tg.showAlert("Минимальная ставка: 50 PT");
        return;
    }

    // Отправка JSON в Python-бэкенд бота
    const payload = {
        action: "make_bet",
        category_id: categoryId,
        amount: amount,
        user_id: currentUser ? currentUser.id : null
    };

    tg.sendData(JSON.stringify(payload));
}

// 4. Пополнение
function processDeposit(method) {
    closeModal('deposit-modal');
    const actionType = method === 'stars' ? 'pay_stars' : 'pay_crypto';
    tg.sendData(JSON.stringify({ action: actionType }));
}

// 5. Вывод
function submitWithdrawal() {
    const wallet = document.getElementById("withdraw-wallet").value.trim();
    const amount = parseFloat(document.getElementById("withdraw-amount").value);

    if (!wallet || wallet.length < 10) {
        tg.showAlert("Введите корректный TON кошелек!");
        return;
    }
    if (!amount || amount <= 0) {
        tg.showAlert("Укажите сумму вывода!");
        return;
    }

    tg.sendData(JSON.stringify({
        action: "withdraw_request",
        wallet: wallet,
        amount: amount
    }));

    closeModal('withdraw-modal');
    tg.showAlert("Заявка на вывод отправлена администратору!");
}

// 6. Управление модальными окнами
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// 7. Функция админа (Динамическое добавление категории)
function addNewCategory() {
    const title = document.getElementById("new-cat-title").value.trim();
    const desc = document.getElementById("new-cat-desc").value.trim();

    if (!title) return;

    const feed = document.getElementById("categories-feed");
    const newId = feed.children.length + 1;

    const catCard = document.createElement("div");
    catCard.className = "category-card";
    catCard.innerHTML = `
        <div class="cat-top">
            <span class="cat-tag">Категория #${newId}</span>
            <span class="cat-status">Приём ставок</span>
        </div>
        <h3 class="cat-name">${title}</h3>
        <p class="cat-description">${desc || 'Пользовательское событие'}</p>
        <div class="bet-controls">
            <input type="number" class="bet-input" id="input-cat-${newId}" placeholder="Сумма PT (мин. 50)" min="50">
            <button class="btn-submit-bet" onclick="makeBet(${newId})">Поставить</button>
        </div>
    `;

    feed.appendChild(catCard);
    document.getElementById("new-cat-title").value = "";
    document.getElementById("new-cat-desc").value = "";
    tg.showAlert("Новая категория успешно добавлена!");
}

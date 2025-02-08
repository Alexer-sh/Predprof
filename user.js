// Функция для получения инвентаря пользователя
async function fetchUserInventory(userId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/user-inventory?user_id=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        renderUserInventory(data.inventory); // Отображаем инвентарь
    } catch (error) {
        console.error("Ошибка загрузки инвентаря:", error);
        alert("Ошибка при загрузке инвентаря.");
    }
}

// Функция для отображения инвентаря
function renderUserInventory(inventory) {
    const inventoryTable = document.getElementById("inventoryTable");
    inventoryTable.innerHTML = ""; // Очищаем таблицу перед обновлением

    if (inventory.length === 0) {
        inventoryTable.innerHTML = "<div class='table-row'>Нет закреплённого инвентаря</div>";
        return;
    }

    inventory.forEach(item => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.innerHTML = `
            <div>${item.name}</div>
            <div>${item.quantity}</div>
            <div>${item.condition}</div>
        `;
        inventoryTable.appendChild(row);
    });
}



document.addEventListener("DOMContentLoaded", function () {
    const createRequestButton = document.getElementById('createRequest');

    if (createRequestButton) {
        createRequestButton.addEventListener('click', handleCreateRequest);
    } else {
        console.error("Элемент с id 'createRequest' не найден.");
    }

    // Получаем user_id из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
        alert("User ID not found in URL.");
        return;
    }

    // Загружаем инвентарь пользователя
    fetchUserInventory(userId);
    // Загружаем заявки пользователя
    fetchUserRequests(userId);
});


// Функция для обработки создания заявки
async function handleCreateRequest() {
    const requestNameInput = document.getElementById('requestName');
    const requestQuantityInput = document.getElementById('requestQuantity');

    if (!requestNameInput || !requestQuantityInput) {
        console.error("Ошибка: Поля для заявки не найдены.");
        return;
    }

    const name = requestNameInput.value.trim();
    const quantity = requestQuantityInput.value.trim();

    if (!name || !quantity) {
        alert("Заполните все поля!");
        return;
    }

    console.log("Отправка заявки:", { name, quantity });

    // Получаем user_id из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
        alert("User ID not found in URL.");
        return;
    }

    // Отправляем заявку на сервер
    try {
        const response = await fetch('http://127.0.0.1:8000/create-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: parseInt(userId),
                item_name: name,
                quantity: parseInt(quantity)
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        alert("Заявка создана!");
        console.log("Заявка создана:", result);
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${name}</div>
            <div>${quantity}</div>
            <div>В обработке</div>
        `;
        document.getElementById('requestTable').appendChild(row);

        // Очищаем поля
        requestNameInput.value = '';
        requestQuantityInput.value = '';

        // Обновляем список заявок
        fetchUserRequests(userId);
    } catch (error) {
        console.error("Ошибка при создании заявки:", error);
        alert("Ошибка при создании заявки.");
    }
}

// Функция для загрузки заявок пользователя
async function fetchUserRequests(userId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/user-requests?user_id=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        renderUserRequests(data.requests);
    } catch (error) {
        console.error("Ошибка загрузки заявок:", error);
        alert("Ошибка при загрузке заявок.");
    }
}

// Функция для отображения заявок пользователя
function renderUserRequests(requests) {
    const requestTable = document.getElementById('requestTable');

    requestTable.innerHTML = ""; // Очищаем таблицу перед обновлением

    if (requests.length === 0) {
        requestTable.innerHTML = "<div class='table-row'>Нет заявок</div>";
        return;
    }

    requests.forEach(request => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${request.item_name}</div>
            <div>${request.quantity}</div>
            <div>${request.status}</div>
        `;
        requestTable.appendChild(row);
    });
}
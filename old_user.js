// Получение имени пользователя через GET-запрос
async function fetchUsername() {
    try {
        // Отправляем GET-запрос на бэкенд
        const response = await fetch('http://127.0.0.1:8000/user');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Обрабатываем JSON-ответ
        const data = await response.json();
        const usernameElement = document.getElementById('username');

        // Обновляем имя пользователя в интерфейсе
        if (data.username) {
            usernameElement.innerHTML = `<a href="#">${data.username}</a>`;
        } else {
            usernameElement.innerHTML = `<a href="#">Гость</a>`;
        }
    } catch (error) {
        console.error('Ошибка при получении имени пользователя:', error);
    }
}

// Обработка запроса инвентаря
function setupInventory() {
    const requestButton = document.getElementById('request-button');
    requestButton.addEventListener('click', () => {
        const inventory = document.getElementById('inventory-select').value;
        const quantity = document.getElementById('quantity-input').value;
        alert(`Вы запросили ${quantity} ${inventory}(ов)`);
    });
}

// Получение инвентаря пользователя через GET-запрос
async function fetchUserInventory() {
    try {
        // Отправляем GET-запрос на маршрут /inventory
        const response = await fetch('http://127.0.0.1:8000/inventory');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Обрабатываем JSON-ответ
        const inventoryData = await response.json();

        // Отображаем инвентарь в таблице
        const inventoryTable = document.getElementById('inventory-table');
        inventoryTable.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных

        for (const [itemName, quantity] of Object.entries(inventoryData)) {
            if (quantity === 0) continue;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${itemName}</td>
                <td>${quantity}</td>
            `;
            inventoryTable.appendChild(row);
        }
    } catch (error) {
        console.error('Ошибка при получении инвентаря:', error);
    }
}

// Инициализация функций
document.addEventListener('DOMContentLoaded', () => {
    fetchUsername(); // Загружаем имя пользователя
    setupInventory(); // Настраиваем обработку запроса инвентаря
    fetchUserInventory(); // Загружаем инвентарь пользователя
    setupInventoryRequest(); // Настраиваем обработку запроса инвентаря
});
// Обработка запроса дополнительного инвентаря
function setupInventoryRequest() {
    const requestButton = document.getElementById('request-button');

    // Убираем все старые обработчики событий
    const newRequestButton = requestButton.cloneNode(true);
    requestButton.replaceWith(newRequestButton);

    // Назначаем новый обработчик
    newRequestButton.addEventListener('click', async () => {
        const inventory = document.getElementById('inventory-select').value;
        const quantity = parseInt(document.getElementById('quantity-input').value);

        if (!inventory || quantity <= 0) {
            alert('Введите корректное название предмета и количество.');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/request-extra-inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    item: inventory,
                    quantity: quantity,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message); // Уведомление
        } catch (error) {
            console.error('Ошибка при отправке запроса инвентаря:', error);
            alert('Произошла ошибка при запросе. Попробуйте снова.');
        }
    });
}


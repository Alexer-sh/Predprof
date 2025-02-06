let userId = 1;
const inventory = {};
const purchases = [];
const requests = [];

document.addEventListener("DOMContentLoaded", fetchUsers); // Загружаем пользователей при загрузке страницы

// Получение списка пользователей с сервера
async function fetchUsers() {
    try {
        const response = await fetch("http://127.0.0.1:8000/users");
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const users = await response.json();
        renderUserList(users); // Отображаем пользователей
    } catch (error) {
        console.error("Ошибка загрузки пользователей:", error);
    }
}

// Отображение списка пользователей
function renderUserList(users) {
    const userList = document.getElementById("userList");
    userList.innerHTML = ""; // Очищаем список перед обновлением

    users.forEach(user => {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.setAttribute("data-id", user.id);
        userItem.innerHTML = `
            <span>${user.id}. ${user.first_name} ${user.last_name} (Дата рождения: ${user.birth_date})</span>
            <div>
                <span class="inventory"></span>
                <button class="assign-button" onclick="assignInventory(this)">Закрепить инвентарь</button>
                <span class="delete-button" onclick="deleteUser(${user.id})">Удалить</span>
            </div>
        `;
        userList.appendChild(userItem);
    });
}

// Добавление нового пользователя
async function addUser() {
    const firstName = document.getElementById("userFirstName").value;
    const lastName = document.getElementById("userLastName").value;
    const birthDate = document.getElementById("userBirthDate").value;

    if (!firstName || !lastName || !birthDate) {
        alert("Введите все данные.");
        return;
    }

    const newUser = { first_name: firstName, last_name: lastName, birth_date: birthDate };

    try {
        const response = await fetch("http://127.0.0.1:8000/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        alert("Пользователь добавлен!");
        fetchUsers(); // Перезагружаем список пользователей
    } catch (error) {
        console.error("Ошибка при добавлении пользователя:", error);
        alert("Ошибка при добавлении пользователя.");
    }
}


async function assignInventory(button) {
    const userItem = button.closest(".user-item");
    const userId = userItem.getAttribute("data-id");

    try {
        // Получаем список свободного инвентаря
        const response = await fetch("http://127.0.0.1:8000/free-inventory");
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const inventory = await response.json();
        if (inventory.length === 0) {
            alert("Нет доступного инвентаря для закрепления.");
            return;
        }

        // Выбор инвентаря через prompt()
        const inventoryNames = inventory.map(item => item.name).join(", ");
        const selectedItemName = prompt(`Выберите инвентарь: ${inventoryNames}`);

        // Проверяем, существует ли введённый предмет
        const selectedItem = inventory.find(item => item.name === selectedItemName);
        if (!selectedItem) {
            alert("Такого инвентаря нет в списке.");
            return;
        }

        // Запрашиваем количество
        const quantity = parseInt(prompt(`Введите количество (доступно: ${selectedItem.quantity}):`));
        if (isNaN(quantity) || quantity <= 0 || quantity > selectedItem.quantity) {
            alert("Неверное количество.");
            return;
        }

        // Отправляем запрос на сервер
        const assignData = { user_id: userId, item_id: selectedItem.id, quantity };
        const assignResponse = await fetch("http://127.0.0.1:8000/assign-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignData),
        });

        if (!assignResponse.ok) {
            throw new Error(`Ошибка HTTP: ${assignResponse.status}`);
        }

        alert("Инвентарь закреплён!");
        updateFreeInventory(); // Обновляем список свободного инвентаря
        fetchUsers(); // Обновляем список пользователей с инвентарём
    } catch (error) {
        console.error("Ошибка при закреплении инвентаря:", error);
        alert("Ошибка при закреплении инвентаря.");
    }
}

// Отображение списка пользователей
function renderUserList(users) {
    const userList = document.getElementById("userList");
    userList.innerHTML = ""; // Очищаем список перед обновлением

    users.forEach(user => {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.setAttribute("data-id", user.id);

        // Генерируем список закрепленного инвентаря
        let inventoryHTML = "";
        if (user.inventory && user.inventory.length > 0) {
            inventoryHTML = user.inventory.map(inv =>
                `<span>${inv.name} (${inv.quantity})
                    <span class="edit-inventory-button" onclick="editAssignedInventory(${user.id}, '${inv.name}', ${inv.quantity})">✏️</span>
                    <span class="delete-inventory-button" onclick="deleteAssignedInventory(${user.id}, '${inv.name}', ${inv.quantity})">❌</span>
                </span>`
            ).join("<br>");
        } else {
            inventoryHTML = "Нет закрепленного инвентаря";
        }

        userItem.innerHTML = `
            <span>${user.id}. ${user.first_name} ${user.last_name} (Дата рождения: ${user.birth_date})</span>
            <div class="inventory">${inventoryHTML}</div>
            <div>
                <button class="assign-button" onclick="assignInventory(this)">Закрепить инвентарь</button>
                <span class="delete-button" onclick="deleteUser(${user.id})">Удалить</span>
            </div>
        `;

        userList.appendChild(userItem);
    });
}

async function editAssignedInventory(userId, itemName, currentQuantity) {
    const newQuantity = parseInt(prompt(`Введите новое количество для ${itemName}:`, currentQuantity));
    if (isNaN(newQuantity) || newQuantity <= 0) {
        alert("Некорректное количество.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/edit-assigned-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, item_name: itemName, new_quantity: newQuantity }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        alert("Инвентарь обновлён!");
        fetchUsers(); // Обновляем список пользователей
        updateFreeInventory(); // Обновляем список свободного инвентаря
    } catch (error) {
        console.error("Ошибка при редактировании инвентаря:", error);
        alert("Ошибка при редактировании.");
    }
}


// Удаление закрепленного инвентаря у пользователя
async function deleteAssignedInventory(userId, itemName, quantity) {
    console.log("Отправляем на сервер:", { user_id: userId, item_name: itemName, quantity });

    if (!confirm(`Удалить ${itemName} (${quantity}) у пользователя?`)) return;

    try {
        const response = await fetch("http://127.0.0.1:8000/remove-assigned-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, item_name: itemName, quantity: quantity }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        alert("Инвентарь удалён и возвращён в свободный инвентарь!");
        fetchUsers();
        updateFreeInventory();
    } catch (error) {
        console.error("Ошибка при удалении инвентаря:", error);
        alert("Ошибка при удалении.");
    }
}



function addInventory() {
    const inventoryName = document.getElementById("inventoryName").value;
    const inventoryQuantity = document.getElementById("inventoryQuantity").value;
    const inventoryCondition = document.getElementById("inventoryCondition").value;

    if (inventoryName && inventoryQuantity > 0) {
        if (inventory[inventoryName]) {
            inventory[inventoryName].quantity += parseInt(inventoryQuantity);
        } else {
            inventory[inventoryName] = {
                quantity: parseInt(inventoryQuantity),
                condition: inventoryCondition
            };
        }
        alert(`${inventoryName} добавлен(а) в инвентарь с количеством: ${inventory[inventoryName].quantity} и состоянием: ${inventory[inventoryName].condition}`);
        updateInventoryDisplay();
        document.getElementById("inventoryName").value = '';
        document.getElementById("inventoryQuantity").value = '';
    } else {
        alert("Введите имя инвентаря и положительное количество.");
    }
}

function updateInventoryDisplay() {
    const inventoryDisplay = document.getElementById("inventoryList");
    inventoryDisplay.innerHTML = '';

    for (const [name, details] of Object.entries(inventory)) {
        const inventoryItem = document.createElement("div");
        inventoryItem.className = "inventory-item";
        inventoryItem.innerHTML = `
            ${name} (осталось: ${details.quantity}, состояние: ${details.condition})
            <span class="edit-inventory-button" onclick="editInventory('${name}')">Редактировать</span>
            <span class="delete-inventory-button" onclick="deleteInventory('${name}')">Удалить</span>
        `;
        inventoryDisplay.appendChild(inventoryItem);
    }
}

function editInventory(name) {
    const newQuantity = prompt(`Введите новое количество для ${name}:`, inventory[name].quantity);
    const newCondition = prompt(`Введите новое состояние для ${name}:`, inventory[name].condition);

    if (newQuantity && newCondition) {
        inventory[name].quantity = parseInt(newQuantity);
        inventory[name].condition = newCondition;
        updateInventoryDisplay();
    }
}

function deleteInventory(name) {
    if (confirm(`Вы уверены, что хотите удалить ${name} из инвентаря?`)) {
        delete inventory[name];
        updateInventoryDisplay();
    }
}

function addPurchase() {
    const purchaseItem = document.getElementById("purchaseItem").value;
    const purchaseSupplier = document.getElementById("purchaseSupplier").value;
    const purchaseQuantity = document.getElementById("purchaseQuantity").value;

    if (purchaseItem && purchaseSupplier && purchaseQuantity > 0) {
        const purchase = {
            item: purchaseItem,
            supplier: purchaseSupplier,
            quantity: purchaseQuantity
        };
        purchases.push(purchase);
        updatePurchaseDisplay();
        document.getElementById("purchaseItem").value = '';
        document.getElementById("purchaseSupplier").value = '';
        document.getElementById("purchaseQuantity").value = '';
    } else {
        alert("Заполните все поля для планирования покупки.");
    }
}

function updatePurchaseDisplay() {
    const purchaseDisplay = document.getElementById("purchaseList");
    purchaseDisplay.innerHTML = '';

    purchases.forEach((purchase, index) => {
        const purchaseItem = document.createElement("div");
        purchaseItem.className = "purchase-item";
        purchaseItem.textContent = `${index + 1}. Товар: ${purchase.item}, Поставщик: ${purchase.supplier}, Количество: ${purchase.quantity}`;
        purchaseDisplay.appendChild(purchaseItem);
    });
}

// Функция для добавления запросов (внешний вызов)
function addRequest(item, quantity) {
    const request = {
        item: item,
        quantity: quantity
    };
    requests.push(request);
    updateRequestsDisplay();
}

function updateRequestsDisplay() {
    const requestsDisplay = document.getElementById("requestsList");
    requestsDisplay.innerHTML = '';

    requests.forEach((request, index) => {
        const requestItem = document.createElement("div");
        requestItem.className = "request-item";
        requestItem.innerHTML = `
            <span>${index + 1}. Товар: ${request.item}, Количество: ${request.quantity}</span>
            <span class="delete-button" onclick="deleteRequest(${index})">Удалить</span>
        `;
        requestsDisplay.appendChild(requestItem);
    });
}

function deleteRequest(index) {
    if (confirm("Вы уверены, что хотите удалить этот запрос?")) {
        requests.splice(index, 1);
        updateRequestsDisplay();
    }
}
document.addEventListener("DOMContentLoaded", fetchFreeInventory); // Загружаем инвентарь при загрузке

// Получение списка свободного инвентаря с сервера
async function fetchFreeInventory() {
    try {
        const response = await fetch("http://127.0.0.1:8000/free-inventory");
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const inventory = await response.json();
        renderInventoryList(inventory); // Отображаем инвентарь
    } catch (error) {
        console.error("Ошибка загрузки инвентаря:", error);
    }
}

// Отображение списка свободного инвентаря
function renderInventoryList(inventory) {
    const inventoryList = document.getElementById("inventoryList");
    inventoryList.innerHTML = ""; // Очищаем список перед обновлением

    inventory.forEach(item => {
        const inventoryItem = document.createElement("div");
        inventoryItem.className = "inventory-item";
        inventoryItem.setAttribute("data-id", item.id);
        inventoryItem.innerHTML = `
            <span>${item.name} (Остаток: ${item.quantity}, Состояние: ${item.condition})</span>
            <span class="delete-button" onclick="deleteInventory(${item.id})">Удалить</span>
        `;
        inventoryList.appendChild(inventoryItem);
    });
}

// Добавление нового инвентаря
async function addInventory() {
    const inventoryName = document.getElementById("inventoryName").value;
    const inventoryQuantity = document.getElementById("inventoryQuantity").value;
    const inventoryCondition = document.getElementById("inventoryCondition").value;

    if (!inventoryName || inventoryQuantity <= 0) {
        alert("Введите корректные данные.");
        return;
    }

    const newItem = {
        name: inventoryName,
        quantity: parseInt(inventoryQuantity),
        condition: inventoryCondition
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/free-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        alert("Инвентарь добавлен!");
        fetchFreeInventory(); // Обновляем список
    } catch (error) {
        console.error("Ошибка при добавлении инвентаря:", error);
        alert("Ошибка при добавлении инвентаря.");
    }
}

// Удаление инвентаря
async function deleteInventory(id) {
    if (!confirm("Вы уверены, что хотите удалить этот инвентарь?")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/free-inventory/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        alert("Инвентарь удалён!");
        fetchFreeInventory(); // Обновляем список
    } catch (error) {
        console.error("Ошибка при удалении инвентаря:", error);
        alert("Ошибка при удалении.");
    }
}

async function updateFreeInventory() {
    await fetchFreeInventory();
}



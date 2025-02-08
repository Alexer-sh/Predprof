let userId = 1;
const inventory = {};
const purchases = [];
const requests = [];

document.addEventListener("DOMContentLoaded", fetchUsers);

async function fetchUsers() {
    try {
        const response = await fetch("http://127.0.0.1:8000/users");
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error("Ошибка загрузки пользователей:", error);
    }
}

function renderUserList(users) {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    users.forEach(user => {
        // Пропускаем пользователя с id = 0, он админ
        if (user.id === 0) {
            return;
        }

        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.setAttribute("data-id", user.id);

        let inventoryHTML = "";
        if (user.inventory && user.inventory.length > 0) {
            inventoryHTML = user.inventory.map(inv =>
                `<span>${inv.name} (${inv.quantity},${inv.condition})
                    <span class="edit-inventory-button" onclick="editAssignedInventory(${user.id}, '${inv.name}', ${inv.quantity}, '${inv.condition}')">✏️</span>
                    <span class="delete-inventory-button" onclick="deleteAssignedInventory(${user.id}, '${inv.name}', ${inv.quantity}, '${inv.condition}')">❌</span>
                </span>`
            ).join("<br>");
        } else {
            inventoryHTML = "Нет закрепленного инвентаря";
        }

        userItem.innerHTML = `
            <span>${user.id}. ${user.first_name} ${user.last_name}</span>
            <div class="inventory">${inventoryHTML}</div>
            <div>
                <button class="assign-button" onclick="assignInventory(this)">Закрепить инвентарь</button>
            </div>
        `;

        userList.appendChild(userItem);
    });
}


async function assignInventory(button) {
    const userItem = button.closest(".user-item");
    const userId = userItem.getAttribute("data-id");

    try {
        const response = await fetch("http://127.0.0.1:8000/free-inventory");
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        const inventory = await response.json();
        if (inventory.length === 0) {
            alert("Нет доступного инвентаря.");
            return;
        }

        // Группируем инвентарь по имени, но учитываем состояния
        const groupedInventory = {};
        inventory.forEach(item => {
            if (!groupedInventory[item.name]) {
                groupedInventory[item.name] = [];
            }
            groupedInventory[item.name].push(item);
        });

        const inventoryNames = Object.keys(groupedInventory).join("\n");
        const selectedItemName = prompt(`Выберите инвентарь:\n${inventoryNames}`);

        const selectedItems = groupedInventory[selectedItemName];
        if (!selectedItems) {
            alert("Такого инвентаря нет.");
            return;
        }

        // Выбор состояния (если есть несколько вариантов)
        let selectedItem;
        if (selectedItems.length > 1) {
            const conditionsList = selectedItems.map(item => `${item.condition} (${item.quantity} шт.)`).join("\n");
            const selectedCondition = prompt(`Выберите состояние для ${selectedItemName}:\n${conditionsList}`);
            selectedItem = selectedItems.find(item => selectedCondition.startsWith(item.condition));
        } else {
            selectedItem = selectedItems[0]; // Если один вариант, сразу выбираем его
        }

        if (!selectedItem) {
            alert("Такого состояния нет.");
            return;
        }

        const quantity = parseInt(prompt(`Введите количество (доступно: ${selectedItem.quantity}):`));
        if (isNaN(quantity) || quantity <= 0 || quantity > selectedItem.quantity) {
            alert("Неверное количество.");
            return;
        }

        const assignData = {
            user_id: userId,
            item_id: selectedItem.id,
            quantity,
            condition: selectedItem.condition
        };

        const assignResponse = await fetch("http://127.0.0.1:8000/assign-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignData),
        });

        if (!assignResponse.ok) throw new Error(`Ошибка HTTP: ${assignResponse.status}`);

        alert("Инвентарь закреплён!");
        fetchUsers();
        updateFreeInventory();
    } catch (error) {
        console.error("Ошибка при закреплении инвентаря:", error);
        alert("Ошибка при закреплении.");
    }
}




async function editAssignedInventory(userId, itemName, currentQuantity, condition) {
    if (!condition) {
        alert("Ошибка: состояние инвентаря не передано.");
        return;
    }

    const newQuantity = parseInt(prompt(`Введите новое количество для ${itemName} (${condition}):`, currentQuantity));
    if (isNaN(newQuantity) || newQuantity <= 0) {
        alert("Некорректное количество.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/edit-assigned-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, item_name: itemName, new_quantity: newQuantity, condition }),
        });

        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        alert("Инвентарь обновлён!");
        fetchUsers();
        updateFreeInventory();
    } catch (error) {
        console.error("Ошибка при редактировании инвентаря:", error);
        alert("Ошибка при редактировании.");
    }
}



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


async function addInventory() {
    const inventoryName = document.getElementById("inventoryName").value;
    const inventoryQuantity = parseInt(document.getElementById("inventoryQuantity").value);
    const inventoryCondition = document.getElementById("inventoryCondition").value;

    if (!inventoryName || isNaN(inventoryQuantity) || inventoryQuantity <= 0) {
        alert("Введите корректные данные.");
        return;
    }

    // Проверяем, есть ли уже такой предмет в инвентаре
    const existingItems = Array.from(document.querySelectorAll("#inventoryList .inventory-item"));
    let found = false;

    existingItems.forEach(item => {
        const name = item.getAttribute("data-name");
        const condition = item.getAttribute("data-condition");
        let quantity = parseInt(item.getAttribute("data-quantity"));

        if (name === inventoryName && condition === inventoryCondition) {
            quantity += inventoryQuantity;
            item.setAttribute("data-quantity", quantity);
            item.querySelector(".inventory-text").textContent = `${name} (${quantity} шт., ${condition})`;
            found = true;
        }
    });

    if (found) {
        alert("Инвентарь обновлён!");
        return;
    }
    const inventoryList = document.getElementById("inventoryList");
    const inventoryItem = document.createElement("div");
    inventoryItem.className = "inventory-item";
    inventoryItem.setAttribute("data-name", inventoryName);
    inventoryItem.setAttribute("data-condition", inventoryCondition);
    inventoryItem.setAttribute("data-quantity", inventoryQuantity);
    inventoryItem.innerHTML = `
        <span class="inventory-text">${inventoryName} (${inventoryQuantity} шт., ${inventoryCondition})</span>
        <span class="delete-inventory-button" onclick="deleteInventory('${inventoryName}', '${inventoryCondition}')">❌</span>
    `;

    inventoryList.appendChild(inventoryItem);

    try {
        const response = await fetch("http://127.0.0.1:8000/free-inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: inventoryName, quantity: inventoryQuantity, condition: inventoryCondition }),
        });

        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        alert("Инвентарь добавлен!");
        document.getElementById("inventoryName").value = "";
        document.getElementById("inventoryQuantity").value = "";
    } catch (error) {
        console.error("Ошибка при добавлении инвентаря:", error);
        alert("Ошибка при добавлении инвентаря.");
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
document.addEventListener("DOMContentLoaded", fetchFreeInventory);

async function fetchFreeInventory() {
    try {
        const response = await fetch("http://127.0.0.1:8000/free-inventory");
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const inventory = await response.json();
        renderInventoryList(inventory);
    } catch (error) {
        console.error("Ошибка загрузки инвентаря:", error);
    }
}

// Отображение списка свободного инвентаря
function renderInventoryList(inventory) {
    const inventoryList = document.getElementById("inventoryList");
    inventoryList.innerHTML = "";

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
        fetchFreeInventory();
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
        fetchFreeInventory();
    } catch (error) {
        console.error("Ошибка при удалении инвентаря:", error);
        alert("Ошибка при удалении.");
    }
}

async function updateFreeInventory() {
    await fetchFreeInventory();
}
document.addEventListener("DOMContentLoaded", fetchPurchases);

async function fetchPurchases() {
    try {
        const response = await fetch("http://127.0.0.1:8000/purchase-planning");
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        const purchases = await response.json();
        renderPurchaseList(purchases);
    } catch (error) {
        console.error("Ошибка загрузки заявок:", error);
    }
}

function renderPurchaseList(purchases) {
    const purchaseList = document.getElementById("purchaseList");
    purchaseList.innerHTML = "";

    purchases.forEach(purchase => {
        const purchaseItem = document.createElement("div");
        purchaseItem.className = "purchase-item";
        purchaseItem.setAttribute("data-id", purchase.id);
        purchaseItem.innerHTML = `
            <span>${purchase.item} - ${purchase.supplier} (${purchase.quantity} шт.,${purchase.total_price} руб)</span>
            <select class="status-select" onchange="updatePurchaseStatus(${purchase.id}, this.value)">
                <option value="В обработке" ${purchase.status === "В обработке" ? "selected" : ""}>В обработке</option>
                <option value="Одобрено" ${purchase.status === "Одобрено" ? "selected" : ""}>Одобрено</option>
                <option value="Отклонено" ${purchase.status === "Отклонено" ? "selected" : ""}>Отклонено</option>
            </select>
        `;

        purchaseList.appendChild(purchaseItem);
    });
}



async function addPurchase() {
    const purchaseItem = document.getElementById("purchaseItem").value;
    const purchaseSupplier = document.getElementById("purchaseSupplier").value;
    const purchaseQuantity = parseInt(document.getElementById("purchaseQuantity").value);
    const purchaseTotalPrice = parseFloat(document.getElementById("purchaseTotalPrice").value);

    if (!purchaseItem || !purchaseSupplier || isNaN(purchaseQuantity) || purchaseQuantity <= 0 || isNaN(purchaseTotalPrice) || purchaseTotalPrice <= 0) {
        alert("Заполните все поля корректно.");
        return;
    }

    const newPurchase = {
        item: purchaseItem,
        supplier: purchaseSupplier,
        quantity: purchaseQuantity,
        total_price: purchaseTotalPrice
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/purchase-planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPurchase),
        });

        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        alert("Заявка отправлена!");
        fetchPurchases();
        document.getElementById("purchaseItem").value = "";
        document.getElementById("purchaseSupplier").value = "";
        document.getElementById("purchaseQuantity").value = "";
        document.getElementById("purchaseTotalPrice").value = "";
    } catch (error) {
        console.error("Ошибка при добавлении заявки:", error);
        alert("Ошибка при добавлении заявки.");
    }
}


async function updatePurchaseStatus(purchaseId, newStatus) {
    try {
        const response = await fetch("http://127.0.0.1:8000/update-purchase-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: purchaseId, status: newStatus }),
        });

        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        alert("Статус заявки обновлён!");
    } catch (error) {
        console.error("Ошибка при обновлении статуса заявки:", error);
        alert("Ошибка при обновлении статуса.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchAllRequests();
    fetchAdminInfo();
});

document.getElementById('refresh-requests').addEventListener('click', fetchAllRequests);

async function fetchAllRequests() {
    try {
        const response = await fetch('http://127.0.0.1:8000/all-requests');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        renderAllRequests(data.requests);
    } catch (error) {
        console.error("Ошибка загрузки заявок:", error);
        alert("Ошибка при загрузке заявок.");
    }
}

function renderAllRequests(requests) {
    const requestTable = document.getElementById('requestTable');
    if (!requestTable) {
        console.error("Элемент с id 'requestTable' не найден.");
        return;
    }

    requestTable.innerHTML = "";

    if (requests.length === 0) {
        requestTable.innerHTML = "<div class='table-row'>Нет заявок</div>";
        return;
    }

    requests.forEach(request => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div class="table-cell">${request.user_name}</div>
            <div class="table-cell">${request.item_name}</div>
            <div class="table-cell">${request.quantity}</div>
            <div class="table-cell">
                <select class="status-select" data-request-id="${request.id}">
                    <option value="В обработке" ${request.status === "В обработке" ? "selected" : ""}>В обработке</option>
                    <option value="Одобрено" ${request.status === "Одобрено" ? "selected" : ""}>Одобрено</option>
                    <option value="Отклонено" ${request.status === "Отклонено" ? "selected" : ""}>Отклонено</option>
                </select>
            </div>
            <div class="table-cell">
                <button class="update-status" data-request-id="${request.id}">Сохранить</button>
            </div>
        `;
        requestTable.appendChild(row);
    });

    document.querySelectorAll(".update-status").forEach(button => {
        button.addEventListener("click", function () {
            const requestId = this.getAttribute("data-request-id");
            const newStatus = document.querySelector(`.status-select[data-request-id="${requestId}"]`).value;
            updateRequestStatus(requestId, newStatus);
        });
    });
}
async function updateRequestStatus(requestId, newStatus) {
    try {
        const response = await fetch('http://127.0.0.1:8000/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                request_id: parseInt(requestId),
                new_status: newStatus
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        alert("Статус заявки обновлён!");
        fetchAllRequests();
    } catch (error) {
        console.error("Ошибка при обновлении статуса заявки:", error);
        alert("Ошибка при обновлении статуса заявки.");
    }
}

async function fetchAdminInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminId = urlParams.get('user_id'); // ID админа из URL

    if (!adminId) {
        console.error("Ошибка: ID админа не найден.");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/admin-info?user_id=${adminId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        document.getElementById('adminWelcome').textContent = `Добро пожаловать, ${data.first_name} ${data.last_name}`;
    } catch (error) {
        console.error("Ошибка загрузки данных админа:", error);
        alert("Ошибка при загрузке информации об администраторе.");
    }
}

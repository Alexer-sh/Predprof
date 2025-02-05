let userId = 1;
const inventory = {};
const purchases = [];
const requests = [];

function addUser() {
    const firstName = document.getElementById("userFirstName").value;
    const lastName = document.getElementById("userLastName").value;
    const birthDate = document.getElementById("userBirthDate").value;

    if (firstName && lastName && birthDate) {
        const userList = document.getElementById("userList");
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.setAttribute("data-id", userId);
        userItem.innerHTML = `
            <span>${userId}. ${firstName} ${lastName} (Дата рождения: ${birthDate})</span>
            <div>
                <span class="inventory"></span>
                <button class="assign-button" onclick="assignInventory(this)">Закрепить инвентарь</button>
                <span class="delete-button" onclick="deleteUser(this)">Удалить</span>
            </div>
        `;
        userList.appendChild(userItem);
        userId++;
    }
}

function assignInventory(button) {
    const userItem = button.closest(".user-item");
    const inventoryOptions = Object.keys(inventory);
    const selectedInventory = prompt(`Выберите инвентарь: ${inventoryOptions.join(', ')}`);

    if (selectedInventory && inventory[selectedInventory].quantity > 0) {
        const quantityToAssign = prompt(`Введите количество инвентаря (осталось: ${inventory[selectedInventory].quantity}):`);
        const quantity = parseInt(quantityToAssign);

        if (quantity > 0 && quantity <= inventory[selectedInventory].quantity) {
            inventory[selectedInventory].quantity -= quantity;
            const inventoryDisplay = userItem.querySelector(".inventory");
            inventoryDisplay.innerHTML = `${selectedInventory} (${quantity})
                <span class="edit-inventory-button" onclick="editAssignedInventory(this)">Редактировать</span>
                <span class="delete-inventory-button" onclick="deleteAssignedInventory(this)">Удалить</span>`;
            updateInventoryDisplay();
        } else {
            alert("Недостаточное количество инвентаря или неверное число.");
        }
    } else {
        alert("Этот инвентарь недоступен.");
    }
}

function editAssignedInventory(element) {
    const userItem = element.closest(".user-item");
    const inventoryText = userItem.querySelector(".inventory").textContent.split(" (")[0];
    const currentQuantity = parseInt(userItem.querySelector(".inventory").textContent.match(/\d+/)[0]);
    const newQuantity = prompt(`Введите новое количество для ${inventoryText}:`, currentQuantity);

    if (newQuantity && newQuantity > 0) {
        const inventoryName = inventoryText.trim();
        const difference = newQuantity - currentQuantity;

        if (inventory[inventoryName].quantity >= difference) {
            inventory[inventoryName].quantity -= difference;
            userItem.querySelector(".inventory").innerHTML = `${inventoryName} (${newQuantity})
                <span class="edit-inventory-button" onclick="editAssignedInventory(this)">Редактировать</span>
                <span class="delete-inventory-button" onclick="deleteAssignedInventory(this)">Удалить</span>`;
            updateInventoryDisplay();
        } else {
            alert("Недостаточное количество инвентаря на складе.");
        }
    }
}

function deleteAssignedInventory(element) {
    const userItem = element.closest(".user-item");
    const inventoryText = userItem.querySelector(".inventory").textContent.split(" (")[0];
    const quantity = parseInt(userItem.querySelector(".inventory").textContent.match(/\d+/)[0]);
    const inventoryName = inventoryText.trim();

    if (inventory[inventoryName]) {
        inventory[inventoryName].quantity += quantity;
        userItem.querySelector(".inventory").innerHTML = "";
        updateInventoryDisplay();
    }
}

function deleteUser(element) {
    const userItem = element.closest(".user-item");
    userItem.remove();
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
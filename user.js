document.getElementById('addInventory').addEventListener('click', function() {
    const name = document.getElementById('inventoryName').value;
    const quantity = document.getElementById('inventoryQuantity').value;

    if (name && quantity) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${name}</div>
            <div>${quantity}</div>
            <div>Доступен</div>
        `;
        document.getElementById('inventoryTable').appendChild(row);

        document.getElementById('inventoryName').value = '';
        document.getElementById('inventoryQuantity').value = '';
    }
});

document.getElementById('createRequest').addEventListener('click', function() {
    const name = document.getElementById('requestName').value;
    const quantity = document.getElementById('requestQuantity').value;

    if (name && quantity) {
        alert(`Заявка на ${quantity} единиц инвентаря "${name}" создана.`);
        document.getElementById('requestName').value = '';
        document.getElementById('requestQuantity').value = '';
    }
});

document.getElementById('addTracking').addEventListener('click', function() {
    const name = document.getElementById('trackingName').value;
    const quantity = document.getElementById('trackingQuantity').value;

    if (name && quantity) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${name}</div>
            <div>${quantity}</div>
            <div>В обработке</div>
        `;
        document.getElementById('trackingTable').appendChild(row);

        document.getElementById('trackingName').value = '';
        document.getElementById('trackingQuantity').value = '';
    }
});
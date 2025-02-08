from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder=".")
CORS(app)  # Включение CORS для всех маршрутов
purchase_requests = []
# Логирование всех запросов
@app.before_request
def log_requests():
    print(f"Incoming request: {request.method} {request.path}")

# Маршрут для отдачи статических файлов
@app.route("/<path:path>", methods=["GET"])
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory(".", path)
    return jsonify({"error": "File not found"}), 404

# Временная база пользователей (замени на БД)
users = [
    {"id": 0, "first_name": "ц5ккпыц", "last_name": "фуафуа", "email": "admin@example.com", "password": "admin123", "role": "admin", "inventory": []},
    {"id": 1, "first_name": "Евреев", "last_name": "Сжигатель", "email": "regerf@aefaef", "password": "aewfae", "role": "user", "inventory": []},
    {"id": 2, "first_name": "Ясосу", "last_name": "Бибу", "email": "user@example.com", "password": "user123", "role": "user", "inventory": []}
]
# Маршруты
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    print(data)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")

    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    # Проверяем, существует ли пользователь с таким email
    if any(user["email"] == email for user in users):
        return jsonify({"error": "User with this email already exists"}), 400

    # Создаём нового пользователя
    new_user = {
        "id": len(users),  # ID будет равен текущему количеству пользователей
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": password,
        "role": "user",  # По умолчанию роль "user"
        "inventory": []  # Пустой инвентарь
    }

    users.append(new_user)  # Добавляем пользователя в список
    print(f"New user registered: {new_user}")

    return jsonify({"message": "Registration successful", "user": new_user}), 201\

@app.route("/signin", methods=["POST"])
def signin():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Ищем пользователя по email
    user = next((u for u in users if u["email"] == email), None)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Проверяем пароль
    if user["password"] != password:
        return jsonify({"error": "Invalid password"}), 401

    # Возвращаем успешный ответ с ролью пользователя
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "role": user["role"]
        }
    }), 200

# Получение списка пользователей
@app.route('/users', methods=['GET'])
def get_users():
    return jsonify(users)

# Добавление нового пользователя
@app.route('/users', methods=['POST'])
def add_user():
    data = request.json
    if not data or "first_name" not in data or "last_name" not in data or "birth_date" not in data:
        return jsonify({"error": "Некорректные данные"}), 400

    new_user = {
        "id": len(users) + 1,
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "birth_date": data["birth_date"]
    }
    users.append(new_user)
    print(new_user)
    return jsonify({"message": "Пользователь добавлен", "user": new_user}), 201

free_inventory = [
    {"id": 1, "name": "Мячи", "quantity": 10, "condition": "Новый"},
    {"id": 2, "name": "Ракетки", "quantity": 5, "condition": "Б/У"}
]

# Получение списка свободного инвентаря
@app.route('/free-inventory', methods=['GET'])
def get_free_inventory():
    return jsonify(free_inventory)

# Добавление нового инвентаря
@app.route('/free-inventory', methods=['POST'])
def add_free_inventory():
    data = request.json
    name = data.get("name")
    quantity = int(data.get("quantity"))
    condition = data.get("condition")

    if not name or quantity <= 0 or not condition:
        return jsonify({"error": "Некорректные данные"}), 400

    # Проверяем, есть ли уже такой предмет в нужном состоянии
    existing_item = next((item for item in free_inventory if item["name"] == name and item["condition"] == condition), None)

    if existing_item:
        existing_item["quantity"] += quantity  # Если есть, увеличиваем количество
    else:
        free_inventory.append({"id": len(free_inventory) + 1, "name": name, "quantity": quantity, "condition": condition})

    return jsonify({"message": "Инвентарь обновлён"}), 200

# Удаление инвентаря
@app.route('/free-inventory/<int:item_id>', methods=['DELETE'])
def delete_free_inventory(item_id):
    global free_inventory
    free_inventory = [item for item in free_inventory if item["id"] != item_id]
    return jsonify({"message": "Инвентарь удалён"}), 200

@app.route('/assign-inventory', methods=['POST'])
def assign_inventory():
    data = request.json
    user_id = int(data.get("user_id"))
    item_id = int(data.get("item_id"))
    quantity = int(data.get("quantity"))
    condition = data.get("condition")

    user = next((u for u in users if u["id"] == user_id), None)
    item = next((i for i in free_inventory if i["id"] == item_id and i["condition"] == condition), None)

    if not user or not item or quantity <= 0 or item["quantity"] < quantity:
        return jsonify({"error": "Неверные данные"}), 400

    if "inventory" not in user:
        user["inventory"] = []

    user["inventory"].append({
        "name": item["name"],
        "quantity": quantity,
        "condition": condition
    })
    item["quantity"] -= quantity

    return jsonify({"message": "Инвентарь закреплён"}), 200
@app.route('/edit-assigned-inventory', methods=['POST'])
def edit_assigned_inventory():
    data = request.json
    user_id = int(data.get("user_id"))
    item_name = data.get("item_name")
    new_quantity = int(data.get("new_quantity"))

    user = next((u for u in users if u["id"] == user_id), None)
    if not user or not item_name or new_quantity <= 0:
        return jsonify({"error": "Неверные данные"}), 400

    assigned_item = next((inv for inv in user["inventory"] if inv["name"] == item_name), None)
    free_item = next((inv for inv in free_inventory if inv["name"] == item_name), None)

    if not assigned_item:
        return jsonify({"error": "Инвентарь не найден"}), 404

    current_quantity = assigned_item["quantity"]

    if new_quantity > current_quantity:
        # Увеличение количества у пользователя
        increase_amount = new_quantity - current_quantity
        if free_item and free_item["quantity"] >= increase_amount:
            free_item["quantity"] -= increase_amount
            assigned_item["quantity"] = new_quantity
        else:
            return jsonify({"error": "Недостаточно свободного инвентаря"}), 400
    else:
        # Уменьшение количества у пользователя
        decrease_amount = current_quantity - new_quantity
        assigned_item["quantity"] = new_quantity
        if free_item:
            free_item["quantity"] += decrease_amount
        else:
            free_inventory.append({"id": len(free_inventory) + 1, "name": item_name, "quantity": decrease_amount, "condition": "Б/У"})

    return jsonify({"message": "Инвентарь обновлён"}), 200

@app.route('/remove-assigned-inventory', methods=['POST'])
def remove_assigned_inventory():
    data = request.json
    user_id = int(data.get("user_id"))
    item_name = data.get("item_name")
    quantity = int(data.get("quantity"))

    user = next((u for u in users if u["id"] == user_id), None)
    if not user or not item_name or quantity <= 0:
        return jsonify({"error": "Неверные данные"}), 400

    # Проверяем, есть ли у пользователя этот предмет
    assigned_item = next((inv for inv in user["inventory"] if inv["name"] == item_name), None)
    if not assigned_item or assigned_item["quantity"] < quantity:
        return jsonify({"error": "Недостаточно инвентаря у пользователя"}), 400

    # Уменьшаем количество у пользователя или полностью удаляем предмет
    if assigned_item["quantity"] == quantity:
        user["inventory"].remove(assigned_item)
    else:
        assigned_item["quantity"] -= quantity

    # Возвращаем в свободный инвентарь
    free_item = next((inv for inv in free_inventory if inv["name"] == item_name), None)
    if free_item:
        free_item["quantity"] += quantity  # Если предмет уже есть, увеличиваем количество
    else:
        free_inventory.append({"id": len(free_inventory) + 1, "name": item_name, "quantity": quantity, "condition": "Б/У"})

    return jsonify({"message": "Инвентарь удалён у пользователя и возвращён в свободный"}), 200
@app.route('/purchase-planning', methods=['POST'])
def add_purchase_request():
    data = request.json
    if not data or "item" not in data or "supplier" not in data or "quantity" not in data or "total_price" not in data:
        return jsonify({"error": "Некорректные данные"}), 400

    new_request = {
        "id": len(purchase_requests) + 1,
        "item": data["item"],
        "supplier": data["supplier"],
        "quantity": data["quantity"],
        "total_price": data["total_price"],
        "status": "ЗАЯВКА ПОЛУЧЕНА"
    }

    purchase_requests.append(new_request)
    return jsonify({"message": "Заявка добавлена", "request": new_request}), 201


@app.route('/purchase-planning', methods=['GET'])
def get_purchase_requests():
    return jsonify(purchase_requests)

@app.route('/update-purchase-status', methods=['POST'])
def update_purchase_status():
    data = request.json
    purchase_id = int(data.get("id"))
    new_status = data.get("status")

    request_item = next((p for p in purchase_requests if p["id"] == purchase_id), None)
    if not request_item:
        return jsonify({"error": "Заявка не найдена"}), 404

    request_item["status"] = new_status
    return jsonify({"message": "Статус обновлён"}), 200

@app.route('/user-inventory', methods=['GET'])
def get_user_inventory():
    user_id = request.args.get('user_id')  # Получаем user_id из query-параметров
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    user = next((u for u in users if u["id"] == int(user_id)), None)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"inventory": user.get("inventory", [])}), 200
# Временная база заявок (замени на БД)
requests = []

# Маршрут для создания заявки
@app.route('/create-request', methods=['POST'])
def create_request():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_id = data.get("user_id")
    item_name = data.get("item_name")
    quantity = data.get("quantity")

    if not user_id or not item_name or not quantity:
        return jsonify({"error": "Missing fields"}), 400

    # Находим пользователя по user_id
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Создаём новую заявку
    new_request = {
        "id": len(requests) + 1,  # Уникальный ID заявки
        "user_id": user_id,
        "user_name": f"{user['first_name']} {user['last_name']}",  # Имя и фамилия заявителя
        "item_name": item_name,
        "quantity": quantity,
        "status": "В обработке"  # Статус по умолчанию
    }

    requests.append(new_request)  # Добавляем заявку в список
    print(f"New request created: {new_request}")

    return jsonify({"message": "Request created", "request": new_request}), 201

# Маршрут для получения заявок пользователя
@app.route('/user-requests', methods=['GET'])
def get_user_requests():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    user_requests = [req for req in requests if req["user_id"] == int(user_id)]
    return jsonify({"requests": user_requests}), 200

# Маршрут для получения всех заявок (для админа)
@app.route('/all-requests', methods=['GET'])
def get_all_requests():
    return jsonify({"requests": requests}), 200

@app.route('/update-request-status', methods=['POST'])
def update_request_status():
    data = request.json
    request_id = data.get("request_id")
    new_status = data.get("new_status")

    if request_id is None or new_status not in ["В обработке", "Одобрено", "Отклонено"]:
        return jsonify({"error": "Неверные данные"}), 400

    request_item = next((req for req in requests if req["id"] == int(request_id)), None)
    if not request_item:
        return jsonify({"error": "Заявка не найдена"}), 404

    request_item["status"] = new_status
    print(f"Статус заявки {request_id} обновлён: {new_status}")

    return jsonify({"message": "Статус заявки обновлён"}), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder=".")
CORS(app)  # Включение CORS для всех маршрутов

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


# Маршруты
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    print(data)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("signup-username")
    email = data.get("signup-email")
    password = data.get("signup-password")

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    print(f"Received signup data: {data}")
    return jsonify({"message": "Registration successful"})

@app.route("/signin", methods=["POST"])
def signin():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    users = {
        "admin@example.com": {"password": "admin123", "role": "admin"},
        "user@example.com": {"password": "user123", "role": "user"}
    }

    if email in users and users[email]["password"] == password:
        return jsonify({"message": "Login successful", "role": users[email]["role"]}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)

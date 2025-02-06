import sqlite3

DB_NAME = "users.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            last_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    ''')

    # Таблица инвентаря пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            condition TEXT DEFAULT 'good',  -- Состояние предмета
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

def add_user(last_name, first_name, email, password, role="user"):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO users (last_name, first_name, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (last_name, first_name, email, password, role))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Почта уже занята
    finally:
        conn.close()

def get_user(email):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def get_all_users():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT id, last_name, first_name, email, role FROM users')
    users = cursor.fetchall()
    conn.close()
    return users

def add_inventory(email, item_name, quantity, condition="good"):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return False  # Пользователь не найден

    user_id = user[0]

    cursor.execute('SELECT quantity, condition FROM inventory WHERE user_id = ? AND item_name = ?', (user_id, item_name))
    existing = cursor.fetchone()

    if existing:
        new_quantity = existing[0] + quantity
        cursor.execute('''
            UPDATE inventory 
            SET quantity = ?, condition = ?
            WHERE user_id = ? AND item_name = ?
        ''', (new_quantity, condition, user_id, item_name))
    else:
        cursor.execute('''
            INSERT INTO inventory (user_id, item_name, quantity, condition) 
            VALUES (?, ?, ?, ?)
        ''', (user_id, item_name, quantity, condition))

    conn.commit()
    conn.close()
    return True

def get_user_inventory(email):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT item_name, quantity, condition FROM inventory
        WHERE user_id = (SELECT id FROM users WHERE email = ?)
    ''', (email,))
    inventory = cursor.fetchall()
    conn.close()

    return [{"item": item[0], "quantity": item[1], "condition": item[2]} for item in inventory]

def update_inventory_condition(email, item_name, new_condition):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE inventory
        SET condition = ?
        WHERE user_id = (SELECT id FROM users WHERE email = ?) AND item_name = ?
    ''', (new_condition, email, item_name))

    conn.commit()
    conn.close()
    return True

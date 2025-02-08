import sqlite3
connection = sqlite3.connect('Sport.db')
cursor = connection.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS Users
              (id  INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, name  TEXT UNIQUE, password TEXT, salt TEXT, is_admin BOOLEAN, email TEXT)''')
connection.commit()
cursor.execute('''CREATE TABLE IF NOT EXISTS shopList
              (id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, name  TEXT, manufact TEXT, price INTEGER)''')
connection.commit()
cursor.execute('''CREATE TABLE IF NOT EXISTS inventory
              (id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, name  TEXT UNIQUE, cond TEXT)''')
connection.commit()
cursor.execute('''CREATE TABLE IF NOT EXISTS connections
              (user_id INTEGER, invent_id INTEGER, FOREIGN KEY(invent_id) REFERENCES inventory(id),FOREIGN KEY(user_id) REFERENCES users(id))''')
connection.commit()
connection.close()

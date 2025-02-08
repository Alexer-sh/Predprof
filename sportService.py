import os
import sqlite3
import argon2
import datetime
import hashlib
from fastapi import  Depends
from sportModel import User

ph = argon2.PasswordHasher()


def get_db():
    connection = sqlite3.connect('Sport.db',check_same_thread=False)
    connection.row_factory = sqlite3.Row
    try:
        yield connection.cursor()
    finally:
        connection.commit()
        connection.close()

def Create_user(name,password,email,is_admin, cursor: sqlite3.Cursor ):
    salt,hashed_password=salt_and_hash_password(password)
    cursor.execute('''INSERT INTO Users( name, password, salt, email, is_admin)
            VALUES( ?, ?, ?, ?, ?)''', ( name, hashed_password, salt,email,is_admin))

def Admin(loged_name, cursor: sqlite3.Cursor):
    user=User.getByName(cursor,loged_name)
    return user.is_admin


def salt_and_hash_password(password):
    salt = os.urandom(16)
    salted_password = salt + password.encode('utf-8')
    hashed_password = ph.hash(salted_password)
    return salt, hashed_password

def password_correct(hash,salt,password):
    salted_password = salt + password.encode('utf-8')
    try:
        ph.verify(hash,salted_password)
        return True
    except argon2.exceptions.VerifyMismatchError:
        return False

def get_free_inventory(cursor: sqlite3.Cursor):
    cursor.execute("""SELECT * FROM inventory WHERE cond != 'reserved'""")
    inventory=cursor.fetchall()
    lst=[]

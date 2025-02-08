from pydantic import BaseModel
import sqlite3

class FeaturedModel(BaseModel):
    class Config: orm_mode = True

class New_user(FeaturedModel):
    name:str
    password:str
    email:str

class User(FeaturedModel):
    id:int
    email:str
    name:str
    password:str
    salt:bytes
    is_admin:bool
    @staticmethod
    def getByName(cursor: sqlite3.Cursor,username: str):
        try:

            cursor.execute("""SELECT * FROM Users WHERE name = ?""", ((username,)))
            return User(**cursor.fetchone())
        except TypeError as e:
            return None
    @staticmethod
    def getById(id,cursor: sqlite3.Cursor):
        try:
            cursor.execute("""SELECT * FROM Users WHERE id = ?""", ((id,)))
            return User(**cursor.fetchone())
        except TypeError as e:
            return None
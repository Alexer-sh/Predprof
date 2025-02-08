
import os
import sqlite3
import argon2
import datetime
import hashlib
from fastapi import FastAPI, UploadFile, Form, Depends, HTTPException, status, Response, Cookie
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from uuid import uuid4 
from time import time
import re
from starlette.responses import FileResponse
from typing import Annotated, Mapping
from sportModel import New_user, User
from sportService import Create_user, Admin, get_free_inventory, get_db, password_correct

sport = FastAPI()

from pydantic import BaseModel

ph = argon2.PasswordHasher()


sec = HTTPBasic()

COOKIE_ALIAS = "SKET"

session_storage: Mapping[str, str] = dict()

def check_auth(credentials: Annotated[HTTPBasicCredentials, Depends(sec)], db: sqlite3.Cursor = Depends(get_db)):
    login = credentials.username
    passw = credentials.password
    exc = HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or passw", headers={"WWW_Authenticate": "Basic"})
    fetched_user = User.getByName(db, login)

    if fetched_user is None:
        raise exc
    is_correct = password_correct(fetched_user.password, fetched_user.salt, passw)
    if not is_correct:
        raise exc
    
    return fetched_user.id
    


def set_session(id):
    sessid = uuid4().hex
    while sessid in session_storage.keys():
        sessid = uuid4().hex
    session_storage[sessid] = str(id)
    return sessid


def get_session(sessid: str = Cookie(default=None, alias=COOKIE_ALIAS)):
    print(sessid)
    exc = HTTPException(status.HTTP_403_FORBIDDEN, detail="Access forbidden")
    if not sessid:
        raise exc
    if re.match(r'[a-f0-9]{32}', sessid) is None:
        raise exc
    sess = session_storage.get(sessid)
    if sess is None:
        raise exc
    
    return sess


    
def rem_session(sess_data: str = Depends(get_session), sessid: str = Cookie(default=None, alias=COOKIE_ALIAS)):
    del session_storage[sessid]
    return sess_data


@sport.post("/new_user")
def new_user(data:New_user, cursor: sqlite3.Cursor = Depends(get_db)):
    try:
        Create_user(data.name, data.password,data.email,False,cursor)
    except sqlite3.Error as error:
        print("Ошибка при работе с SQLite", error)
        return {"message": "this user already exist"}

@sport.post("/new_admin")
def new_admin(data:New_user,credentials: Annotated[HTTPBasicCredentials, Depends(sec)], cursor: sqlite3.Cursor = Depends(get_db)):
    try:
        if Admin(credentials.username,cursor):
            Create_user(data.name, data.password,data.email,True,cursor)
        else:
            return {"message": "only admins can make admins"}
    except sqlite3.Error as error:
        print("Ошибка при работе с SQLite", error)
        return {"message": "this user already exist"}

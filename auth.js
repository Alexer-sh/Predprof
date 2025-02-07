const signUpButton = document.getElementById('signUp'); // Кнопка для переключения на регистрацию
const signInButton = document.getElementById('signIn'); // Кнопка для переключения на вход
const container = document.getElementById('container');

// Кнопки для отправки данных на сервер
const signupSubmitButton = document.getElementById('signup-button'); // Кнопка для отправки данных регистрации
const signinSubmitButton = document.getElementById('signin-button'); // Кнопка для отправки данных входа

// Переключение на регистрацию
signUpButton.addEventListener('click', () => {
	container.classList.add('right-panel-active');
});

// Переключение на вход
signInButton.addEventListener('click', () => {
	container.classList.remove('right-panel-active');
});

// Отправка данных регистрации
// Отправка данных регистрации
// Отправка данных регистрации
signupSubmitButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const data = getFormData('.sign-up-container');

    const requestData = {
        "first_name": data['signup-firstname'],  // Имя
        "last_name": data['signup-lastname'],    // Фамилия
        "email": data['signup-email'],           // Email
        "password": data['signup-password']      // Пароль
    };

    if (!requestData["first_name"] || !requestData["last_name"] || !requestData["email"] || !requestData["password"]) {
        alert("Заполните все поля!");
        return;
    }

    sendMessage('/signup', requestData)
        .then(result => {
            console.log("Ответ от сервера:", result);
            alert("Регистрация успешна!");
            window.location.href = "auth.html";  // Перенаправляем на страницу авторизации
        })
        .catch(error => {
            console.error("Ошибка регистрации:", error);
            alert("Ошибка при регистрации. Попробуйте снова.");
        });
});
// Отправка данных входа
signinSubmitButton.addEventListener('click', async (event) => {
    event.preventDefault(); // Останавливаем стандартное поведение кнопки

    const data = getFormData('.sign-in-container'); // Получаем данные формы
    console.log("Отправляемые данные:", data); // Логируем для проверки

    // Преобразуем объект в нужный формат
    const requestData = {
        email: data['signin-email'],
        password: data['signin-password']
    };

    if (!requestData.email || !requestData.password) {
        alert("Введите почту и пароль!");
        return;
    }

    console.log("Отправка данных на сервер:", requestData);

    sendMessage('/signin', requestData)
        .then(result => {
            console.log("Ответ от сервера:", result); // Лог ответа для проверки

            if (result.user.role === "admin") {
                window.location.href = "admin.html"; // Переход в админку
            } else if (result.user.role === "user") {
                 window.location.href = `user.html?user_id=${result.user.id}`;
            } else {
                alert("Ошибка: сервер вернул некорректный ответ.");
            }
        })
        .catch(error => {
            console.error("Ошибка авторизации:", error);
            alert("Ошибка при входе. Проверьте логин и пароль.");
        });
});

// Функция для получения данных формы
function getFormData(selector) {
    const form = document.querySelector(`${selector} form`);
    const data = {};
    const inputs = form.querySelectorAll('input');

    inputs.forEach(input => {
        if (input.type !== "checkbox") {
            data[input.id] = input.value;
        }
    });

    console.log("Form data:", data);  // Логируем данные перед отправкой
    return data;
}
// Функция для отправки данных на сервер
async function sendMessage(endpoint, data) {
    const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}
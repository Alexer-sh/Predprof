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
signupSubmitButton.addEventListener('click', (event) => {
	event.preventDefault(); // Предотвращаем стандартное поведение кнопки

	// Собираем данные из формы регистрации
	const data = getFormData('.sign-up-container');
	sendMessage('/signup', data); // Отправляем данные на сервер
});

// Отправка данных входа
signinSubmitButton.addEventListener('click', (event) => {
	event.preventDefault(); // Предотвращаем стандартное поведение кнопки

	// Собираем данные из формы входа
	const data = getFormData('.sign-in-container');
	sendMessage('/signin', data); // Отправляем данные на сервер
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

    const checkbox = form.querySelector('#signin-admin');
    if (checkbox) {
        data['admin'] = checkbox.checked;
    }

    console.log("Form data:", data);  // Логируем данные перед отправкой
    return data;
}

// Функция для отправки данных на сервер
async function sendMessage(endpoint, data) {
	try {
		const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const result = await response.json();
		console.log('Server response:', result);
	} catch (error) {
		console.error('Error:', error.message);
		alert('Произошла ошибка при отправке данных. Попробуйте снова.');
	}
}
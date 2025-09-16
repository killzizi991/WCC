// Функция безопасной загрузки из localStorage
function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error);
    return null;
  }
}

// Функция безопасного сохранения в localStorage
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
    showNotification('Ошибка сохранения данных');
    return false;
  }
}

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Показ уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Приветственное сообщение
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('Добро пожаловать! Для начала работы нажмите на любой день');
    }, 1000);
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    // Предотвращение масштабирования при фокусе
    document.addEventListener('focusin', function() {
        if (window.innerWidth < 768) {
            document.body.style.zoom = '100%';
        }
    });
    
    // Восстановление после потери фокуса
    document.addEventListener('focusout', function() {
        setTimeout(() => {
            document.body.style.zoom = '';
        }, 100);
    });
}

// Проверка поддержки localStorage
function checkLocalStorageSupport() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Произошла ошибка:', e.error);
    const loadingElement = document.getElementById('app-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (typeof showNotification === 'function') {
        showNotification('Произошла ошибка приложения');
    } else {
        alert('Произошла ошибка приложения: ' + e.error.message);
    }
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанный промис:', e.reason);
    const loadingElement = document.getElementById('app-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (typeof showNotification === 'function') {
        showNotification('Ошибка: ' + e.reason.message);
    } else {
        alert('Ошибка: ' + e.reason.message);
    }
    e.preventDefault();
});

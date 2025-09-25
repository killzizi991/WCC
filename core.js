// Основные переменные
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let selectedDay = null;
let massColoringMode = null;
let isKeyboardOpen = false;
let lastWindowHeight = window.innerHeight;
let originalFunctionalBorderData = null;
let modalStack = [];

// Хранение данных - новая структура с изоляцией по шаблонам
let appSettings = loadFromStorage('appSettings') || {
  currentTemplateId: 'default',
  templates: {
    'default': {
      id: 'default',
      name: 'Основной',
      ruleBlocks: [],
      functionalBorderData: {
        sales: 30000,
        dayShift: false,
        nightShift: false,
        dayHours: 0,
        nightHours: 0
      },
      calendarData: {}
    }
  }
};

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

// Получение текущего шаблона
function getCurrentTemplate() {
  return appSettings.templates[appSettings.currentTemplateId];
}

// Получение данных календаря для текущего шаблона
function getCurrentCalendarData() {
  const template = getCurrentTemplate();
  if (!template.calendarData) {
    template.calendarData = {};
  }
  return template.calendarData;
}

// Миграция существующих данных в новую структуру
function migrateToTemplateStructure() {
  // Если есть старые данные calendarData в корне, переносим их в текущий шаблон
  const oldCalendarData = loadFromStorage('calendarData');
  if (oldCalendarData && Object.keys(oldCalendarData).length > 0 && 
      Object.keys(oldCalendarData).some(key => key.includes('-'))) {
    
    const currentTemplate = getCurrentTemplate();
    currentTemplate.calendarData = {...oldCalendarData};
    
    // Очищаем старые данные
    localStorage.removeItem('calendarData');
    saveToStorage('appSettings', appSettings);
    
    console.log('Миграция данных календаря завершена');
    return true;
  }
  return false;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Выполняем миграцию данных при необходимости
    migrateToTemplateStructure();
    
    const currentTemplate = getCurrentTemplate();
    // Миграция старого формата functionalBorderValue
    if (currentTemplate.functionalBorderValue && typeof currentTemplate.functionalBorderValue === 'number') {
        currentTemplate.functionalBorderData = {
            sales: currentTemplate.functionalBorderValue,
            dayShift: false,
            nightShift: false,
            dayHours: 0,
            nightHours: 0
        };
        delete currentTemplate.functionalBorderValue;
        saveToStorage('appSettings', appSettings);
    }

    generateCalendar();
    setupEventListeners();
    initPeriodSelector();
    loadSettingsToForm();
    
    if (!localStorage.getItem('firstRun')) {
        localStorage.setItem('firstRun', 'true');
        showWelcomeMessage();
    }
    
    window.addEventListener('resize', function() {
        const newHeight = window.innerHeight;
        const heightDifference = Math.abs(lastWindowHeight - newHeight);
        
        if (heightDifference > 200) {
            isKeyboardOpen = (newHeight < lastWindowHeight);
            lastWindowHeight = newHeight;
        }
    });
});

// Показ уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
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
    document.addEventListener('focusin', function() {
        if (window.innerWidth < 768) {
            document.body.style.zoom = '100%';
        }
    });
    
    document.addEventListener('focusout', function() {
        setTimeout(() => {
            document.body.style.zoom = '';
        }, 100);
    });
}

// Вызов оптимизации
optimizeForMobile();

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Произошла ошибка:', e.error);
    showNotification('Произошла ошибка приложения');
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанный промис:', e.reason);
    e.preventDefault();
});

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

if (!checkLocalStorageSupport()) {
    showNotification('Ваш браузер не поддерживает сохранение данных');
}

// Функция показа модального окна с управлением стеком
function showModal(modalId) {
    // Если есть текущее открытое модальное окно, скрываем его и добавляем в стек
    const currentModal = document.querySelector('.modal[style*="display: block"]');
    if (currentModal) {
        currentModal.style.display = 'none';
        modalStack.push(currentModal.id);
    }
    
    // Показываем новое модальное окно
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }
}

// Закрытие модального окна с управлением стеком
function closeModal() {
    // Скрываем текущее модальное окно
    const currentModal = document.querySelector('.modal[style*="display: block"]');
    if (currentModal) {
        currentModal.style.display = 'none';
    }
    
    // Если в стеке есть предыдущее модальное окно, показываем его
    if (modalStack.length > 0) {
        const previousModalId = modalStack.pop();
        const previousModal = document.getElementById(previousModalId);
        if (previousModal) {
            previousModal.style.display = 'block';
            return; // Не снимаем класс modal-open, т.к. есть другое открытое окно
        }
    }
    
    // Если стек пуст, снимаем класс modal-open
    document.body.classList.remove('modal-open');
}

// Закрытие всех модальных окон и очистка стека
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    modalStack = [];
    document.body.classList.remove('modal-open');
}

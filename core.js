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
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    
    // Валидация загруженных данных
    if (!validateAppSettings(parsedData)) {
      console.warn('Invalid app settings detected, using defaults');
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error);
    return null;
  }
}

// Валидация структуры appSettings
function validateAppSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  
  // Проверка обязательных полей
  if (!settings.currentTemplateId || typeof settings.currentTemplateId !== 'string') return false;
  if (!settings.templates || typeof settings.templates !== 'object') return false;
  
  // Проверка существования текущего шаблона
  if (!settings.templates[settings.currentTemplateId]) return false;
  
  // Валидация каждого шаблона
  for (const templateId in settings.templates) {
    if (!validateTemplate(settings.templates[templateId])) {
      return false;
    }
  }
  
  return true;
}

// Валидация структуры шаблона
function validateTemplate(template) {
  if (!template || typeof template !== 'object') return false;
  
  // Обязательные поля
  if (!template.id || typeof template.id !== 'string') return false;
  if (!template.name || typeof template.name !== 'string') return false;
  
  // Опциональные поля с значениями по умолчанию
  if (!template.ruleBlocks || !Array.isArray(template.ruleBlocks)) {
    template.ruleBlocks = [];
  }
  
  if (!template.functionalBorderData || typeof template.functionalBorderData !== 'object') {
    template.functionalBorderData = {
      sales: 30000,
      dayShift: false,
      nightShift: false,
      dayHours: 0,
      nightHours: 0
    };
  }
  
  if (!template.calendarData || typeof template.calendarData !== 'object') {
    template.calendarData = {};
  }
  
  return true;
}

// Функция безопасного сохранения в localStorage
function saveToStorage(key, data) {
  try {
    // Валидация данных перед сохранением
    if (key === 'appSettings' && !validateAppSettings(data)) {
      console.error('Invalid app settings structure');
      showNotification('Ошибка сохранения: неверная структура данных');
      return false;
    }
    
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
    
    // Проверка доступности localStorage
    if (error.name === 'QuotaExceededError') {
      showNotification('Ошибка: недостаточно места для сохранения данных');
    } else if (error.name === 'SecurityError') {
      showNotification('Ошибка доступа к хранилищу данных');
    } else {
      showNotification('Ошибка сохранения данных');
    }
    
    return false;
  }
}

// Получение текущего шаблона
function getCurrentTemplate() {
  const template = appSettings.templates[appSettings.currentTemplateId];
  
  // Если шаблон не найден, используем шаблон по умолчанию
  if (!template) {
    console.warn('Current template not found, using default');
    appSettings.currentTemplateId = 'default';
    
    // Создаем шаблон по умолчанию если его нет
    if (!appSettings.templates.default) {
      appSettings.templates.default = {
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
      };
    }
    
    saveToStorage('appSettings', appSettings);
    return appSettings.templates.default;
  }
  
  return template;
}

// Получение данных календаря для текущего шаблона
function getCurrentCalendarData() {
  const template = getCurrentTemplate();
  
  // Гарантируем существование calendarData
  if (!template.calendarData || typeof template.calendarData !== 'object') {
    template.calendarData = {};
    saveToStorage('appSettings', appSettings);
  }
  
  return template.calendarData;
}

// Миграция существующих данных в новую структуру
function migrateToTemplateStructure() {
  try {
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
  } catch (error) {
    console.error('Ошибка миграции данных:', error);
    return false;
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  try {
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
    
    // Проверка целостности данных после загрузки
    validateDataIntegrity();
    
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    showNotification('Критическая ошибка при запуске приложения');
  }
});

// Проверка целостности данных
function validateDataIntegrity() {
  try {
    const template = getCurrentTemplate();
    
    // Проверка calendarData
    if (template.calendarData) {
      for (const dateKey in template.calendarData) {
        const dayData = template.calendarData[dateKey];
        
        // Валидация формата даты
        if (!isValidDateKey(dateKey)) {
          console.warn('Invalid date key found:', dateKey);
          delete template.calendarData[dateKey];
          continue;
        }
        
        // Валидация структуры данных дня
        if (!validateDayData(dayData)) {
          console.warn('Invalid day data structure for:', dateKey);
          template.calendarData[dateKey] = normalizeDayData(dayData);
        }
      }
    }
    
    // Проверка ruleBlocks
    if (template.ruleBlocks && Array.isArray(template.ruleBlocks)) {
      template.ruleBlocks = template.ruleBlocks.filter(block => 
        block && typeof block === 'object' && block.id && block.type
      );
    }
    
    saveToStorage('appSettings', appSettings);
    return true;
  } catch (error) {
    console.error('Ошибка проверки целостности данных:', error);
    return false;
  }
}

// Валидация ключа даты
function isValidDateKey(dateKey) {
  const regex = /^\d{4}-\d{1,2}-\d{1,2}$/;
  if (!regex.test(dateKey)) return false;
  
  const parts = dateKey.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  return true;
}

// Валидация структуры данных дня
function validateDayData(dayData) {
  if (!dayData || typeof dayData !== 'object') return false;
  
  // Разрешенные поля
  const allowedFields = [
    'comment', 'color', 'sales', 'dayShift', 'nightShift', 
    'dayHours', 'nightHours', 'functionalBorder', 'functionalBorderData',
    'customSalesPercent', 'customShiftRate', 'customHourlyRate',
    'bonus', 'fixedDeduction'
  ];
  
  for (const field in dayData) {
    if (!allowedFields.includes(field)) {
      return false;
    }
  }
  
  return true;
}

// Нормализация данных дня
function normalizeDayData(dayData) {
  const normalized = {};
  const allowedFields = [
    'comment', 'color', 'sales', 'dayShift', 'nightShift', 
    'dayHours', 'nightHours', 'functionalBorder', 'functionalBorderData',
    'customSalesPercent', 'customShiftRate', 'customHourlyRate',
    'bonus', 'fixedDeduction'
  ];
  
  for (const field of allowedFields) {
    if (dayData.hasOwnProperty(field)) {
      normalized[field] = dayData[field];
    }
  }
  
  return normalized;
}

// Показ уведомлений
function showNotification(message) {
  try {
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
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  } catch (error) {
    console.error('Ошибка показа уведомления:', error);
  }
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
  showNotification('Произошла непредвиденная ошибка');
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
  try {
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
  } catch (error) {
    console.error('Ошибка показа модального окна:', error);
  }
}

// Закрытие модального окна с управлением стеком
function closeModal() {
  try {
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
  } catch (error) {
    console.error('Ошибка закрытия модального окна:', error);
  }
}

// Закрытие всех модальных окон и очистка стека
function closeAllModals() {
  try {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
    modalStack = [];
    document.body.classList.remove('modal-open');
  } catch (error) {
    console.error('Ошибка закрытия всех модальных окон:', error);
  }
}

// Получение текущего открытого модального окна
function getCurrentModal() {
  try {
    const modals = document.querySelectorAll('.modal');
    for (let modal of modals) {
      if (modal.style.display === 'block') {
        return modal;
      }
    }
    return null;
  } catch (error) {
    console.error('Ошибка получения текущего модального окна:', error);
    return null;
  }
}

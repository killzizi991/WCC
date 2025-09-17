// Основные переменные
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let selectedDay = null;
let massColoringMode = null;
let isKeyboardOpen = false;
let lastWindowHeight = window.innerHeight;
let originalHasFunctionalBorder = false;
let originalSalesValue = 0;

// Хранение данных
let calendarData = loadFromStorage('calendarData') || {};

// Настройки приложения
let appSettings = loadFromStorage('appSettings') || {
  mode: 'official',
  official: {
    salesPercent: 7,
    shiftRate: 1000,
    fixedDeduction: 25000,
    advance: 10875,
    fixedSalaryPart: 10875,
    functionalBorderValue: 30000
  },
  unofficial: {
    salesPercent: 7,
    shiftRate: 1000,
    advance: 0,
    functionalBorderValue: 30000
  }
};

// Миграция старых настроек
if (appSettings.hasOwnProperty('useTax') && !appSettings.hasOwnProperty('mode')) {
  appSettings = {
    mode: 'official',
    official: {
      salesPercent: appSettings.salesPercent,
      shiftRate: appSettings.shiftRate,
      fixedDeduction: appSettings.fixedDeduction,
      advance: appSettings.advance,
      fixedSalaryPart: appSettings.fixedSalaryPart,
      functionalBorderValue: 30000
    },
    unofficial: {
      salesPercent: 7,
      shiftRate: 1000,
      advance: 0,
      functionalBorderValue: 30000
    }
  };
  saveToStorage('appSettings', appSettings);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Миграция данных: добавление functionalBorderValue если отсутствует
        let needSave = false;
        for (const dateKey in calendarData) {
            const dayData = calendarData[dateKey];
            if (dayData.functionalBorder && dayData.functionalBorderValue === undefined) {
                dayData.functionalBorderValue = dayData.sales;
                needSave = true;
            }
        }
        if (needSave) {
            saveToStorage('calendarData', calendarData);
        }

        generateCalendar();
        setupEventListeners();
        initPeriodSelector();
        loadSettingsToForm();
        
        // Проверка первого запуска
        if (!localStorage.getItem('firstRun')) {
            localStorage.setItem('firstRun', 'true');
            showWelcomeMessage();
        }
        
        // Отслеживание изменения размера для определения клавиатуры
        window.addEventListener('resize', function() {
            const newHeight = window.innerHeight;
            const heightDifference = Math.abs(lastWindowHeight - newHeight);
            
            // Если изменение высоты значительное, считаем что клавиатура открыта/закрыта
            if (heightDifference > 200) {
                isKeyboardOpen = (newHeight < lastWindowHeight);
                lastWindowHeight = newHeight;
            }
        });

        // Скрываем индикатор загрузки после успешной инициализации
        document.getElementById('app-loading').style.display = 'none';
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        document.getElementById('app-loading').style.display = 'none';
        if (typeof showNotification === 'function') {
            showNotification('Ошибка загрузки: ' + error.message);
        } else {
            alert('Ошибка загрузки: ' + error.message);
        }
    }
});

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

// Новая структура настроек
let appSettings = loadFromStorage('appSettings') || {
  currentTemplateId: 1,
  calculationTemplates: [
    {
      id: 1,
      name: "Процент + ставка",
      blocks: [
        {
          type: "percentage",
          settings: {
            percent: 7,
            range_min: 0,
            range_max: null
          }
        },
        {
          type: "shift_rate",
          settings: {
            rate: 1000
          }
        },
        {
          type: "advance",
          settings: {
            type: "fixed",
            value: 0,
            source: "total_earned"
          }
        }
      ],
      functionalBorderValues: {
        sales: 30000,
        hours: 0,
        shifts: 0
      }
    }
  ]
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    try {
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

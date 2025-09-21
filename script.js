// Основные переменные
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let selectedDay = null;
let massColoringMode = null;
let isKeyboardOpen = false; // Флаг для отслеживания состояния клавиатуры
let lastWindowHeight = window.innerHeight; // Запоминаем начальную высоту окна
let originalHasFunctionalBorder = false;
let originalSalesValue = 0;

// Хранение данных
let calendarData = loadFromStorage('calendarData') || {};

// Новая структура настроек приложения
let appSettings = loadFromStorage('appSettings') || {
  currentTemplateId: 'default',
  templates: {
    'default': {
      id: 'default',
      name: 'Основной',
      salesPercent: 7,
      shiftRate: 1000,
      advance: 10875,
      fixedSalaryPart: 10875,
      functionalBorderValue: 30000,
      ruleBlocks: [] // Новое поле для хранения блоков правил
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
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
});

// Генерация календаря
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Заголовки дней недели
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // Первый день месяца
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Последний день месяца
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Пустые ячейки для дней предыдущего месяца
    const startOffset = (firstDay.getDay() || 7) - 1;
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        calendar.appendChild(empty);
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        // Форматирование чисел для отображения
        const formatSalesNumber = (value) => {
            if (value >= 10000) return Math.floor(value / 1000);
            return value;
        };
        
        // Форматирование содержимого
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${dayData.sales ? `<div class="day-sales">${formatSalesNumber(dayData.sales)}</div>` : ''}
        `;
        
        // Цвет фона - белый цвет удаляет заливку
        if (dayData.color) {
            if (dayData.color === '#ffffff') {
                dayElement.style.backgroundColor = '';
            } else {
                dayElement.style.backgroundColor = dayData.color;
            }
        }
        
        // Функциональная обводка
        if (dayData.functionalBorder) {
            dayElement.classList.add('functional-border');
        }
        
        // Иконка комментария
        if (dayData.comment) {
            const commentIcon = document.createElement('div');
            commentIcon.className = 'day-comment';
            commentIcon.textContent = '💬';
            commentIcon.style.position = 'absolute';
            commentIcon.style.top = '5px';
            commentIcon.style.right = '5px';
            commentIcon.style.fontSize = '0.8em';
            dayElement.appendChild(commentIcon);
        }
        
        // Проверка на текущий день
        const today = new Date();
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Обработчик клика
        dayElement.addEventListener('click', () => handleDayClick(day));
        calendar.appendChild(dayElement);
    }
    
    // Обновление заголовка
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('current-month-year').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
    
    // Расчеты
    calculateSummary();
}

// Обработчик клика по дню
function handleDayClick(day) {
    if (massColoringMode === 'fill') {
        applyFillColor(day);
    } else if (massColoringMode === 'border') {
        toggleFunctionalBorder(day);
    } else {
        openModal(day);
    }
}

// Установка/снятие функциональной обводки
function toggleFunctionalBorder(day) {
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    let dayData = calendarData[dateKey] || {};
    
    if (dayData.functionalBorder) {
        // Снятие обводки
        dayData.functionalBorder = false;
        dayData.functionalBorderValue = undefined;
        dayData.sales = 0;
        showNotification('Обводка снята');
    } else {
        // Установка обводки
        dayData.functionalBorder = true;
        dayData.sales = getCurrentTemplate().functionalBorderValue;
        dayData.functionalBorderValue = getCurrentTemplate().functionalBorderValue;
        showNotification(`Обводка установлена, продажи: ${getCurrentTemplate().functionalBorderValue} руб`);
    }
    
    calendarData[dateKey] = dayData;
    saveToStorage('calendarData', calendarData);
    generateCalendar();
}

// Применение заливки
function applyFillColor(day) {
    const color = document.querySelector('.palette-tool.fill.active')?.dataset.color || '#ffffff';
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    let dayData = calendarData[dateKey] || {};
    
    dayData.color = color;
    calendarData[dateKey] = dayData;
    saveToStorage('calendarData', calendarData);
    generateCalendar();
}

// Открытие модального окна
function openModal(day) {
    selectedDay = day;
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const dayData = calendarData[dateKey] || {};
    
    // Сохраняем исходное состояние обводки и значения продаж
    originalHasFunctionalBorder = dayData.functionalBorder || false;
    originalSalesValue = dayData.functionalBorderValue || (originalHasFunctionalBorder ? dayData.sales : 0);
    
    document.getElementById('modal-day').textContent = day;
    document.getElementById('sales-input').value = dayData.sales || '';
    document.getElementById('comment-input').value = dayData.comment || '';
    
    // Выбор цвета
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === dayData.color) {
            option.classList.add('selected');
        }
    });
    
    // Заполнение настроек дня
    document.getElementById('day-sales-percent').value = dayData.customSalesPercent || '';
    document.getElementById('day-shift-rate').value = dayData.customShiftRate || '';
    
    // Сброс видимости настроек дня
    document.getElementById('day-settings').style.display = 'none';
    
    document.getElementById('modal').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Сохранение данных дня
function saveDayData() {
    const sales = parseInt(document.getElementById('sales-input').value) || 0;
    const comment = document.getElementById('comment-input').value;
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color;
    const customSalesPercent = document.getElementById('day-sales-percent').value ? 
        parseFloat(document.getElementById('day-sales-percent').value) : null;
    const customShiftRate = document.getElementById('day-shift-rate').value ? 
        parseInt(document.getElementById('day-shift-rate').value) : null;
    
    const dateKey = `${currentYear}-${currentMonth+1}-${selectedDay}`;
    
    // Определяем, нужно ли сохранять функциональную обводку
    const shouldKeepFunctionalBorder = originalHasFunctionalBorder && sales === originalSalesValue;
    
    calendarData[dateKey] = {
        sales: sales,
        comment: comment,
        color: selectedColor,
        customSalesPercent: customSalesPercent,
        customShiftRate: customShiftRate,
        functionalBorder: shouldKeepFunctionalBorder,
        functionalBorderValue: shouldKeepFunctionalBorder ? originalSalesValue : undefined
    };
    
    saveToStorage('calendarData', calendarData);
    closeModal();
    generateCalendar();
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('summary-modal').style.display = 'none';
    document.getElementById('period-modal').style.display = 'none';
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('templates-modal').style.display = 'none';
    document.getElementById('export-modal').style.display = 'none';
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('help-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Расчеты
function calculateSummary() {
    const monthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let totalEarnedWithoutTax = 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales > 0) {
            workDays++;
            totalSales += dayData.sales;
            
            // Используем индивидуальные настройки дня или общие
            const dayPercent = dayData.customSalesPercent || getCurrentTemplate().salesPercent;
            const dayShiftRate = dayData.customShiftRate || getCurrentTemplate().shiftRate;
            
            totalEarnedWithoutTax += calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
        }
    }
    
    const tax = 25000 * 0.13; // Фиксированный вычет
    const totalEarned = totalEarnedWithoutTax - tax;
    const salary = totalEarned - getCurrentTemplate().advance;
    const balance = salary - getCurrentTemplate().fixedSalaryPart;
    
    document.getElementById('modal-work-days').textContent = workDays;
    document.getElementById('modal-total-sales').textContent = totalSales.toLocaleString();
    document.getElementById('modal-total-earned').textContent = totalEarned.toLocaleString();
    document.getElementById('modal-salary').textContent = salary.toLocaleString();
    document.getElementById('modal-balance').textContent = balance.toLocaleString();
    document.getElementById('summary-month-year').textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
}

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация по месяцам
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
    });
    
    // Выбор месяца/года
    document.getElementById('month-year-selector').addEventListener('click', () => {
        document.getElementById('period-modal').style.display = 'block';
        document.body.classList.add('modal-open');
    });
    
    // Палитра
    document.getElementById('palette-btn').addEventListener('click', () => {
        const palettePanel = document.getElementById('palette-panel');
        const isOpen = palettePanel.style.display === 'flex';
        
        if (isOpen) {
            palettePanel.style.display = 'none';
            document.getElementById('palette-btn').classList.remove('active');
            massColoringMode = null;
            document.querySelectorAll('.palette-tool').forEach(tool => {
                tool.classList.remove('active');
            });
        } else {
            palettePanel.style.display = 'flex';
            document.getElementById('palette-btn').classList.add('active');
        }
    });
    
    // Инструменты палитры
    document.querySelectorAll('.palette-tool.fill').forEach(tool => {
        tool.addEventListener('click', () => {
            document.querySelectorAll('.palette-tool.fill').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            massColoringMode = 'fill';
        });
    });
    
    document.getElementById('palette-border').addEventListener('click', () => {
        massColoringMode = massColoringMode === 'border' ? null : 'border';
        document.getElementById('palette-border').classList.toggle('active');
    });
    
    // Модальные окна
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Сохранение данных
    document.getElementById('save-data').addEventListener('click', saveDayData);
    
    // Расчеты
    document.getElementById('summary-btn').addEventListener('click', () => {
        document.getElementById('summary-modal').style.display = 'block';
        document.body.classList.add('modal-open');
    });
    
    // Настройки
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-modal').style.display = 'block';
        document.body.classList.add('modal-open');
        loadSettingsToForm();
    });
    
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Шаблоны
    document.getElementById('templates-btn').addEventListener('click', showTemplatesModal);
    
    // Экспорт/импорт
    document.getElementById('export-btn').addEventListener('click', showExportModal);
    document.getElementById('import-btn').addEventListener('click', showImportModal);
    
    document.getElementById('import-file').addEventListener('change', importData);
    
    // Выбор цвета в модальном окне
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    // Настройки дня
    document.getElementById('day-settings-btn').addEventListener('click', function() {
        const settingsPanel = document.getElementById('day-settings');
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('reset-day-settings').addEventListener('click', function() {
        document.getElementById('day-sales-percent').value = '';
        document.getElementById('day-shift-rate').value = '';
    });
    
    // Кнопка обновления версии
    document.getElementById('update-btn').addEventListener('click', forceUpdate);
    
    // Кнопка помощи
    document.getElementById('help-btn').addEventListener('click', showHelpModal);
    
    // Обработка клавиш
    document.addEventListener('keydown', handleKeyPress);
    
    // Новые обработчики для экспорта/импорта
    document.getElementById('copy-data-btn').addEventListener('click', copyDataToClipboard);
    document.getElementById('save-file-btn').addEventListener('click', exportData);
    document.getElementById('import-file-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-text-btn').addEventListener('click', importFromText);
}

// Показать модальное окно шаблонов
function showTemplatesModal() {
    const modal = document.getElementById('templates-modal');
    const currentTemplate = getCurrentTemplate();
    
    // Заполняем название текущего шаблона
    document.getElementById('current-template-name').textContent = currentTemplate.name;
    
    // Показываем модальное окно
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Обработчики для модального окна шаблонов
    setupTemplatesModalListeners();
}

// Настройка обработчиков для модального окна шаблонов
function setupTemplatesModalListeners() {
    // Обработчик для закрытия модального окна
    document.querySelector('#templates-modal .close').addEventListener('click', closeModal);
    
    // Обработчик для клика вне модального окна
    document.getElementById('templates-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Обработчик для редактирования названия шаблона
    document.getElementById('edit-template-name').addEventListener('click', editTemplateName);
    
    // Обработчик для показа выпадающего списка шаблонов
    document.getElementById('current-template-name').addEventListener('click', showTemplatesDropdown);
    
    // Обработчик для кнопки "Добавить блок правил"
    document.getElementById('add-rule-block').addEventListener('click', addRuleBlock);
    
    // Обработчики для кнопок сохранения и отмены
    document.getElementById('save-template-changes').addEventListener('click', saveTemplateChanges);
    document.getElementById('cancel-template-changes').addEventListener('click', closeModal);
}

// Редактирование названия шаблона
function editTemplateName() {
    const currentTemplate = getCurrentTemplate();
    const newName = prompt('Введите новое название шаблона:', currentTemplate.name);
    
    if (newName && newName.trim() !== '') {
        currentTemplate.name = newName.trim();
        document.getElementById('current-template-name').textContent = currentTemplate.name;
        saveToStorage('appSettings', appSettings);
        showNotification('Название шаблона изменено');
    }
}

// Показать выпадающий список шаблонов
function showTemplatesDropdown() {
    const dropdown = document.getElementById('template-dropdown');
    dropdown.innerHTML = '';
    
    // Добавляем существующие шаблоны
    Object.values(appSettings.templates).forEach(template => {
        const option = document.createElement('div');
        option.style.padding = '10px';
        option.style.cursor = 'pointer';
        option.textContent = template.name;
        option.addEventListener('click', () => switchTemplate(template.id));
        dropdown.appendChild(option);
    });
    
    // Добавляем опцию "Новый шаблон"
    const newTemplateOption = document.createElement('div');
    newTemplateOption.style.padding = '10px';
    newTemplateOption.style.cursor = 'pointer';
    newTemplateOption.style.fontWeight = 'bold';
    newTemplateOption.textContent = 'Новый шаблон';
    newTemplateOption.addEventListener('click', createNewTemplate);
    dropdown.appendChild(newTemplateOption);
    
    // Позиционируем и показываем dropdown
    const templateNameElement = document.getElementById('current-template-name');
    const rect = templateNameElement.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.display = 'block';
    
    // Обработчик для скрытия dropdown при клике вне его
    const clickHandler = function(e) {
        if (!dropdown.contains(e.target) && e.target !== templateNameElement) {
            dropdown.style.display = 'none';
            document.removeEventListener('click', clickHandler);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', clickHandler);
    }, 0);
}

// Переключение шаблона
function switchTemplate(templateId) {
    if (appSettings.currentTemplateId === templateId) return;
    
    if (confirm('При переключении шаблона все несохраненные данные будут потеряны. Продолжить?')) {
        appSettings.currentTemplateId = templateId;
        saveToStorage('appSettings', appSettings);
        loadSettingsToForm();
        generateCalendar();
        
        const template = getCurrentTemplate();
        document.getElementById('current-template-name').textContent = template.name;
        
        showNotification('Шаблон изменен: ' + template.name);
    }
}

// Создание нового шаблона
function createNewTemplate() {
    const newTemplateName = prompt('Введите название нового шаблона:');
    if (!newTemplateName || newTemplateName.trim() === '') return;
    
    const newTemplateId = 'template_' + Date.now();
    const currentTemplate = getCurrentTemplate();
    
    // Создаем новый шаблон на основе текущего
    appSettings.templates[newTemplateId] = {
        id: newTemplateId,
        name: newTemplateName.trim(),
        salesPercent: currentTemplate.salesPercent,
        shiftRate: currentTemplate.shiftRate,
        advance: currentTemplate.advance,
        fixedSalaryPart: currentTemplate.fixedSalaryPart,
        functionalBorderValue: currentTemplate.functionalBorderValue,
        ruleBlocks: []
    };
    
    // Переключаемся на новый шаблон
    appSettings.currentTemplateId = newTemplateId;
    saveToStorage('appSettings', appSettings);
    loadSettingsToForm();
    
    document.getElementById('current-template-name').textContent = newTemplateName.trim();
    document.getElementById('template-dropdown').style.display = 'none';
    
    showNotification('Создан новый шаблон: ' + newTemplateName.trim());
}

// Добавление блока правил
function addRuleBlock() {
    showNotification('Функция добавления блоков правил будет реализована на следующем этапе');
}

// Сохранение изменений шаблона
function saveTemplateChanges() {
    saveToStorage('appSettings', appSettings);
    closeModal();
    showNotification('Изменения шаблона сохранены');
}

// Показать модальное окно помощи
function showHelpModal() {
    const helpContent = document.getElementById('help-content');
    helpContent.innerHTML = '';
    
    HELP_DATA.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'help-item';
        questionDiv.style.marginBottom = '10px';
        questionDiv.style.borderBottom = '1px solid #e2e8f0';
        questionDiv.style.paddingBottom = '10px';
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'help-question';
        questionHeader.textContent = item.question;
        questionHeader.style.fontWeight = '600';
        questionHeader.style.cursor = 'pointer';
        questionHeader.style.padding = '8px';
        questionHeader.style.backgroundColor = '#f8fafc';
        questionHeader.style.borderRadius = '5px';
        questionHeader.addEventListener('click', () => {
            const answer = questionDiv.querySelector('.help-answer');
            const isVisible = answer.style.display === 'block';
            
            // Скрываем все ответы
            document.querySelectorAll('.help-answer').forEach(ans => {
                ans.style.display = 'none';
            });
            
            // Показываем/скрываем текущий ответ
            answer.style.display = isVisible ? 'none' : 'block';
        });
        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'help-answer';
        answerDiv.innerHTML = item.answer;
        answerDiv.style.display = 'none';
        answerDiv.style.padding = '12px';
        answerDiv.style.backgroundColor = '#ffffff';
        answerDiv.style.borderRadius = '5px';
        answerDiv.style.marginTop = '8px';
        answerDiv.style.border = '1px solid #e2e8f0';
        
        questionDiv.appendChild(questionHeader);
        questionDiv.appendChild(answerDiv);
        helpContent.appendChild(questionDiv);
    });
    
    document.getElementById('help-modal').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Показать модальное окно экспорта
function showExportModal() {
    // Проверяем, iOS ли это
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    document.getElementById('ios-export-text').style.display = isIOS ? 'block' : 'none';
    document.getElementById('export-modal').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Показать модальное окно импорта
function showImportModal() {
    document.getElementById('import-text-input').value = '';
    document.getElementById('import-modal').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Копирование данных в буфер обмена
function copyDataToClipboard() {
    const data = {
        calendarData: calendarData,
        appSettings: appSettings,
        exportDate: new Date().toISOString(),
        version: '1.1'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            showNotification('Данные скопированы в буфер обмена');
            closeModal();
        })
        .catch(err => {
            console.error('Ошибка копирования: ', err);
            showNotification('Не удалось скопировать данные');
        });
}

// Импорт данных из текстового поля
function importFromText() {
    const jsonString = document.getElementById('import-text-input').value;
    
    if (!jsonString) {
        showNotification('Введите данные для импорта');
        return;
    }
    
    try {
        const data = JSON.parse(jsonString);
        
        if (data.calendarData) {
            calendarData = data.calendarData;
            saveToStorage('calendarData', calendarData);
        }
        
        if (data.appSettings) {
            appSettings = data.appSettings;
            saveToStorage('appSettings', appSettings);
            loadSettingsToForm();
        }
        
        generateCalendar();
        showNotification('Данные импортированы');
        closeModal();
    } catch (error) {
        console.error('Ошибка импорта:', error);
        showNotification('Ошибка импорта данных: неверный формат');
    }
}

// Принудительное обновление версии
async function forceUpdate() {
    showNotification('Обновление...');
    
    // Удаляем все кэши
    const cacheKeys = await caches.keys();
    for (const key of cacheKeys) {
        await caches.delete(key);
    }
    
    // Удаляем сервис-воркер
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
        await registration.unregister();
    }
    
    // Удаляем версию из localStorage
    localStorage.removeItem('sw_version');
    
    // Перезагружаем страницу
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}

// Обработка нажатий клавиш
function handleKeyPress(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// Инициализация выбора периода
function initPeriodSelector() {
    const currentYear = new Date().getFullYear();
    const yearOptions = document.getElementById('year-options');
    
    // Годы от 2020 до текущего + 5 лет вперед
    for (let year = 2020; year <= currentYear + 5; year++) {
        const option = document.createElement('div');
        option.className = 'period-option';
        option.textContent = year;
        option.dataset.year = year;
        option.addEventListener('click', () => selectYear(year));
        yearOptions.appendChild(option);
    }
    
    // Месяцы
    const monthOptions = document.getElementById('month-options');
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    
    monthNames.forEach((month, index) => {
        const option = document.createElement('div');
        option.className = 'period-option';
        option.textContent = month;
        option.dataset.month = index;
        option.addEventListener('click', () => selectMonth(index));
        monthOptions.appendChild(option);
    });
    
    // Кнопка назад
    document.getElementById('period-back').addEventListener('click', () => {
        document.getElementById('month-step').style.display = 'none';
        document.getElementById('year-step').style.display = 'block';
        document.getElementById('period-back').style.display = 'none';
    });
}

// Выбор года
function selectYear(year) {
    currentYear = year;
    document.getElementById('year-step').style.display = 'none';
    document.getElementById('month-step').style.display = 'block';
    document.getElementById('period-back').style.display = 'block';
}

// Выбор месяца
function selectMonth(month) {
    currentMonth = month;
    closeModal();
    generateCalendar();
}

// Загрузка настроек в форму
function loadSettingsToForm() {
    const template = getCurrentTemplate();
    document.getElementById('sales-percent').value = template.salesPercent;
    document.getElementById('shift-rate').value = template.shiftRate;
    document.getElementById('advance').value = template.advance;
    document.getElementById('fixed-salary-part').value = template.fixedSalaryPart;
    document.getElementById('functional-border-value').value = template.functionalBorderValue;
}

// Сохранение настроек
function saveSettings() {
    const template = getCurrentTemplate();
    const oldFunctionalBorderValue = template.functionalBorderValue;
    
    template.salesPercent = parseFloat(document.getElementById('sales-percent').value);
    template.shiftRate = parseInt(document.getElementById('shift-rate').value);
    template.advance = parseInt(document.getElementById('advance').value);
    template.fixedSalaryPart = parseInt(document.getElementById('fixed-salary-part').value);
    template.functionalBorderValue = parseInt(document.getElementById('functional-border-value').value);
    
    // Обновляем установленные функциональные обводки, если значение изменилось
    if (oldFunctionalBorderValue !== template.functionalBorderValue) {
        updateFunctionalBorders(template.functionalBorderValue);
    }
    
    saveToStorage('appSettings', appSettings);
    closeModal();
    calculateSummary();
    showNotification('Настройки сохранены');
}

// Обновление значений функциональных обводок
function updateFunctionalBorders(newValue) {
    let updated = false;
    
    for (const dateKey in calendarData) {
        if (calendarData[dateKey].functionalBorder) {
            calendarData[dateKey].sales = newValue;
            calendarData[dateKey].functionalBorderValue = newValue;
            updated = true;
        }
    }
    
    if (updated) {
        saveToStorage('calendarData', calendarData);
        generateCalendar();
        showNotification('Значения обводок обновлены');
    }
}

// Экспорт данных
function exportData() {
    const data = {
        calendarData: calendarData,
        appSettings: appSettings,
        exportDate: new Date().toISOString(),
        version: '1.1'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Данные экспортированы');
    closeModal();
}

// Импорт данных
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.calendarData) {
                calendarData = data.calendarData;
                saveToStorage('calendarData', calendarData);
            }
            
            if (data.appSettings) {
                appSettings = data.appSettings;
                saveToStorage('appSettings', appSettings);
                loadSettingsToForm();
            }
            
            generateCalendar();
            showNotification('Данные импортированы');
        } catch (error) {
            console.error('Ошибка импорта:', error);
            showNotification('Ошибка импорта данных');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Сброс input
    closeModal();
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

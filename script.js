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
      ruleBlocks: [],
      calendarData: {}  // Добавляем поле для хранения данных календаря
    }
  }
};

// Функция получения данных календаря для текущего шаблона
function getCurrentCalendarData() {
  const template = getCurrentTemplate();
  if (!template.calendarData) {
    template.calendarData = {};
  }
  return template.calendarData;
}

// Функция установки данных календаря для текущего шаблона
function setCurrentCalendarData(data) {
  const template = getCurrentTemplate();
  template.calendarData = data;
}

// Миграция существующих данных в новую структуру
function migrateCalendarData() {
  // Загружаем старые данные календаря
  const oldCalendarData = loadFromStorage('calendarData');
  
  if (oldCalendarData && Object.keys(oldCalendarData).length > 0) {
    // Переносим данные в шаблон по умолчанию
    const defaultTemplate = appSettings.templates['default'];
    if (defaultTemplate) {
      defaultTemplate.calendarData = oldCalendarData;
    }
    
    // Удаляем старые данные
    localStorage.removeItem('calendarData');
    saveToStorage('appSettings', appSettings);
    console.log('Миграция данных календаря завершена');
  }
}

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
    // Выполняем миграцию данных при первой загрузке
    migrateCalendarData();
    
    // Загружаем данные календаря для текущего шаблона
    const currentCalendarData = getCurrentCalendarData();
    
    let needSave = false;
    for (const dateKey in currentCalendarData) {
        const dayData = currentCalendarData[dateKey];
        if (dayData.functionalBorder && dayData.functionalBorderValue === undefined) {
            dayData.functionalBorderValue = dayData.sales;
            needSave = true;
        }
    }
    if (needSave) {
        setCurrentCalendarData(currentCalendarData);
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

// Генерация календаря
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const startOffset = (firstDay.getDay() || 7) - 1;
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        calendar.appendChild(empty);
    }
    
    const currentCalendarData = getCurrentCalendarData();
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = currentCalendarData[dateKey] || {};
        
        const formatSalesNumber = (value) => {
            if (value >= 10000) return Math.floor(value / 1000);
            return value;
        };
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${dayData.sales ? `<div class="day-sales">${formatSalesNumber(dayData.sales)}</div>` : ''}
        `;
        
        if (dayData.color) {
            if (dayData.color === '#ffffff') {
                dayElement.style.backgroundColor = '';
            } else {
                dayElement.style.backgroundColor = dayData.color;
            }
        }
        
        if (dayData.functionalBorder) {
            dayElement.classList.add('functional-border');
        }
        
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
        
        const today = new Date();
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => handleDayClick(day));
        calendar.appendChild(dayElement);
    }
    
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('current-month-year').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
    
    calculateSummaryDisplay();
}

// Расчеты для отображения
function calculateSummaryDisplay() {
    const template = getCurrentTemplate();
    const currentCalendarData = getCurrentCalendarData();
    const summary = calculateSummary(currentCalendarData, currentYear, currentMonth, template);
    
    document.getElementById('modal-work-days').textContent = summary.workDays;
    document.getElementById('modal-total-sales').textContent = summary.totalSales.toLocaleString();
    document.getElementById('modal-total-earned').textContent = summary.totalEarned.toLocaleString();
    document.getElementById('modal-salary').textContent = summary.salary.toLocaleString();
    document.getElementById('modal-balance').textContent = summary.balance.toLocaleString();
    document.getElementById('summary-month-year').textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
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
    const currentCalendarData = getCurrentCalendarData();
    let dayData = currentCalendarData[dateKey] || {};
    const template = getCurrentTemplate();
    
    if (dayData.functionalBorder) {
        dayData.functionalBorder = false;
        dayData.functionalBorderValue = undefined;
        dayData.sales = 0;
        showNotification('Обводка снята');
    } else {
        dayData.functionalBorder = true;
        dayData.sales = template.functionalBorderValue;
        dayData.functionalBorderValue = template.functionalBorderValue;
        showNotification(`Обводка установлена, продажи: ${template.functionalBorderValue} руб`);
    }
    
    currentCalendarData[dateKey] = dayData;
    setCurrentCalendarData(currentCalendarData);
    saveToStorage('appSettings', appSettings);
    generateCalendar();
}

// Применение заливки
function applyFillColor(day) {
    const color = document.querySelector('.palette-tool.fill.active')?.dataset.color || '#ffffff';
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const currentCalendarData = getCurrentCalendarData();
    let dayData = currentCalendarData[dateKey] || {};
    
    dayData.color = color;
    currentCalendarData[dateKey] = dayData;
    setCurrentCalendarData(currentCalendarData);
    saveToStorage('appSettings', appSettings);
    generateCalendar();
}

// Открытие модального окна
function openModal(day) {
    selectedDay = day;
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const currentCalendarData = getCurrentCalendarData();
    const dayData = currentCalendarData[dateKey] || {};
    
    originalHasFunctionalBorder = dayData.functionalBorder || false;
    originalSalesValue = dayData.functionalBorderValue || (originalHasFunctionalBorder ? dayData.sales : 0);
    
    document.getElementById('modal-day').textContent = day;
    document.getElementById('sales-input').value = dayData.sales || '';
    document.getElementById('comment-input').value = dayData.comment || '';
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === dayData.color) {
            option.classList.add('selected');
        }
    });
    
    document.getElementById('day-sales-percent').value = dayData.customSalesPercent || '';
    document.getElementById('day-shift-rate').value = dayData.customShiftRate || '';
    
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
    const currentCalendarData = getCurrentCalendarData();
    
    const shouldKeepFunctionalBorder = originalHasFunctionalBorder && sales === originalSalesValue;
    
    currentCalendarData[dateKey] = {
        sales: sales,
        comment: comment,
        color: selectedColor,
        customSalesPercent: customSalesPercent,
        customShiftRate: customShiftRate,
        functionalBorder: shouldKeepFunctionalBorder,
        functionalBorderValue: shouldKeepFunctionalBorder ? originalSalesValue : undefined
    };
    
    setCurrentCalendarData(currentCalendarData);
    saveToStorage('appSettings', appSettings);
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

// Настройка обработчиков событий
function setupEventListeners() {
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
    
    document.getElementById('month-year-selector').addEventListener('click', () => {
        document.getElementById('period-modal').style.display = 'block';
        document.body.classList.add('modal-open');
    });
    
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
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    document.getElementById('save-data').addEventListener('click', saveDayData);
    
    document.getElementById('summary-btn').addEventListener('click', () => {
        document.getElementById('summary-modal').style.display = 'block';
        document.body.classList.add('modal-open');
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-modal').style.display = 'block';
        document.body.classList.add('modal-open');
        loadSettingsToForm();
    });
    
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    document.getElementById('templates-btn').addEventListener('click', showTemplatesModal);
    
    document.getElementById('export-btn').addEventListener('click', showExportModal);
    document.getElementById('import-btn').addEventListener('click', showImportModal);
    
    document.getElementById('import-file').addEventListener('change', importData);
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    document.getElementById('day-settings-btn').addEventListener('click', function() {
        const settingsPanel = document.getElementById('day-settings');
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('reset-day-settings').addEventListener('click', function() {
        document.getElementById('day-sales-percent').value = '';
        document.getElementById('day-shift-rate').value = '';
    });
    
    document.getElementById('update-btn').addEventListener('click', forceUpdate);
    
    document.getElementById('help-btn').addEventListener('click', showHelpModal);
    
    document.addEventListener('keydown', handleKeyPress);
    
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
    
    document.getElementById('current-template-name').textContent = currentTemplate.name;
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    setupTemplatesModalListeners();
    renderRuleBlocksList();
}

// Настройка обработчиков для модального окна шаблонов
function setupTemplatesModalListeners() {
    document.querySelector('#templates-modal .close').addEventListener('click', closeModal);
    
    document.getElementById('templates-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    document.getElementById('edit-template-name').addEventListener('click', editTemplateName);
    
    document.getElementById('current-template-name').addEventListener('click', showTemplatesDropdown);
    
    document.getElementById('add-rule-block').addEventListener('click', showAddRuleBlockDropdown);
    
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
    
    Object.values(appSettings.templates).forEach(template => {
        const option = document.createElement('div');
        option.style.padding = '10px';
        option.style.cursor = 'pointer';
        option.textContent = template.name;
        option.addEventListener('click', () => switchTemplate(template.id));
        dropdown.appendChild(option);
    });
    
    const newTemplateOption = document.createElement('div');
    newTemplateOption.style.padding = '10px';
    newTemplateOption.style.cursor = 'pointer';
    newTemplateOption.style.fontWeight = 'bold';
    newTemplateOption.textContent = 'Новый шаблон';
    newTemplateOption.addEventListener('click', createNewTemplate);
    dropdown.appendChild(newTemplateOption);
    
    dropdown.style.display = 'block';
    
    const clickHandler = function(e) {
        if (!dropdown.contains(e.target) && e.target !== document.getElementById('current-template-name')) {
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
    
    // Закрываем все модальные окна перед переключением
    closeModal();
    
    if (confirm('При переключении шаблона все несохраненные данные будут потеряны. Продолжить?')) {
        // Сохраняем текущие данные календаря в старый шаблон
        const oldTemplate = getCurrentTemplate();
        oldTemplate.calendarData = getCurrentCalendarData();
        
        // Переключаемся на новый шаблон
        appSettings.currentTemplateId = templateId;
        
        // Загружаем данные календаря из нового шаблона
        const newTemplate = getCurrentTemplate();
        if (!newTemplate.calendarData) {
            newTemplate.calendarData = {};
        }
        
        saveToStorage('appSettings', appSettings);
        loadSettingsToForm();
        generateCalendar();
        
        document.getElementById('current-template-name').textContent = newTemplate.name;
        
        showNotification('Шаблон изменен: ' + newTemplate.name);
    }
}

// Создание нового шаблона
function createNewTemplate() {
    const newTemplateName = prompt('Введите название нового шаблона:');
    if (!newTemplateName || newTemplateName.trim() === '') return;
    
    const newTemplateId = 'template_' + Date.now();
    const currentTemplate = getCurrentTemplate();
    
    appSettings.templates[newTemplateId] = {
        id: newTemplateId,
        name: newTemplateName.trim(),
        salesPercent: currentTemplate.salesPercent,
        shiftRate: currentTemplate.shiftRate,
        advance: currentTemplate.advance,
        fixedSalaryPart: currentTemplate.fixedSalaryPart,
        functionalBorderValue: currentTemplate.functionalBorderValue,
        ruleBlocks: [],
        calendarData: {}  // Новый шаблон начинается с пустых данных календаря
    };
    
    appSettings.currentTemplateId = newTemplateId;
    saveToStorage('appSettings', appSettings);
    loadSettingsToForm();
    
    document.getElementById('current-template-name').textContent = newTemplateName.trim();
    document.getElementById('template-dropdown').style.display = 'none';
    
    showNotification('Создан новый шаблон: ' + newTemplateName.trim());
}

// Показать выпадающий список для добавления блока правил
function showAddRuleBlockDropdown() {
    const blockTypes = [
        { type: 'salesPercent', name: 'Процент с продаж' },
        { type: 'shiftRate', name: 'Ставка за смену' },
        { type: 'hourlyRate', name: 'Ставка за час' },
        { type: 'advance', name: 'Аванс' },
        { type: 'tax', name: 'Налог' },
        { type: 'bonus', name: 'Бонус' },
        { type: 'overtime', name: 'Сверхурочные' },
        { type: 'fixedDeduction', name: 'Фиксированный вычет' }
    ];

    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.background = 'white';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '5px';
    dropdown.style.padding = '10px';
    dropdown.style.zIndex = '1000';
    dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    const addButtonRect = document.getElementById('add-rule-block').getBoundingClientRect();
    dropdown.style.top = (addButtonRect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (addButtonRect.left + window.scrollX) + 'px';
    dropdown.style.width = addButtonRect.width + 'px';

    blockTypes.forEach(blockType => {
        const option = document.createElement('div');
        option.style.padding = '8px';
        option.style.cursor = 'pointer';
        option.textContent = blockType.name;
        option.addEventListener('click', () => addRuleBlock(blockType.type));
        option.addEventListener('mouseover', () => {
            option.style.backgroundColor = '#f0f0f0';
        });
        option.addEventListener('mouseout', () => {
            option.style.backgroundColor = 'transparent';
        });
        dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);

    const closeDropdown = (e) => {
        if (!dropdown.contains(e.target) && e.target !== document.getElementById('add-rule-block')) {
            document.body.removeChild(dropdown);
            document.removeEventListener('click', closeDropdown);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 0);
}

// Добавление блока правил
function addRuleBlock(blockType) {
    const currentTemplate = getCurrentTemplate();
    
    if (hasConflict({ type: blockType }, currentTemplate.ruleBlocks)) {
        showNotification('Нельзя добавить конфликтующий блок правил');
        return;
    }
    
    const newBlock = createRuleBlock(blockType);
    currentTemplate.ruleBlocks.push(newBlock);
    
    saveToStorage('appSettings', appSettings);
    renderRuleBlocksList();
    showNotification('Блок правил добавлен: ' + getDefaultBlockName(blockType));
}

// Отображение списка блоков правил
function renderRuleBlocksList() {
    const listContainer = document.getElementById('rule-blocks-list');
    listContainer.innerHTML = '';
    
    const currentTemplate = getCurrentTemplate();
    
    currentTemplate.ruleBlocks.forEach((block, index) => {
        const blockElement = document.createElement('div');
        blockElement.style.display = 'flex';
        blockElement.style.alignItems = 'center';
        blockElement.style.marginBottom = '10px';
        blockElement.style.padding = '10px';
        blockElement.style.backgroundColor = '#f8f9fa';
        blockElement.style.borderRadius = '5px';
        
        const blockName = document.createElement('div');
        blockName.textContent = block.name;
        blockName.style.flex = '1';
        blockName.style.cursor = 'pointer';
        blockName.addEventListener('click', () => editRuleBlock(block, index));
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.style.background = 'none';
        deleteButton.style.border = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontSize = '1.2em';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRuleBlock(index);
        });
        
        blockElement.appendChild(blockName);
        blockElement.appendChild(deleteButton);
        listContainer.appendChild(blockElement);
    });
}

// Удаление блока правил
function deleteRuleBlock(index) {
    const currentTemplate = getCurrentTemplate();
    currentTemplate.ruleBlocks.splice(index, 1);
    
    saveToStorage('appSettings', appSettings);
    renderRuleBlocksList();
    showNotification('Блок правил удален');
}

// Редактирование блока правил
function editRuleBlock(block, index) {
    const modalId = block.type + '-modal';
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        showNotification('Редактирование этого типа блока еще не реализовано');
        return;
    }
    
    setupBlockModal(modal, block, index);
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// Настройка модального окна блока
function setupBlockModal(modal, block, index) {
    const closeButtons = modal.querySelectorAll('.close, .close-block-modal');
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    });
    
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    };
    
    const saveButton = modal.querySelector('button[id^="save-"]');
    if (saveButton) {
        saveButton.onclick = () => saveBlockChanges(modal, block, index);
    }
    
    // Заполнение полей в зависимости от типа блока
    switch (block.type) {
        case 'salesPercent':
            setupSalesPercentModal(modal, block);
            break;
        case 'shiftRate':
            setupShiftRateModal(modal, block);
            break;
        case 'hourlyRate':
            setupHourlyRateModal(modal, block);
            break;
        case 'advance':
            setupAdvanceModal(modal, block);
            break;
        case 'tax':
            setupTaxModal(modal, block);
            break;
        case 'bonus':
            setupBonusModal(modal, block);
            break;
        case 'overtime':
            setupOvertimeModal(modal, block);
            break;
        case 'fixedDeduction':
            setupFixedDeductionModal(modal, block);
            break;
    }
}

// Сохранение изменений блока
function saveBlockChanges(modal, block, index) {
    const currentTemplate = getCurrentTemplate();
    
    switch (block.type) {
        case 'salesPercent':
            if (!saveSalesPercentChanges(modal, block)) return;
            break;
        case 'shiftRate':
            if (!saveShiftRateChanges(modal, block)) return;
            break;
        case 'hourlyRate':
            if (!saveHourlyRateChanges(modal, block)) return;
            break;
        case 'advance':
            if (!saveAdvanceChanges(modal, block)) return;
            break;
        case 'tax':
            if (!saveTaxChanges(modal, block)) return;
            break;
        case 'bonus':
            if (!saveBonusChanges(modal, block)) return;
            break;
        case 'overtime':
            if (!saveOvertimeChanges(modal, block)) return;
            break;
        case 'fixedDeduction':
            if (!saveFixedDeductionChanges(modal, block)) return;
            break;
    }
    
    currentTemplate.ruleBlocks[index] = block;
    saveToStorage('appSettings', appSettings);
    
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    showNotification('Изменения блока сохранены');
}

// Настройка модального окна для процента с продаж
function setupSalesPercentModal(modal, block) {
    const rangesContainer = modal.querySelector('#sales-percent-ranges');
    rangesContainer.innerHTML = '';
    
    block.ranges.forEach((range, rangeIndex) => {
        const rangeElement = createRangeElement(range, rangeIndex, 'percent');
        rangesContainer.appendChild(rangeElement);
    });
    
    modal.querySelector('#add-sales-range').onclick = () => {
        const newRange = { from: 0, to: null, percent: 7 };
        block.ranges.push(newRange);
        const rangeElement = createRangeElement(newRange, block.ranges.length - 1, 'percent');
        rangesContainer.appendChild(rangeElement);
    };
}

// Создание элемента диапазона
function createRangeElement(range, index, type) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.style.alignItems = 'center';
    
    const fromInput = document.createElement('input');
    fromInput.type = 'number';
    fromInput.min = '0';
    fromInput.value = range.from;
    fromInput.placeholder = 'От';
    fromInput.style.flex = '1';
    fromInput.addEventListener('change', (e) => {
        range.from = parseInt(e.target.value) || 0;
    });
    
    const toInput = document.createElement('input');
    toInput.type = 'number';
    toInput.min = '0';
    toInput.value = range.to || '';
    toInput.placeholder = 'До (пусто = макс)';
    toInput.style.flex = '1';
    toInput.addEventListener('change', (e) => {
        range.to = e.target.value ? parseInt(e.target.value) : null;
    });
    
    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.min = '0';
    valueInput.step = type === 'percent' ? '0.1' : '1';
    valueInput.value = range[type];
    valueInput.placeholder = type === 'percent' ? '%' : 'Руб';
    valueInput.style.flex = '1';
    valueInput.addEventListener('change', (e) => {
        range[type] = parseFloat(e.target.value);
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.style.background = 'none';
    deleteButton.style.border = 'none';
    deleteButton.style.cursor = 'pointer';
    deleteButton.addEventListener('click', () => {
        div.remove();
        block.ranges.splice(index, 1);
    });
    
    div.appendChild(fromInput);
    div.appendChild(toInput);
    div.appendChild(valueInput);
    div.appendChild(deleteButton);
    
    return div;
}

// Сохранение изменений процента с продаж
function saveSalesPercentChanges(modal, block) {
    if (!validateRanges(block.ranges)) {
        showNotification('Диапазоны не должны пересекаться');
        return false;
    }
    return true;
}

// Настройка модального окна для ставки за смену
function setupShiftRateModal(modal, block) {
    setupShiftRateSection(modal, block, 'day', 'day-shift-ranges', 'add-day-shift-range');
    setupShiftRateSection(modal, block, 'night', 'night-shift-ranges', 'add-night-shift-range');
}

function setupShiftRateSection(modal, block, type, rangesId, addButtonId) {
    const rangesContainer = modal.querySelector('#' + rangesId);
    rangesContainer.innerHTML = '';
    
    block[type + 'Ranges'].forEach((range, rangeIndex) => {
        const rangeElement = createRangeElement(range, rangeIndex, 'rate');
        rangesContainer.appendChild(rangeElement);
    });
    
    modal.querySelector('#' + addButtonId).onclick = () => {
        const newRange = { from: 0, to: null, rate: 1000 };
        block[type + 'Ranges'].push(newRange);
        const rangeElement = createRangeElement(newRange, block[type + 'Ranges'].length - 1, 'rate');
        rangesContainer.appendChild(rangeElement);
    };
}

// Сохранение изменений ставки за смену
function saveShiftRateChanges(modal, block) {
    if (!validateRanges(block.dayRanges) || !validateRanges(block.nightRanges)) {
        showNotification('Диапазоны не должны пересекаться');
        return false;
    }
    return true;
}

// Настройка модального окна для ставки за час
function setupHourlyRateModal(modal, block) {
    setupShiftRateSection(modal, block, 'day', 'day-hourly-ranges', 'add-day-hourly-range');
    setupShiftRateSection(modal, block, 'night', 'night-hourly-ranges', 'add-night-hourly-range');
}

// Сохранение изменений ставки за час
function saveHourlyRateChanges(modal, block) {
    if (!validateRanges(block.dayRanges) || !validateRanges(block.nightRanges)) {
        showNotification('Диапазоны не должны пересекаться');
        return false;
    }
    return true;
}

// Настройка модального окна для аванса
function setupAdvanceModal(modal, block) {
    modal.querySelector('#advance-type').value = block.advanceType;
    modal.querySelector('#advance-fixed').value = block.value;
    modal.querySelector('#advance-percent').value = block.value || 0;
    
    toggleAdvanceType(block.advanceType);
    
    modal.querySelector('#advance-type').addEventListener('change', (e) => {
        toggleAdvanceType(e.target.value);
    });
}

function toggleAdvanceType(type) {
    document.getElementById('advance-fixed-container').style.display = type === 'fixed' ? 'block' : 'none';
    document.getElementById('advance-percent-container').style.display = type === 'percent' ? 'block' : 'none';
}

// Сохранение изменений аванса
function saveAdvanceChanges(modal, block) {
    block.advanceType = modal.querySelector('#advance-type').value;
    block.value = parseFloat(modal.querySelector(block.advanceType === 'fixed' ? '#advance-fixed' : '#advance-percent').value);
    return true;
}

// Настройка модального окна для налога
function setupTaxModal(modal, block) {
    modal.querySelector('#tax-source').value = block.taxSource;
    modal.querySelector('#tax-percent').value = block.taxPercent;
    modal.querySelector('#tax-fixed').value = block.fixedAmount || 0;
    
    toggleTaxSource(block.taxSource);
    
    modal.querySelector('#tax-source').addEventListener('change', (e) => {
        toggleTaxSource(e.target.value);
    });
}

function toggleTaxSource(source) {
    document.getElementById('tax-fixed-container').style.display = source === 'fixed' ? 'block' : 'none';
}

// Сохранение изменений налога
function saveTaxChanges(modal, block) {
    block.taxSource = modal.querySelector('#tax-source').value;
    block.taxPercent = parseFloat(modal.querySelector('#tax-percent').value);
    if (block.taxSource === 'fixed') {
        block.fixedAmount = parseFloat(modal.querySelector('#tax-fixed').value);
    }
    return true;
}

// Настройка модального окна для бонуса
function setupBonusModal(modal, block) {
    modal.querySelector('#bonus-amount').value = block.amount;
}

// Сохранение изменений бонуса
function saveBonusChanges(modal, block) {
    block.amount = parseFloat(modal.querySelector('#bonus-amount').value);
    return true;
}

// Настройка модального окна для сверхурочных
function setupOvertimeModal(modal, block) {
    modal.querySelector('#overtime-type').value = block.overtimeType;
    modal.querySelector('#overtime-limit').value = block.limit;
    modal.querySelector('#overtime-multiplier').value = block.multiplier;
}

// Сохранение изменений сверхурочных
function saveOvertimeChanges(modal, block) {
    block.overtimeType = modal.querySelector('#overtime-type').value;
    block.limit = parseFloat(modal.querySelector('#overtime-limit').value);
    block.multiplier = parseFloat(modal.querySelector('#overtime-multiplier').value);
    return true;
}

// Настройка модального окна для фиксированного вычета
function setupFixedDeductionModal(modal, block) {
    modal.querySelector('#deduction-amount').value = block.amount;
}

// Сохранение изменений фиксированного вычета
function saveFixedDeductionChanges(modal, block) {
    block.amount = parseFloat(modal.querySelector('#deduction-amount').value);
    return true;
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
            
            document.querySelectorAll('.help-answer').forEach(ans => {
                ans.style.display = 'none';
            });
            
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
        appSettings: appSettings,  // Теперь экспортируем только appSettings
        exportDate: new Date().toISOString(),
        version: '1.2'  // Обновляем версию для новой структуры
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
        
        // Поддержка старого формата (миграция)
        if (data.calendarData && data.appSettings) {
            // Старый формат: переносим calendarData в шаблон по умолчанию
            if (data.appSettings.templates && data.appSettings.templates.default) {
                data.appSettings.templates.default.calendarData = data.calendarData;
            }
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
    
    const cacheKeys = await caches.keys();
    for (const key of cacheKeys) {
        await caches.delete(key);
    }
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
        await registration.unregister();
    }
    
    localStorage.removeItem('sw_version');
    
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
    
    for (let year = 2020; year <= currentYear + 5; year++) {
        const option = document.createElement('div');
        option.className = 'period-option';
        option.textContent = year;
        option.dataset.year = year;
        option.addEventListener('click', () => selectYear(year));
        yearOptions.appendChild(option);
    }
    
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
    
    if (oldFunctionalBorderValue !== template.functionalBorderValue) {
        const currentCalendarData = getCurrentCalendarData();
        const updated = updateFunctionalBorders(currentCalendarData, template.functionalBorderValue);
        if (updated) {
            setCurrentCalendarData(currentCalendarData);
            saveToStorage('appSettings', appSettings);
            generateCalendar();
            showNotification('Значения обводок обновлены');
        }
    }
    
    saveToStorage('appSettings', appSettings);
    closeModal();
    calculateSummaryDisplay();
    showNotification('Настройки сохранены');
}

// Экспорт данных
function exportData() {
    const data = {
        appSettings: appSettings,  // Теперь экспортируем только appSettings
        exportDate: new Date().toISOString(),
        version: '1.2'  // Обновляем версию для новой структуры
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
            
            // Поддержка старого формата (миграция)
            if (data.calendarData && data.appSettings) {
                // Старый формат: переносим calendarData в шаблон по умолчанию
                if (data.appSettings.templates && data.appSettings.templates.default) {
                    data.appSettings.templates.default.calendarData = data.calendarData;
                }
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
    event.target.value = '';
    closeModal();
}

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

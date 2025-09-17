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
    const modals = [
        'modal', 'summary-modal', 'period-modal', 'settings-modal',
        'calculation-variants-modal', 'export-modal', 'import-modal',
        'help-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
    
    document.body.classList.remove('modal-open');
}

// Расчеты
function calculateSummary() {
    const monthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let totalEarnedWithoutTax = 0;
    
    const currentTemplate = appSettings.templates.find(t => t.id === appSettings.currentTemplateId);
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales > 0) {
            workDays++;
            totalSales += dayData.sales;
            
            if (currentTemplate.type === 'percentage') {
                // Используем индивидуальные настройки дня или общие
                const dayPercent = dayData.customSalesPercent || currentTemplate.settings.salesPercent;
                const dayShiftRate = dayData.customShiftRate || currentTemplate.settings.shiftRate;
                
                totalEarnedWithoutTax += calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
            } else if (currentTemplate.type === 'custom') {
                // Пользовательский шаблон - пока просто 0
                totalEarnedWithoutTax += 0;
            }
        }
    }
    
    let totalEarned = 0;
    let salary = 0;
    let balance = 0;
    
    if (currentTemplate.type === 'percentage') {
        totalEarned = totalEarnedWithoutTax;
        salary = totalEarned - currentTemplate.settings.advance;
        balance = salary;
    } else if (currentTemplate.type === 'custom') {
        // Пользовательский шаблон - пока просто 0
        totalEarned = 0;
        salary = 0;
        balance = 0;
    }
    
    document.getElementById('modal-work-days').textContent = workDays;
    document.getElementById('modal-total-sales').textContent = totalSales.toLocaleString();
    document.getElementById('modal-total-earned').textContent = totalEarned.toLocaleString();
    document.getElementById('modal-salary').textContent = salary.toLocaleString();
    document.getElementById('modal-balance').textContent = balance.toLocaleString();
    document.getElementById('summary-month-year').textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
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
    });
    
    // Варианты расчета
    document.getElementById('calculation-variants-btn').addEventListener('click', () => {
        document.getElementById('calculation-variants-modal').style.display = 'block';
        document.body.classList.add('modal-open');
        updateSettingsUI();
    });
    
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
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
    
    // Переключение шаблонов в настройках
    document.getElementById('template-selector').addEventListener('change', function() {
        updateSettingsUI();
    });
    
    // Кнопка обновления версии
    document.getElementById('update-btn').addEventListener('click', forceUpdate);
    
    // Кнопка очистки данных
    document.getElementById('clear-data-btn').addEventListener('click', showClearDataConfirm);
    
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

    // Обработчики для палитры
    document.getElementById('palette-btn').addEventListener('click', function() {
        const palettePanel = document.getElementById('palette-panel');
        const isVisible = palettePanel.style.display === 'block';
        palettePanel.style.display = isVisible ? 'none' : 'block';
        this.classList.toggle('active', !isVisible);
        
        // Если панель скрывается, выключаем режим массовой заливки/обводки
        if (isVisible) {
            massColoringMode = null;
            document.querySelectorAll('.palette-tool.active').forEach(tool => {
                tool.classList.remove('active');
            });
        }
    });

    // Обработчики для инструментов палитры
    document.querySelectorAll('.palette-tool.fill').forEach(tool => {
        tool.addEventListener('click', function() {
            // Активируем инструмент заливки
            document.querySelectorAll('.palette-tool').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            massColoringMode = 'fill';
        });
    });

    // Обработчик для инструмента обводки
    document.getElementById('palette-border').addEventListener('click', function() {
        document.querySelectorAll('.palette-tool').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        massColoringMode = 'border';
    });

    // Кнопка добавления нового шаблона
    document.getElementById('add-template-btn').addEventListener('click', addNewTemplate);
}

// Загрузка настроек в форму
function loadSettingsToForm() {
    updateTemplateSelector();
    updateSettingsUI();
}

// Обновление селектора шаблонов
function updateTemplateSelector() {
    const templateSelector = document.getElementById('template-selector');
    templateSelector.innerHTML = '';
    
    appSettings.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        if (template.id === appSettings.currentTemplateId) {
            option.selected = true;
        }
        templateSelector.appendChild(option);
    });
}

// Обновление интерфейса настроек в зависимости от выбранного шаблона
function updateSettingsUI() {
    const templateId = parseInt(document.getElementById('template-selector').value);
    const template = appSettings.templates.find(t => t.id === templateId);
    
    if (!template) return;
    
    // Скрываем все настройки
    document.querySelectorAll('.template-settings').forEach(el => {
        el.style.display = 'none';
    });
    
    // Показываем настройки для выбранного шаблона
    if (template.type === 'percentage') {
        document.getElementById('percentage-settings').style.display = 'block';
        
        // Заполняем значения для шаблона "Процент + ставка"
        document.getElementById('sales-percent').value = template.settings.salesPercent;
        document.getElementById('shift-rate').value = template.settings.shiftRate;
        document.getElementById('advance').value = template.settings.advance;
        document.getElementById('functional-border-value').value = template.settings.functionalBorderValue;
    } else if (template.type === 'custom') {
        document.getElementById('custom-settings').style.display = 'block';
        // Пока пусто для пользовательских шаблонов
    }
}

// Сохранение настроек
function saveSettings() {
    const templateId = parseInt(document.getElementById('template-selector').value);
    const templateIndex = appSettings.templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) return;
    
    const oldFunctionalBorderValue = appSettings.templates[templateIndex].settings.functionalBorderValue;
    
    if (appSettings.templates[templateIndex].type === 'percentage') {
        appSettings.templates[templateIndex].settings = {
            salesPercent: parseFloat(document.getElementById('sales-percent').value),
            shiftRate: parseInt(document.getElementById('shift-rate').value),
            advance: parseInt(document.getElementById('advance').value),
            functionalBorderValue: parseInt(document.getElementById('functional-border-value').value)
        };
    }
    // Для custom шаблонов пока ничего не сохраняем
    
    appSettings.currentTemplateId = templateId;
    
    // Обновляем установленные функциональные обводки, если значение изменилось
    const newFunctionalBorderValue = appSettings.templates[templateIndex].settings.functionalBorderValue;
    if (oldFunctionalBorderValue !== newFunctionalBorderValue) {
        updateFunctionalBorders(newFunctionalBorderValue);
    }
    
    saveToStorage('appSettings', appSettings);
    closeModal();
    calculateSummary();
    showNotification('Настройки сохранены');
}

// Добавление нового шаблона
function addNewTemplate() {
    const newId = Math.max(...appSettings.templates.map(t => t.id), 0) + 1;
    const newTemplate = {
        id: newId,
        name: `Шаблон ${newId}`,
        type: 'custom',
        settings: {}
    };
    
    appSettings.templates.push(newTemplate);
    appSettings.currentTemplateId = newId;
    
    saveToStorage('appSettings', appSettings);
    updateTemplateSelector();
    updateSettingsUI();
    showNotification('Новый шаблон добавлен');
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

// Обработка нажатий клавиш
function handleKeyPress(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

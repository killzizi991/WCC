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
    const summary = calculateMonthlySummary(currentCalendarData, template, currentYear, currentMonth);
    
    // Обновляем отображение с новыми данными
    document.getElementById('modal-work-days').textContent = summary.workDays;
    document.getElementById('modal-total-sales').textContent = summary.totalSales.toLocaleString();
    document.getElementById('modal-total-earned').textContent = summary.totalIncome.toLocaleString();
    document.getElementById('modal-salary').textContent = summary.finalSalary.toLocaleString();
    document.getElementById('modal-balance').textContent = summary.finalSalary.toLocaleString();
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
        openDayModal(day);
    }
}

// Установка/снятие функциональной обводки
function toggleFunctionalBorder(day) {
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const currentCalendarData = getCurrentCalendarData();
    let dayData = currentCalendarData[dateKey] || {};
    const template = getCurrentTemplate();
    
    if (dayData.functionalBorder) {
        // Снимаем обводку
        dayData.functionalBorder = false;
        dayData.functionalBorderData = undefined;
        
        // Сбрасываем значения в зависимости от активных блоков
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        
        if (hasSalesPercent) dayData.sales = 0;
        if (hasShiftRate) {
            dayData.dayShift = false;
            dayData.nightShift = false;
        }
        if (hasHourlyRate) {
            dayData.dayHours = 0;
            dayData.nightHours = 0;
        }
        
        showNotification('Обводка снята');
    } else {
        // Устанавливаем обводку
        dayData.functionalBorder = true;
        dayData.functionalBorderData = {...template.functionalBorderData};
        
        // Устанавливаем значения в зависимости от активных блоков
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        
        if (hasSalesPercent) dayData.sales = template.functionalBorderData.sales;
        if (hasShiftRate) {
            dayData.dayShift = template.functionalBorderData.dayShift;
            dayData.nightShift = template.functionalBorderData.nightShift;
        }
        if (hasHourlyRate) {
            dayData.dayHours = template.functionalBorderData.dayHours;
            dayData.nightHours = template.functionalBorderData.nightHours;
        }
        
        showNotification('Обводка установлена');
    }
    
    currentCalendarData[dateKey] = dayData;
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
    saveToStorage('appSettings', appSettings);
    generateCalendar();
}

// Открытие модального окна дня
function openDayModal(day) {
    selectedDay = day;
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const currentCalendarData = getCurrentCalendarData();
    const dayData = currentCalendarData[dateKey] || {};
    
    // Сохраняем оригинальные данные ФО для проверки изменений
    originalFunctionalBorderData = dayData.functionalBorder ? {...dayData.functionalBorderData} : null;
    
    document.getElementById('modal-day').textContent = day;
    document.getElementById('comment-input').value = dayData.comment || '';
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === dayData.color) {
            option.classList.add('selected');
        }
    });
    
    // Генерация динамических полей настроек дня на основе активных блоков
    generateDaySettingsFields(dayData);
    
    document.getElementById('day-settings').style.display = 'none';
    
    // Генерация динамических полей на основе активных блоков правил
    generateDynamicFields(dayData);
    
    showModal('modal');
}

// Генерация динамических полей настроек дня
function generateDaySettingsFields(dayData) {
    const daySettings = document.getElementById('day-settings');
    const settingsContent = daySettings.querySelector('.setting-group')?.parentNode || daySettings;
    
    // Очищаем старые поля настроек
    const existingSettings = settingsContent.querySelectorAll('.setting-group');
    existingSettings.forEach(setting => {
        if (!setting.querySelector('#reset-day-settings')) {
            setting.remove();
        }
    });
    
    const template = getCurrentTemplate();
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    // Создаем контейнер для новых настроек
    const newSettingsContainer = document.createElement('div');
    
    // Поле для индивидуального процента с продаж (если активен блок)
    if (hasSalesPercent) {
        const percentGroup = document.createElement('div');
        percentGroup.className = 'setting-group';
        percentGroup.innerHTML = `
            <label>Процент с продаж (%):</label>
            <input type="number" id="day-sales-percent" min="0" max="100" step="0.1" 
                   value="${dayData.customSalesPercent || ''}">
        `;
        newSettingsContainer.appendChild(percentGroup);
    }
    
    // Поле для индивидуальной ставки за смену (если активен блок)
    if (hasShiftRate) {
        const shiftGroup = document.createElement('div');
        shiftGroup.className = 'setting-group';
        shiftGroup.innerHTML = `
            <label>Ставка за смену (руб):</label>
            <input type="number" id="day-shift-rate" min="0" step="100" 
                   value="${dayData.customShiftRate || ''}">
        `;
        newSettingsContainer.appendChild(shiftGroup);
    }
    
    // Поле для индивидуальной ставки за час (если активен блок)
    if (hasHourlyRate) {
        const hourlyGroup = document.createElement('div');
        hourlyGroup.className = 'setting-group';
        hourlyGroup.innerHTML = `
            <label>Ставка за час (руб):</label>
            <input type="number" id="day-hourly-rate" min="0" step="10" 
                   value="${dayData.customHourlyRate || ''}">
        `;
        newSettingsContainer.appendChild(hourlyGroup);
    }
    
    // УНИВЕРСАЛЬНЫЕ ПОЛЯ: БОНУС И ФИКСИРОВАННЫЙ ВЫЧЕТ (всегда доступны)
    const bonusGroup = document.createElement('div');
    bonusGroup.className = 'setting-group';
    bonusGroup.innerHTML = `
        <label>Бонус за день (руб):</label>
        <input type="number" id="day-bonus" min="0" step="100" 
               value="${dayData.bonus || ''}">
    `;
    newSettingsContainer.appendChild(bonusGroup);
    
    const deductionGroup = document.createElement('div');
    deductionGroup.className = 'setting-group';
    deductionGroup.innerHTML = `
        <label>Фиксированный вычет за день (руб):</label>
        <input type="number" id="day-deduction" min="0" step="100" 
               value="${dayData.fixedDeduction || ''}">
    `;
    newSettingsContainer.appendChild(deductionGroup);
    
    // Если нет активных блоков, отображаем сообщение
    if (!hasSalesPercent && !hasShiftRate && !hasHourlyRate) {
        const message = document.createElement('div');
        message.style.padding = '10px';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        message.textContent = 'Добавьте блоки правил в шаблон для индивидуальных настроек дня';
        newSettingsContainer.appendChild(message);
    }
    
    // Вставляем новые настройки перед кнопкой сброса
    const resetButton = settingsContent.querySelector('#reset-day-settings');
    if (resetButton) {
        settingsContent.insertBefore(newSettingsContainer, resetButton);
    } else {
        settingsContent.appendChild(newSettingsContainer);
    }
}

// Генерация динамических полей на основе активных блоков правил
function generateDynamicFields(dayData) {
    const dynamicFields = document.getElementById('dynamic-fields');
    dynamicFields.innerHTML = '';
    
    const template = getCurrentTemplate();
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    // Поле продаж (если есть блок процента с продаж)
    if (hasSalesPercent) {
        const salesGroup = document.createElement('div');
        salesGroup.className = 'setting-group';
        salesGroup.innerHTML = `
            <label>Сумма продаж (руб):</label>
            <input type="number" id="sales-input" value="${dayData.sales || ''}" min="0" step="100">
        `;
        dynamicFields.appendChild(salesGroup);
    }
    
    // Поля смен (если есть блок ставки за смену)
    if (hasShiftRate) {
        const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
        const hasNightShifts = shiftBlock && shiftBlock.nightRanges && shiftBlock.nightRanges.length > 0;
        
        const shiftGroup = document.createElement('div');
        shiftGroup.className = 'setting-group';
        shiftGroup.innerHTML = `
            <label style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="day-shift-checkbox" ${dayData.dayShift ? 'checked' : ''}>
                Дневная смена
            </label>
            ${hasNightShifts ? `
            <label style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <input type="checkbox" id="night-shift-checkbox" ${dayData.nightShift ? 'checked' : ''}>
                Ночная смена
            </label>
            ` : ''}
        `;
        dynamicFields.appendChild(shiftGroup);
    }
    
    // Поля часов (если есть блок ставки за час)
    if (hasHourlyRate) {
        const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
        const hasNightHours = hourlyBlock && hourlyBlock.nightRanges && hourlyBlock.nightRanges.length > 0;
        
        const hoursGroup = document.createElement('div');
        hoursGroup.className = 'setting-group';
        hoursGroup.innerHTML = `
            <label>Дневные часы:</label>
            <input type="number" id="day-hours-input" value="${dayData.dayHours || ''}" min="0" step="0.5">
            ${hasNightHours ? `
            <label style="margin-top: 10px;">Ночные часы:</label>
            <input type="number" id="night-hours-input" value="${dayData.nightHours || ''}" min="0" step="0.5">
            ` : ''}
        `;
        dynamicFields.appendChild(hoursGroup);
    }
    
    // Если нет ни одного блока, отображаем сообщение
    if (!hasSalesPercent && !hasShiftRate && !hasHourlyRate) {
        const message = document.createElement('div');
        message.style.padding = '10px';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        message.textContent = 'Добавьте блоки правил в шаблон для ввода данных';
        dynamicFields.appendChild(message);
    }
}

// Сохранение данных дня
function saveDayData() {
    const comment = document.getElementById('comment-input').value;
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color;
    
    const dateKey = `${currentYear}-${currentMonth+1}-${selectedDay}`;
    const currentCalendarData = getCurrentCalendarData();
    
    const template = getCurrentTemplate();
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    const dayData = {
        comment: comment,
        color: selectedColor
    };
    
    // Сохраняем индивидуальные настройки дня в зависимости от активных блоков
    if (hasSalesPercent) {
        const customPercent = document.getElementById('day-sales-percent')?.value;
        dayData.customSalesPercent = customPercent ? parseFloat(customPercent) : null;
        dayData.sales = parseInt(document.getElementById('sales-input').value) || 0;
    }
    
    if (hasShiftRate) {
        const customRate = document.getElementById('day-shift-rate')?.value;
        dayData.customShiftRate = customRate ? parseInt(customRate) : null;
        dayData.dayShift = document.getElementById('day-shift-checkbox')?.checked || false;
        const nightCheckbox = document.getElementById('night-shift-checkbox');
        if (nightCheckbox) {
            dayData.nightShift = nightCheckbox.checked;
        }
    }
    
    if (hasHourlyRate) {
        const customHourly = document.getElementById('day-hourly-rate')?.value;
        dayData.customHourlyRate = customHourly ? parseFloat(customHourly) : null;
        dayData.dayHours = parseFloat(document.getElementById('day-hours-input').value) || 0;
        const nightHoursInput = document.getElementById('night-hours-input');
        if (nightHoursInput) {
            dayData.nightHours = parseFloat(nightHoursInput.value) || 0;
        }
    }
    
    // УНИВЕРСАЛЬНЫЕ ПОЛЯ: сохраняем бонус и фиксированный вычет (всегда доступны)
    const bonusInput = document.getElementById('day-bonus');
    if (bonusInput) {
        dayData.bonus = parseFloat(bonusInput.value) || 0;
    }
    
    const deductionInput = document.getElementById('day-deduction');
    if (deductionInput) {
        dayData.fixedDeduction = parseFloat(deductionInput.value) || 0;
    }
    
    // Проверяем, нужно ли сохранить функциональную обводку
    if (originalFunctionalBorderData) {
        const shouldKeepFunctionalBorder = checkFunctionalBorderPreservation(dayData, originalFunctionalBorderData, template);
        if (shouldKeepFunctionalBorder) {
            dayData.functionalBorder = true;
            dayData.functionalBorderData = {...originalFunctionalBorderData};
        } else {
            dayData.functionalBorder = false;
            dayData.functionalBorderData = undefined;
        }
    }
    
    currentCalendarData[dateKey] = dayData;
    saveToStorage('appSettings', appSettings);
    closeModal();
    generateCalendar();
}

// Проверка сохранения функциональной обводки
function checkFunctionalBorderPreservation(dayData, originalData, template) {
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    let isPreserved = true;
    
    if (hasSalesPercent) {
        isPreserved = isPreserved && (dayData.sales === originalData.sales);
    }
    
    if (hasShiftRate) {
        isPreserved = isPreserved && 
            (dayData.dayShift === originalData.dayShift) && 
            (dayData.nightShift === originalData.nightShift);
    }
    
    if (hasHourlyRate) {
        isPreserved = isPreserved && 
            (dayData.dayHours === originalData.dayHours) && 
            (dayData.nightHours === originalData.nightHours);
    }
    
    return isPreserved;
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

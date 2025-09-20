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
        const currentTemplate = appSettings.calculationTemplates.find(t => t.id === appSettings.currentTemplateId);
        
        // Определяем необходимые поля на основе активных блоков
        const needsSales = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.PERCENTAGE);
        const needsHours = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.HOURLY_RATE);
        const needsShifts = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.SHIFT_RATE);
        
        // Форматирование содержимого
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${needsSales && dayData.sales ? `<div class="day-sales">${dayData.sales}</div>` : ''}
            ${needsHours && dayData.hours ? `<div class="day-sales">${dayData.hours}ч</div>` : ''}
            ${needsShifts && dayData.workingDay ? `<div class="day-sales">✓</div>` : ''}
        `;
        
        // Цвет фона
        if (dayData.color) {
            dayElement.style.backgroundColor = dayData.color;
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
    const currentTemplate = appSettings.calculationTemplates.find(t => t.id === appSettings.currentTemplateId);
    
    // Определяем необходимые поля на основе активных блоков
    const needsSales = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.PERCENTAGE);
    const needsHours = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.HOURLY_RATE);
    const needsShifts = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.SHIFT_RATE);
    
    document.getElementById('modal-day').textContent = day;
    
    // Настройка отображения полей ввода
    document.getElementById('sales-input-container').style.display = needsSales ? 'block' : 'none';
    document.getElementById('working-day-container').style.display = needsShifts ? 'block' : 'none';
    
    // Создаем контейнер для часов, если его нет
    let hoursContainer = document.getElementById('hours-input-container');
    if (!hoursContainer) {
        hoursContainer = document.createElement('div');
        hoursContainer.id = 'hours-input-container';
        hoursContainer.className = 'setting-group';
        hoursContainer.innerHTML = `
            <label>Часы:</label>
            <input type="number" id="hours-input" placeholder="Количество часов">
        `;
        document.getElementById('sales-input-container').parentNode.insertBefore(hoursContainer, document.getElementById('sales-input-container').nextSibling);
    }
    hoursContainer.style.display = needsHours ? 'block' : 'none';
    
    // Заполняем значения
    if (needsSales) {
        document.getElementById('sales-input').value = dayData.sales || '';
    }
    if (needsHours) {
        document.getElementById('hours-input').value = dayData.hours || '';
    }
    if (needsShifts) {
        document.getElementById('working-day-checkbox').checked = dayData.workingDay || false;
    }
    
    document.getElementById('comment-input').value = dayData.comment || '';
    
    // Выбор цвета
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === dayData.color) {
            option.classList.add('selected');
        }
    });
    
    document.getElementById('modal').style.display = 'block';
    document.body.classList.add('modal-open');
}

// Сохранение данных дня
function saveDayData() {
    const dateKey = `${currentYear}-${currentMonth+1}-${selectedDay}`;
    const currentTemplate = appSettings.calculationTemplates.find(t => t.id === appSettings.currentTemplateId);
    
    // Определяем необходимые поля на основе активных блоков
    const needsSales = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.PERCENTAGE);
    const needsHours = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.HOURLY_RATE);
    const needsShifts = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.SHIFT_RATE);
    
    const comment = document.getElementById('comment-input').value;
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color;
    
    let dayData = {
        comment: comment,
        color: selectedColor
    };
    
    if (needsSales) {
        dayData.sales = parseInt(document.getElementById('sales-input').value) || 0;
    }
    if (needsHours) {
        dayData.hours = parseInt(document.getElementById('hours-input').value) || 0;
    }
    if (needsShifts) {
        dayData.workingDay = document.getElementById('working-day-checkbox').checked;
    }
    
    calendarData[dateKey] = dayData;
    
    saveToStorage('calendarData', calendarData);
    closeModal();
    generateCalendar();
}

// Закрытие модального окна
function closeModal() {
    const modals = [
        'modal', 'summary-modal', 'period-modal', 'settings-modal',
        'calculation-variants-modal', 'export-modal', 'import-modal',
        'help-modal', 'template-selector-modal', 'add-template-modal'
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
    const currentTemplate = appSettings.calculationTemplates.find(t => t.id === appSettings.currentTemplateId);
    const summary = calculateMonthSummary(calendarData, currentYear, currentMonth, currentTemplate.blocks);
    
    document.getElementById('modal-work-days').textContent = summary.workDays;
    
    // Определяем какие поля показывать на основе активных блоков
    const hasSales = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.PERCENTAGE);
    const hasHours = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.HOURLY_RATE);
    const hasShifts = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.SHIFT_RATE);
    
    if (hasSales) {
        document.getElementById('modal-total-sales').textContent = summary.totalSales.toLocaleString();
        document.getElementById('sales-summary-row').style.display = 'block';
    } else {
        document.getElementById('sales-summary-row').style.display = 'none';
    }
    
    if (hasHours) {
        document.getElementById('modal-total-hours').textContent = summary.totalHours.toLocaleString();
        document.getElementById('hours-summary-row').style.display = 'block';
    } else {
        document.getElementById('hours-summary-row').style.display = 'none';
    }
    
    if (hasShifts) {
        document.getElementById('modal-total-shifts').textContent = summary.totalShifts.toLocaleString();
        document.getElementById('shifts-summary-row').style.display = 'block';
    } else {
        document.getElementById('shifts-summary-row').style.display = 'none';
    }
    
    document.getElementById('modal-total-earned').textContent = summary.totalEarned.toLocaleString();
    document.getElementById('modal-salary').textContent = summary.salary.toLocaleString();
    
    // Показываем аванс если есть соответствующий блок
    const hasAdvance = currentTemplate.blocks.some(b => b.type === BLOCK_TYPES.ADVANCE);
    if (hasAdvance) {
        document.getElementById('modal-advance').textContent = summary.totalDeductions.toLocaleString();
        document.getElementById('advance-summary-row').style.display = 'block';
    } else {
        document.getElementById('advance-summary-row').style.display = 'none';
    }
    
    document.getElementById('summary-month-year').textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
}

// Остальной код components.js остается без изменений
// ... (остальные функции без изменений)

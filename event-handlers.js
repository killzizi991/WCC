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
        showModal('period-modal');
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
    
    document.getElementById('summary-btn').addEventListener('click', showReportModal);
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        showModal('settings-modal');
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
        const template = getCurrentTemplate();
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        
        if (hasSalesPercent) {
            document.getElementById('day-sales-percent').value = '';
        }
        if (hasShiftRate) {
            document.getElementById('day-shift-rate').value = '';
        }
        if (hasHourlyRate) {
            document.getElementById('day-hourly-rate').value = '';
        }
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
    
    // Новые обработчики для кнопок очистки данных
    document.getElementById('clear-all-data-btn').addEventListener('click', clearAllData);
    document.getElementById('clear-template-data-btn').addEventListener('click', clearCurrentTemplateData);
    
    // Обработчики для отчета
    document.getElementById('detailed-data-btn').addEventListener('click', toggleDetailedData);
    document.getElementById('close-report').addEventListener('click', () => {
        closeModal();
    });
}

// Обработка нажатий клавиш
function handleKeyPress(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// Сохранение настроек
function saveSettings() {
    // Убрали сохранение настроек ФО из настроек приложения
    saveToStorage('appSettings', appSettings);
    closeModal();
    calculateSummaryDisplay();
    showNotification('Настройки сохранены');
}

// Функция очистки всех данных
function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить. Будут удалены все шаблоны (кроме основного) и все данные календаря.')) {
        // Оставляем только шаблон по умолчанию
        const defaultTemplate = appSettings.templates['default'];
        
        // Очищаем все шаблоны, оставляя только default
        appSettings.templates = {
            'default': {
                ...defaultTemplate,
                calendarData: {} // Очищаем данные календаря
            }
        };
        
        // Устанавливаем текущий шаблон как default
        appSettings.currentTemplateId = 'default';
        
        // Сохраняем изменения
        saveToStorage('appSettings', appSettings);
        
        // Перезагружаем календарь
        generateCalendar();
        
        // Закрываем модальное окно
        closeModal();
        
        showNotification('Все данные успешно очищены');
    }
}

// Функция очистки данных текущего шаблона
function clearCurrentTemplateData() {
    const currentTemplate = getCurrentTemplate();
    const templateName = currentTemplate.name;
    
    if (confirm(`Вы уверены, что хотите удалить все данные шаблона "${templateName}"? Это действие нельзя отменить.`)) {
        // Очищаем данные календаря текущего шаблона
        currentTemplate.calendarData = {};
        
        // Сохраняем изменения
        saveToStorage('appSettings', appSettings);
        
        // Перезагружаем календарь
        generateCalendar();
        
        showNotification(`Данные шаблона "${templateName}" успешно очищены`);
    }
}

// Показать модальное окно отчета
function showReportModal() {
    try {
        const modal = document.getElementById('summary-modal');
        if (!modal) {
            console.error('Report modal not found');
            return;
        }
        
        const template = getCurrentTemplate();
        const currentCalendarData = getCurrentCalendarData();
        const summary = calculateMonthlySummary(currentCalendarData, template, currentYear, currentMonth);
        
        // Обновляем основные показатели
        document.getElementById('modal-work-days').textContent = summary.workDays;
        document.getElementById('modal-total-earned').textContent = summary.totalIncome.toLocaleString();
        document.getElementById('modal-salary').textContent = summary.finalSalary.toLocaleString();
        document.getElementById('summary-month-year').textContent = 
            `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
        
        // Показываем/скрываем строку аванса в зависимости от наличия блока
        const advanceRow = document.getElementById('advance-row');
        const hasAdvance = template.ruleBlocks.some(block => block.type === 'advance');
        advanceRow.style.display = hasAdvance ? 'block' : 'none';
        
        if (hasAdvance) {
            document.getElementById('modal-advance').textContent = summary.advanceAmount.toLocaleString();
        }
        
        // Скрываем подробные данные при открытии
        const detailedData = document.getElementById('detailed-data');
        detailedData.style.display = 'none';
        
        // Обновляем подробные данные
        updateDetailedReport(summary, template, currentCalendarData);
        
        showModal('summary-modal');
    } catch (error) {
        console.error('Ошибка показа модального окна отчета:', error);
        showNotification('Ошибка открытия отчета');
    }
}

// Обновление подробного отчета
function updateDetailedReport(summary, template, calendarData) {
    try {
        // Всего продаж
        const totalSalesRow = document.getElementById('total-sales-row');
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        totalSalesRow.style.display = hasSalesPercent ? 'block' : 'none';
        if (hasSalesPercent) {
            document.getElementById('modal-total-sales').textContent = summary.totalSales.toLocaleString();
        }
        
        // Часы
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        const hasHoursData = summary.hours.total > 0;
        
        const dayHoursRow = document.getElementById('day-hours-row');
        const nightHoursRow = document.getElementById('night-hours-row');
        const totalHoursRow = document.getElementById('total-hours-row');
        
        dayHoursRow.style.display = (hasHourlyRate && hasHoursData) ? 'block' : 'none';
        nightHoursRow.style.display = (hasHourlyRate && hasHoursData && summary.hours.night > 0) ? 'block' : 'none';
        totalHoursRow.style.display = hasHourlyRate ? 'block' : 'none';
        
        if (hasHourlyRate) {
            document.getElementById('modal-day-hours').textContent = summary.hours.day;
            document.getElementById('modal-night-hours').textContent = summary.hours.night;
            document.getElementById('modal-total-hours').textContent = summary.hours.total;
        }
        
        // Смены
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasShiftsData = summary.shifts.total > 0;
        
        const dayShiftsRow = document.getElementById('day-shifts-row');
        const nightShiftsRow = document.getElementById('night-shifts-row');
        const totalShiftsRow = document.getElementById('total-shifts-row');
        
        dayShiftsRow.style.display = (hasShiftRate && hasShiftsData) ? 'block' : 'none';
        nightShiftsRow.style.display = (hasShiftRate && hasShiftsData && summary.shifts.night > 0) ? 'block' : 'none';
        totalShiftsRow.style.display = hasShiftRate ? 'block' : 'none';
        
        if (hasShiftRate) {
            document.getElementById('modal-day-shifts').textContent = summary.shifts.day;
            document.getElementById('modal-night-shifts').textContent = summary.shifts.night;
            document.getElementById('modal-total-shifts').textContent = summary.shifts.total;
        }
        
        // Сверхурочные
        const overtimeRow = document.getElementById('overtime-row');
        const hasOvertime = template.ruleBlocks.some(block => block.type === 'overtime');
        overtimeRow.style.display = hasOvertime ? 'block' : 'none';
        if (hasOvertime) {
            document.getElementById('modal-overtime').textContent = summary.overtimeAmount.toLocaleString();
        }
        
        // Бонусы
        const bonusRow = document.getElementById('bonus-row');
        const hasBonus = template.ruleBlocks.some(block => block.type === 'bonus') || summary.totalBonusAmount > 0;
        bonusRow.style.display = hasBonus ? 'block' : 'none';
        if (hasBonus) {
            document.getElementById('modal-bonus').textContent = summary.totalBonusAmount.toLocaleString();
        }
        
        // Вычеты
        const deductionRow = document.getElementById('deduction-row');
        const hasDeduction = template.ruleBlocks.some(block => block.type === 'fixedDeduction') || summary.totalDeductionAmount > 0;
        deductionRow.style.display = hasDeduction ? 'block' : 'none';
        if (hasDeduction) {
            document.getElementById('modal-deduction').textContent = summary.totalDeductionAmount.toLocaleString();
        }
        
        // Зарплата до бонусов
        const salaryBeforeBonusesRow = document.getElementById('salary-before-bonuses-row');
        salaryBeforeBonusesRow.style.display = hasBonus ? 'block' : 'none';
        if (hasBonus) {
            document.getElementById('modal-salary-before-bonuses').textContent = summary.salaryBeforeBonuses.toLocaleString();
        }
        
        // Зарплата до вычетов
        const salaryBeforeDeductionsRow = document.getElementById('salary-before-deductions-row');
        salaryBeforeDeductionsRow.style.display = hasDeduction ? 'block' : 'none';
        if (hasDeduction) {
            document.getElementById('modal-salary-before-deductions').textContent = summary.salaryBeforeDeductions.toLocaleString();
        }
    } catch (error) {
        console.error('Ошибка обновления подробного отчета:', error);
    }
}

// Переключение отображения подробных данных
function toggleDetailedData() {
    const detailedData = document.getElementById('detailed-data');
    const isVisible = detailedData.style.display === 'block';
    
    detailedData.style.display = isVisible ? 'none' : 'block';
    
    const button = document.getElementById('detailed-data-btn');
    button.textContent = isVisible ? 'Подробные данные' : 'Скрыть подробности';
}

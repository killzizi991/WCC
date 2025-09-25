// Настройка обработчиков событий
function setupEventListeners() {
  try {
    // Проверка существования элементов перед назначением обработчиков
    const prevMonthBtn = document.getElementById('prev-month');
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        generateCalendar();
      });
    }
    
    const nextMonthBtn = document.getElementById('next-month');
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        generateCalendar();
      });
    }
    
    const monthYearSelector = document.getElementById('month-year-selector');
    if (monthYearSelector) {
      monthYearSelector.addEventListener('click', () => {
        showModal('period-modal');
      });
    }
    
    const paletteBtn = document.getElementById('palette-btn');
    if (paletteBtn) {
      paletteBtn.addEventListener('click', () => {
        const palettePanel = document.getElementById('palette-panel');
        const isOpen = palettePanel && palettePanel.style.display === 'flex';
        
        if (isOpen) {
          palettePanel.style.display = 'none';
          paletteBtn.classList.remove('active');
          massColoringMode = null;
          document.querySelectorAll('.palette-tool').forEach(tool => {
            tool.classList.remove('active');
          });
        } else {
          if (palettePanel) {
            palettePanel.style.display = 'flex';
          }
          paletteBtn.classList.add('active');
        }
      });
    }
    
    document.querySelectorAll('.palette-tool.fill').forEach(tool => {
      tool.addEventListener('click', () => {
        document.querySelectorAll('.palette-tool.fill').forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        massColoringMode = 'fill';
      });
    });
    
    const paletteBorder = document.getElementById('palette-border');
    if (paletteBorder) {
      paletteBorder.addEventListener('click', () => {
        massColoringMode = massColoringMode === 'border' ? null : 'border';
        paletteBorder.classList.toggle('active');
      });
    }
    
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', closeModal);
    });
    
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        closeModal();
      }
    });
    
    const saveDataBtn = document.getElementById('save-data');
    if (saveDataBtn) {
      saveDataBtn.addEventListener('click', saveDayData);
    }
    
    const summaryBtn = document.getElementById('summary-btn');
    if (summaryBtn) {
      summaryBtn.addEventListener('click', showReportModal);
    }
    
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showModal('settings-modal');
      });
    }
    
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    const templatesBtn = document.getElementById('templates-btn');
    if (templatesBtn) {
      templatesBtn.addEventListener('click', showTemplatesModal);
    }
    
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', showExportModal);
    }
    
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', showImportModal);
    }
    
    const importFile = document.getElementById('import-file');
    if (importFile) {
      importFile.addEventListener('change', importData);
    }
    
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
    
    const daySettingsBtn = document.getElementById('day-settings-btn');
    if (daySettingsBtn) {
      daySettingsBtn.addEventListener('click', function() {
        const settingsPanel = document.getElementById('day-settings');
        if (settingsPanel) {
          settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
    
    const resetDaySettings = document.getElementById('reset-day-settings');
    if (resetDaySettings) {
      resetDaySettings.addEventListener('click', function() {
        const template = getCurrentTemplate();
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        
        if (hasSalesPercent) {
          const salesPercentInput = document.getElementById('day-sales-percent');
          if (salesPercentInput) salesPercentInput.value = '';
        }
        if (hasShiftRate) {
          const shiftRateInput = document.getElementById('day-shift-rate');
          if (shiftRateInput) shiftRateInput.value = '';
        }
        if (hasHourlyRate) {
          const hourlyRateInput = document.getElementById('day-hourly-rate');
          if (hourlyRateInput) hourlyRateInput.value = '';
        }
      });
    }
    
    const updateBtn = document.getElementById('update-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', forceUpdate);
    }
    
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', showHelpModal);
    }
    
    document.addEventListener('keydown', handleKeyPress);
    
    const copyDataBtn = document.getElementById('copy-data-btn');
    if (copyDataBtn) {
      copyDataBtn.addEventListener('click', copyDataToClipboard);
    }
    
    const saveFileBtn = document.getElementById('save-file-btn');
    if (saveFileBtn) {
      saveFileBtn.addEventListener('click', exportData);
    }
    
    const importFileBtn = document.getElementById('import-file-btn');
    if (importFileBtn) {
      importFileBtn.addEventListener('click', () => {
        const importFile = document.getElementById('import-file');
        if (importFile) importFile.click();
      });
    }
    
    const importTextBtn = document.getElementById('import-text-btn');
    if (importTextBtn) {
      importTextBtn.addEventListener('click', importFromText);
    }
    
    // Новые обработчики для кнопок очистки данных
    const clearAllDataBtn = document.getElementById('clear-all-data-btn');
    if (clearAllDataBtn) {
      clearAllDataBtn.addEventListener('click', clearAllData);
    }
    
    const clearTemplateDataBtn = document.getElementById('clear-template-data-btn');
    if (clearTemplateDataBtn) {
      clearTemplateDataBtn.addEventListener('click', clearCurrentTemplateData);
    }
    
    // Обработчики для отчета
    const detailedDataBtn = document.getElementById('detailed-data-btn');
    if (detailedDataBtn) {
      detailedDataBtn.addEventListener('click', toggleDetailedData);
    }
    
    const closeReport = document.getElementById('close-report');
    if (closeReport) {
      closeReport.addEventListener('click', () => {
        closeModal();
      });
    }
  } catch (error) {
    console.error('Ошибка настройки обработчиков событий:', error);
    showNotification('Ошибка инициализации интерфейса');
  }
}

// Обработка нажатий клавиш
function handleKeyPress(e) {
  try {
    if (e.key === 'Escape') {
      closeModal();
    }
  } catch (error) {
    console.error('Ошибка обработки нажатия клавиши:', error);
  }
}

// Сохранение настроек
function saveSettings() {
  try {
    // Убрали сохранение настроек ФО из настроек приложения
    saveToStorage('appSettings', appSettings);
    closeModal();
    calculateSummaryDisplay();
    showNotification('Настройки сохранены');
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    showNotification('Ошибка сохранения настроек');
  }
}

// Функция очистки всех данных
function clearAllData() {
  try {
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
  } catch (error) {
    console.error('Ошибка очистки всех данных:', error);
    showNotification('Ошибка очистки данных');
  }
}

// Функция очистки данных текущего шаблона
function clearCurrentTemplateData() {
  try {
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
  } catch (error) {
    console.error('Ошибка очистки данных шаблона:', error);
    showNotification('Ошибка очистки данных шаблона');
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
    const modalWorkDays = document.getElementById('modal-work-days');
    if (modalWorkDays) modalWorkDays.textContent = summary.workDays;
    
    const modalTotalEarned = document.getElementById('modal-total-earned');
    if (modalTotalEarned) modalTotalEarned.textContent = summary.totalIncome.toLocaleString();
    
    const modalSalary = document.getElementById('modal-salary');
    if (modalSalary) modalSalary.textContent = summary.finalSalary.toLocaleString();
    
    const summaryMonthYear = document.getElementById('summary-month-year');
    if (summaryMonthYear) {
      summaryMonthYear.textContent = 
        `${new Date(currentYear, currentMonth).toLocaleString('ru', { month: 'long' })} ${currentYear}`;
    }
    
    // Показываем/скрываем строку аванса в зависимости от наличия блока
    const advanceRow = document.getElementById('advance-row');
    const hasAdvance = template.ruleBlocks.some(block => block.type === 'advance');
    if (advanceRow) {
      advanceRow.style.display = hasAdvance ? 'block' : 'none';
    }
    
    if (hasAdvance) {
      const modalAdvance = document.getElementById('modal-advance');
      if (modalAdvance) modalAdvance.textContent = summary.advanceAmount.toLocaleString();
    }
    
    // Скрываем подробные данные при открытии
    const detailedData = document.getElementById('detailed-data');
    if (detailedData) {
      detailedData.style.display = 'none';
    }
    
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
    if (totalSalesRow) {
      totalSalesRow.style.display = hasSalesPercent ? 'block' : 'none';
    }
    if (hasSalesPercent) {
      const modalTotalSales = document.getElementById('modal-total-sales');
      if (modalTotalSales) modalTotalSales.textContent = summary.totalSales.toLocaleString();
    }
    
    // Часы
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    const hasHoursData = summary.hours.total > 0;
    
    const dayHoursRow = document.getElementById('day-hours-row');
    const nightHoursRow = document.getElementById('night-hours-row');
    const totalHoursRow = document.getElementById('total-hours-row');
    
    if (dayHoursRow) dayHoursRow.style.display = (hasHourlyRate && hasHoursData) ? 'block' : 'none';
    if (nightHoursRow) nightHoursRow.style.display = (hasHourlyRate && hasHoursData && summary.hours.night > 0) ? 'block' : 'none';
    if (totalHoursRow) totalHoursRow.style.display = hasHourlyRate ? 'block' : 'none';
    
    if (hasHourlyRate) {
      const modalDayHours = document.getElementById('modal-day-hours');
      if (modalDayHours) modalDayHours.textContent = summary.hours.day;
      
      const modalNightHours = document.getElementById('modal-night-hours');
      if (modalNightHours) modalNightHours.textContent = summary.hours.night;
      
      const modalTotalHours = document.getElementById('modal-total-hours');
      if (modalTotalHours) modalTotalHours.textContent = summary.hours.total;
    }
    
    // Смены
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasShiftsData = summary.shifts.total > 0;
    
    const dayShiftsRow = document.getElementById('day-shifts-row');
    const nightShiftsRow = document.getElementById('night-shifts-row');
    
    if (dayShiftsRow) dayShiftsRow.style.display = (hasShiftRate && hasShiftsData) ? 'block' : 'none';
    if (nightShiftsRow) nightShiftsRow.style.display = (hasShiftRate && hasShiftsData && summary.shifts.night > 0) ? 'block' : 'none';
    
    if (hasShiftRate) {
      const modalDayShifts = document.getElementById('modal-day-shifts');
      if (modalDayShifts) modalDayShifts.textContent = summary.shifts.day;
      
      const modalNightShifts = document.getElementById('modal-night-shifts');
      if (modalNightShifts) modalNightShifts.textContent = summary.shifts.night;
    }
    
    // Сверхурочные
    const overtimeRow = document.getElementById('overtime-row');
    const hasOvertime = template.ruleBlocks.some(block => block.type === 'overtime');
    if (overtimeRow) {
      overtimeRow.style.display = hasOvertime ? 'block' : 'none';
    }
    if (hasOvertime) {
      const modalOvertime = document.getElementById('modal-overtime');
      if (modalOvertime) modalOvertime.textContent = summary.overtimeAmount.toLocaleString();
    }
    
    // Бонусы
    const bonusRow = document.getElementById('bonus-row');
    const hasBonus = template.ruleBlocks.some(block => block.type === 'bonus') || summary.totalBonusAmount > 0;
    if (bonusRow) {
      bonusRow.style.display = hasBonus ? 'block' : 'none';
    }
    if (hasBonus) {
      const modalBonus = document.getElementById('modal-bonus');
      if (modalBonus) modalBonus.textContent = summary.totalBonusAmount.toLocaleString();
    }
    
    // Вычеты
    const deductionRow = document.getElementById('deduction-row');
    const hasDeduction = template.ruleBlocks.some(block => block.type === 'fixedDeduction') || summary.totalDeductionAmount > 0;
    if (deductionRow) {
      deductionRow.style.display = hasDeduction ? 'block' : 'none';
    }
    if (hasDeduction) {
      const modalDeduction = document.getElementById('modal-deduction');
      if (modalDeduction) modalDeduction.textContent = summary.totalDeductionAmount.toLocaleString();
    }
    
    // Зарплата до бонусов
    const salaryBeforeBonusesRow = document.getElementById('salary-before-bonuses-row');
    if (salaryBeforeBonusesRow) {
      salaryBeforeBonusesRow.style.display = hasBonus ? 'block' : 'none';
    }
    if (hasBonus) {
      const modalSalaryBeforeBonuses = document.getElementById('modal-salary-before-bonuses');
      if (modalSalaryBeforeBonuses) modalSalaryBeforeBonuses.textContent = summary.salaryBeforeBonuses.toLocaleString();
    }
    
    // Зарплата до вычетов
    const salaryBeforeDeductionsRow = document.getElementById('salary-before-deductions-row');
    if (salaryBeforeDeductionsRow) {
      salaryBeforeDeductionsRow.style.display = hasDeduction ? 'block' : 'none';
    }
    if (hasDeduction) {
      const modalSalaryBeforeDeductions = document.getElementById('modal-salary-before-deductions');
      if (modalSalaryBeforeDeductions) modalSalaryBeforeDeductions.textContent = summary.salaryBeforeDeductions.toLocaleString();
    }
  } catch (error) {
    console.error('Ошибка обновления подробного отчета:', error);
  }
}

// Переключение отображения подробных данных
function toggleDetailedData() {
  try {
    const detailedData = document.getElementById('detailed-data');
    if (detailedData) {
      const isVisible = detailedData.style.display === 'block';
      detailedData.style.display = isVisible ? 'none' : 'block';
    }
  } catch (error) {
    console.error('Ошибка переключения подробных данных:', error);
  }
}

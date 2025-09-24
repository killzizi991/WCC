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
    
    // Новые обработчики для кнопок очистки данных
    document.getElementById('clear-all-data-btn').addEventListener('click', clearAllData);
    document.getElementById('clear-template-data-btn').addEventListener('click', clearCurrentTemplateData);
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
        
        // Очищаем старые данные calendarData
        calendarData = {};
        
        // Сохраняем изменения
        saveToStorage('appSettings', appSettings);
        saveToStorage('calendarData', calendarData);
        
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

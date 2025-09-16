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
        dayData.sales = appSettings[appSettings.mode].functionalBorderValue;
        dayData.functionalBorderValue = appSettings[appSettings.mode].functionalBorderValue;
        showNotification(`Обводка установлена, продажи: ${appSettings[appSettings.mode].functionalBorderValue} руб`);
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

// Показать модальное окно помощи
function showHelpModal() {
    const helpContent = document.getElementById('help-content');
    helpContent.innerHTML = '';
    
    if (typeof HELP_DATA === 'undefined') {
        helpContent.innerHTML = '<p>Данные справки не загружены</p>';
        return;
    }
    
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
            // Миграция старых данных
            if (data.appSettings.hasOwnProperty('useTax') && !data.appSettings.hasOwnProperty('mode')) {
                appSettings = {
                    mode: 'official',
                    official: {
                        salesPercent: data.appSettings.salesPercent,
                        shiftRate: data.appSettings.shiftRate,
                        fixedDeduction: data.appSettings.fixedDeduction,
                        advance: data.appSettings.advance,
                        fixedSalaryPart: data.appSettings.fixedSalaryPart,
                        functionalBorderValue: 30000
                    },
                    unofficial: {
                        salesPercent: 7,
                        shiftRate: 1000,
                        advance: 0,
                        functionalBorderValue: 30000
                    }
                };
            } else {
                appSettings = data.appSettings;
                // Добавляем значение по умолчанию для функциональной обводки, если его нет
                if (!appSettings.official.hasOwnProperty('functionalBorderValue')) {
                    appSettings.official.functionalBorderValue = 30000;
                }
                if (!appSettings.unofficial.hasOwnProperty('functionalBorderValue')) {
                    appSettings.unofficial.functionalBorderValue = 30000;
                }
            }
            
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
                // Миграция старых данных
                if (data.appSettings.hasOwnProperty('useTax') && !data.appSettings.hasOwnProperty('mode')) {
                    appSettings = {
                        mode: 'official',
                        official: {
                            salesPercent: data.appSettings.salesPercent,
                            shiftRate: data.appSettings.shiftRate,
                            fixedDeduction: data.appSettings.fixedDeduction,
                            advance: data.appSettings.advance,
                            fixedSalaryPart: data.appSettings.fixedSalaryPart,
                            functionalBorderValue: 30000
                        },
                        unofficial: {
                            salesPercent: 7,
                            shiftRate: 1000,
                            advance: 0,
                            functionalBorderValue: 30000
                        }
                    };
                } else {
                    appSettings = data.appSettings;
                    // Добавляем значение по умолчанию для функциональной обводки, если его нет
                    if (!appSettings.official.hasOwnProperty('functionalBorderValue')) {
                        appSettings.official.functionalBorderValue = 30000;
                    }
                    if (!appSettings.unofficial.hasOwnProperty('functionalBorderValue')) {
                        appSettings.unofficial.functionalBorderValue = 30000;
                    }
                }
                
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

// Показать подтверждение очистки данных
function showClearDataConfirm() {
    if (confirm("ВНИМАНИЕ! Все данные календаря будут удалены. Перед продолжением убедитесь, что вы сделали экспорт данных. Продолжить?")) {
        clearData();
    }
}

// Очистка всех данных календаря
function clearData() {
    calendarData = {};
    saveToStorage('calendarData', calendarData);
    generateCalendar();
    showNotification('Данные очищены');
}

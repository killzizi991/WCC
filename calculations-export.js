// FILE: calculations-export.js
// Показать модальное окно помощи
function showHelpModal() {
  try {
    const helpContent = document.getElementById('help-content');
    if (!helpContent) {
      console.error('Help content element not found');
      return;
    }
    
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
      answerDiv.textContent = '';
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
    
    showModal('help-modal');
  } catch (error) {
    console.error('Ошибка показа модального окна помощи:', error);
    showNotification('Ошибка открытия справки');
  }
}

// Показать модальное окно экспорта
function showExportModal() {
  try {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const iosExportText = document.getElementById('ios-export-text');
    if (iosExportText) {
      iosExportText.style.display = isIOS ? 'block' : 'none';
    }
    showModal('export-modal');
  } catch (error) {
    console.error('Ошибка показа модального окна экспорта:', error);
    showNotification('Ошибка открытия экспорта');
  }
}

// Показать модальное окно импорта
function showImportModal() {
  try {
    const importTextInput = document.getElementById('import-text-input');
    if (importTextInput) {
      importTextInput.value = '';
    }
    showModal('import-modal');
  } catch (error) {
    console.error('Ошибка показа модального окна импорта:', error);
    showNotification('Ошибка открытия импорта');
  }
}

// Валидация структуры импортируемых данных
function validateImportedData(data) {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Неверный формат данных' };
  }
  
  if (!data.appSettings && !data.calendarData) {
    return { isValid: false, error: 'Отсутствуют данные приложения' };
  }
  
  if (data.version && typeof data.version !== 'string') {
    return { isValid: false, error: 'Неверный формат версии данных' };
  }
  
  if (data.exportDate) {
    try {
      new Date(data.exportDate);
    } catch (e) {
      return { isValid: false, error: 'Неверный формат даты экспорта' };
    }
  }
  
  if (data.appSettings) {
    if (!data.appSettings.currentTemplateId || typeof data.appSettings.currentTemplateId !== 'string') {
      return { isValid: false, error: 'Неверный формат текущего шаблона' };
    }
    
    if (!data.appSettings.templates || typeof data.appSettings.templates !== 'object') {
      return { isValid: false, error: 'Неверный формат шаблонов' };
    }
  }
  
  if (data.calendarData && typeof data.calendarData !== 'object') {
    return { isValid: false, error: 'Неверный формат данных календаря' };
  }
  
  return { isValid: true };
}

// Обработка миграции данных при импорте
function processDataMigration(data) {
  try {
    if (data.appSettings) {
      return data.appSettings;
    } else if (data.calendarData) {
      const currentTemplate = getCurrentTemplate();
      const migratedData = {
        currentTemplateId: 'default',
        templates: {
          'default': {
            ...currentTemplate,
            calendarData: { ...data.calendarData }
          }
        }
      };
      return migratedData;
    }
    return null;
  } catch (error) {
    console.error('Ошибка миграции данных:', error);
    throw new Error('Ошибка обработки данных импорта');
  }
}

// Копирование данных в буфер обмена
function copyDataToClipboard() {
  try {
    const data = {
      appSettings: appSettings,
      exportDate: new Date().toISOString(),
      version: '1.3'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopyToClipboard(jsonString);
      return;
    }
    
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        showNotification('Данные скопированы в буфер обмена');
        closeModal();
      })
      .catch(err => {
        console.error('Ошибка копирования: ', err);
        fallbackCopyToClipboard(jsonString);
      });
  } catch (error) {
    console.error('Ошибка копирования данных:', error);
    showNotification('Не удалось скопировать данные');
  }
}

// Резервный метод копирования для старых браузеров
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      showNotification('Данные скопированы в буфер обмена');
      closeModal();
    } else {
      showNotification('Не удалось скопировать данные. Скопируйте текст вручную.');
      showManualCopyText(text);
    }
  } catch (error) {
    console.error('Ошибка резервного копирования:', error);
    showNotification('Не удалось скопировать данные. Скопируйте текст вручную.');
    showManualCopyText(text);
  }
}

// Показ текста для ручного копирования
function showManualCopyText(text) {
  const manualCopyModal = document.createElement('div');
  manualCopyModal.className = 'modal';
  manualCopyModal.style.display = 'block';
  manualCopyModal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <h3>Скопируйте данные вручную</h3>
      <textarea style="width: 100%; height: 200px; margin: 10px 0;">${text}</textarea>
      <button onclick="this.parentElement.parentElement.remove()">Закрыть</button>
    </div>
  `;
  document.body.appendChild(manualCopyModal);
}

// Импорт данных из текстового поля
function importFromText() {
  try {
    const importTextInput = document.getElementById('import-text-input');
    if (!importTextInput) {
      showNotification('Элемент ввода не найден');
      return;
    }
    
    const jsonString = importTextInput.value.trim();
    
    if (!jsonString) {
      showNotification('Введите данные для импорта');
      return;
    }
    
    const data = JSON.parse(jsonString);
    
    const validation = validateImportedData(data);
    if (!validation.isValid) {
      showNotification('Ошибка импорта: ' + validation.error);
      return;
    }
    
    const migratedSettings = processDataMigration(data);
    if (!migratedSettings) {
      showNotification('Ошибка обработки данных импорта');
      return;
    }
    
    if (!migratedSettings.templates || typeof migratedSettings.templates !== 'object') {
      showNotification('Неверная структура данных шаблонов');
      return;
    }
    
    if (!saveToStorage('appSettings', migratedSettings)) {
      showNotification('Ошибка сохранения импортированных данных');
      return;
    }
    
    appSettings = migratedSettings;
    
    loadSettingsToForm();
    generateCalendar();
    showNotification('Данные импортированы');
    closeModal();
    
  } catch (error) {
    console.error('Ошибка импорта:', error);
    if (error instanceof SyntaxError) {
      showNotification('Ошибка импорта данных: неверный формат JSON');
    } else {
      showNotification('Ошибка импорта данных: ' + error.message);
    }
  }
}

// Принудительное обновление версии
async function forceUpdate() {
  try {
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
  } catch (error) {
    console.error('Ошибка принудительного обновления:', error);
    showNotification('Ошибка обновления приложения');
  }
}

// Экспорт данных
function exportData() {
  try {
    const data = {
      appSettings: appSettings,
      exportDate: new Date().toISOString(),
      version: '1.3'
    };
    
    const validation = validateImportedData(data);
    if (!validation.isValid) {
      showNotification('Ошибка экспорта: неверная структура данных');
      return;
    }
    
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
  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    showNotification('Ошибка экспорта данных');
  }
}

// Импорт данных из файла
function importData(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showNotification('Выберите файл в формате JSON');
      event.target.value = '';
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Файл слишком большой (макс. 10MB)');
      event.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        const validation = validateImportedData(data);
        if (!validation.isValid) {
          showNotification('Ошибка импорта: ' + validation.error);
          return;
        }
        
        const migratedSettings = processDataMigration(data);
        if (!migratedSettings) {
          showNotification('Ошибка обработки данных импорта');
          return;
        }
        
        if (!migratedSettings.templates || typeof migratedSettings.templates !== 'object') {
          showNotification('Неверная структура данных шаблонов');
          return;
        }
        
        if (!saveToStorage('appSettings', migratedSettings)) {
          showNotification('Ошибка сохранения импортированных данных');
          return;
        }
        
        appSettings = migratedSettings;
        
        loadSettingsToForm();
        generateCalendar();
        showNotification('Данные импортированы');
        
      } catch (error) {
        console.error('Ошибка импорта:', error);
        if (error instanceof SyntaxError) {
          showNotification('Ошибка импорта данных: неверный формат файла');
        } else {
          showNotification('Ошибка импорта данных: ' + error.message);
        }
      }
    };
    
    reader.onerror = function() {
      showNotification('Ошибка чтения файла');
    };
    
    reader.readAsText(file);
    event.target.value = '';
    closeModal();
  } catch (error) {
    console.error('Ошибка импорта файла:', error);
    showNotification('Ошибка импорта файла');
  }
}

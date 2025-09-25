// Показать модальное окно шаблонов
function showTemplatesModal() {
    const modal = document.getElementById('templates-modal');
    const currentTemplate = getCurrentTemplate();
    
    document.getElementById('current-template-name').textContent = currentTemplate.name;
    
    showModal('templates-modal');
    
    setupTemplatesModalListeners();
    renderRuleBlocksList();
    
    // Генерируем поля для настройки ФО
    generateFunctionalBorderFields(currentTemplate);
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
    
    if (confirm('При переключении шаблона все несохраненные данные текущего шаблона будут потеряны. Продолжить?')) {
        appSettings.currentTemplateId = templateId;
        saveToStorage('appSettings', appSettings);
        loadSettingsToForm();
        generateCalendar();
        
        const template = getCurrentTemplate();
        document.getElementById('current-template-name').textContent = template.name;
        document.getElementById('template-dropdown').style.display = 'none';
        renderRuleBlocksList();
        generateFunctionalBorderFields(template);
        
        showNotification('Шаблон изменен: ' + template.name);
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
        ruleBlocks: [],
        functionalBorderData: {
            sales: 30000,
            dayShift: false,
            nightShift: false,
            dayHours: 0,
            nightHours: 0
        },
        calendarData: {}
    };
    
    appSettings.currentTemplateId = newTemplateId;
    saveToStorage('appSettings', appSettings);
    loadSettingsToForm();
    
    document.getElementById('current-template-name').textContent = newTemplateName.trim();
    document.getElementById('template-dropdown').style.display = 'none';
    renderRuleBlocksList();
    generateFunctionalBorderFields(appSettings.templates[newTemplateId]);
    
    // ОБНОВЛЯЕМ КАЛЕНДАРЬ ПРИ СОЗДАНИИ НОВОГО ШАБЛОНА
    generateCalendar();
    
    showNotification('Создан новый шаблон: ' + newTemplateName.trim());
}

// Показать выпадающий список для добавления блока правил
function showAddRuleBlockDropdown() {
    const currentTemplate = getCurrentTemplate();
    const existingBlockTypes = currentTemplate.ruleBlocks.map(block => block.type);
    
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

    // Фильтруем блоки: скрываем уже добавленные, кроме бонусов и вычетов
    const availableBlockTypes = blockTypes.filter(blockType => {
        if (blockType.type === 'bonus' || blockType.type === 'fixedDeduction') {
            return true; // Бонусы и вычеты можно добавлять несколько раз
        }
        return !existingBlockTypes.includes(blockType.type);
    });

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

    if (availableBlockTypes.length === 0) {
        const message = document.createElement('div');
        message.style.padding = '8px';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        message.textContent = 'Все блоки уже добавлены';
        dropdown.appendChild(message);
    } else {
        availableBlockTypes.forEach(blockType => {
            const option = document.createElement('div');
            option.style.padding = '8px';
            option.style.cursor = 'pointer';
            option.textContent = blockType.name;
            option.addEventListener('click', () => {
                addRuleBlock(blockType.type);
                // Закрываем выпадающий список после выбора
                if (dropdown.parentNode === document.body) {
                    document.body.removeChild(dropdown);
                }
                document.removeEventListener('click', closeDropdown);
            });
            option.addEventListener('mouseover', () => {
                option.style.backgroundColor = '#f0f0f0';
            });
            option.addEventListener('mouseout', () => {
                option.style.backgroundColor = 'transparent';
            });
            dropdown.appendChild(option);
        });
    }

    document.body.appendChild(dropdown);

    const closeDropdown = (e) => {
        if (!dropdown.contains(e.target) && e.target !== document.getElementById('add-rule-block')) {
            if (dropdown.parentNode === document.body) {
                document.body.removeChild(dropdown);
            }
            document.removeEventListener('click', closeDropdown);
        }
    };

    // Используем capture phase чтобы обработать клик до того как он дойдет до других элементов
    document.addEventListener('click', closeDropdown, true);
}

// Добавление блока правил
function addRuleBlock(blockType) {
    const currentTemplate = getCurrentTemplate();
    
    // Проверка на уже существующий блок (кроме бонусов и вычетов)
    if (blockType !== 'bonus' && blockType !== 'fixedDeduction') {
        if (currentTemplate.ruleBlocks.some(block => block.type === blockType)) {
            showNotification('Блок такого типа уже существует в шаблоне');
            return;
        }
    }
    
    if (hasConflict({ type: blockType }, currentTemplate.ruleBlocks)) {
        showNotification('Нельзя добавить конфликтующий блок правил');
        return;
    }
    
    const newBlock = createRuleBlock(blockType);
    currentTemplate.ruleBlocks.push(newBlock);
    
    saveToStorage('appSettings', appSettings);
    renderRuleBlocksList();
    generateFunctionalBorderFields(currentTemplate);
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
    generateFunctionalBorderFields(currentTemplate);
    showNotification('Блок правил удален');
}

// Преобразование camelCase в kebab-case
function camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

// Редактирование блока правил
function editRuleBlock(block, index) {
    const modalId = camelToKebab(block.type) + '-modal';
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        showNotification('Редактирование этого типа блока еще не реализовано');
        return;
    }
    
    setupBlockModal(modal, block, index);
    showModal(modalId);
}

// Настройка модального окна блока
function setupBlockModal(modal, block, index) {
    const closeButtons = modal.querySelectorAll('.close, .close-block-modal');
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            closeModal();
        };
    });
    
    modal.querySelector('.modal-content').onclick = (e) => e.stopPropagation();
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
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
    
    // Валидация блока перед сохранением
    let isValid = true;
    switch (block.type) {
        case 'salesPercent':
            isValid = validateRanges(block.ranges);
            if (!isValid) showNotification('Ошибка валидации: некорректные диапазоны процента с продаж');
            break;
        case 'shiftRate':
            isValid = validateRanges(block.dayRanges) && validateRanges(block.nightRanges);
            if (!isValid) showNotification('Ошибка валидации: некорректные диапазоны ставки за смену');
            break;
        case 'hourlyRate':
            isValid = validateRanges(block.dayRanges) && validateRanges(block.nightRanges);
            if (!isValid) showNotification('Ошибка валидации: некорректные диапазоны ставки за час');
            break;
        case 'advance':
            isValid = validateAdvance(block);
            if (!isValid) showNotification('Ошибка валидации: некорректные параметры аванса');
            break;
        case 'tax':
            isValid = validateTax(block);
            if (!isValid) showNotification('Ошибка валидации: некорректные параметры налога');
            break;
        case 'bonus':
            isValid = validateBonus(block);
            if (!isValid) showNotification('Ошибка валидации: некорректная сумма бонуса');
            break;
        case 'overtime':
            isValid = validateOvertime(block);
            if (!isValid) showNotification('Ошибка валидации: некорректные параметры сверхурочных');
            break;
        case 'fixedDeduction':
            isValid = validateFixedDeduction(block);
            if (!isValid) showNotification('Ошибка валидации: некорректная сумма вычета');
            break;
    }
    
    if (!isValid) {
        return false;
    }
    
    // Обновление данных блока из модального окна
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
    
    closeModal();
    generateFunctionalBorderFields(currentTemplate);
    showNotification('Изменения блока сохранены');
    return true;
}

// Настройка модального окна для процента с продаж
function setupSalesPercentModal(modal, block) {
    const rangesContainer = modal.querySelector('#sales-percent-ranges');
    rangesContainer.innerHTML = '';
    
    block.ranges.forEach((range, rangeIndex) => {
        const rangeElement = createRangeElement(range, rangeIndex, 'percent', block.ranges);
        rangesContainer.appendChild(rangeElement);
    });
    
    modal.querySelector('#add-sales-range').onclick = () => {
        const newRange = { from: 0, to: null, percent: 7 };
        block.ranges.push(newRange);
        const rangeElement = createRangeElement(newRange, block.ranges.length - 1, 'percent', block.ranges);
        rangesContainer.appendChild(rangeElement);
    };
}

// Создание элемента диапазона
function createRangeElement(range, index, type, rangesArray) {
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
        rangesArray.splice(index, 1);
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
        showNotification('Диапазоны не должны пересекаться и должны покрывать все значения от 0');
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
    
    const rangesArray = block[type + 'Ranges'];
    
    rangesArray.forEach((range, rangeIndex) => {
        const rangeElement = createRangeElement(range, rangeIndex, 'rate', rangesArray);
        rangesContainer.appendChild(rangeElement);
    });
    
    modal.querySelector('#' + addButtonId).onclick = () => {
        const newRange = { from: 0, to: null, rate: 1000 };
        rangesArray.push(newRange);
        const rangeElement = createRangeElement(newRange, rangesArray.length - 1, 'rate', rangesArray);
        rangesContainer.appendChild(rangeElement);
    };
}

// Сохранение изменений ставки за смену
function saveShiftRateChanges(modal, block) {
    if (!validateRanges(block.dayRanges) || !validateRanges(block.nightRanges)) {
        showNotification('Диапазоны не должны пересекаться и должны покрывать все значения от 0');
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
        showNotification('Диапазоны не должны пересекаться и должны покрывать все значения от 0');
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
    const valueInput = modal.querySelector(block.advanceType === 'fixed' ? '#advance-fixed' : '#advance-percent');
    block.value = parseFloat(valueInput.value) || 0;
    
    if (!validateAdvance(block)) {
        showNotification('Некорректные параметры аванса');
        return false;
    }
    
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
    block.taxPercent = parseFloat(modal.querySelector('#tax-percent').value) || 0;
    if (block.taxSource === 'fixed') {
        block.fixedAmount = parseFloat(modal.querySelector('#tax-fixed').value) || 0;
    }
    
    if (!validateTax(block)) {
        showNotification('Некорректные параметры налога');
        return false;
    }
    
    return true;
}

// Настройка модального окна для бонуса
function setupBonusModal(modal, block) {
    modal.querySelector('#bonus-amount').value = block.amount;
}

// Сохранение изменений бонуса
function saveBonusChanges(modal, block) {
    block.amount = parseFloat(modal.querySelector('#bonus-amount').value) || 0;
    
    if (!validateBonus(block)) {
        showNotification('Некорректная сумма бонуса');
        return false;
    }
    
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
    block.limit = parseFloat(modal.querySelector('#overtime-limit').value) || 0;
    block.multiplier = parseFloat(modal.querySelector('#overtime-multiplier').value) || 1.5;
    
    if (!validateOvertime(block)) {
        showNotification('Некорректные параметры сверхурочных');
        return false;
    }
    
    return true;
}

// Настройка модального окна для фиксированного вычета
function setupFixedDeductionModal(modal, block) {
    modal.querySelector('#deduction-amount').value = block.amount;
}

// Сохранение изменений фиксированного вычета
function saveFixedDeductionChanges(modal, block) {
    block.amount = parseFloat(modal.querySelector('#deduction-amount').value) || 0;
    
    if (!validateFixedDeduction(block)) {
        showNotification('Некорректная сумма вычета');
        return false;
    }
    
    return true;
}

// Сохранение изменений шаблона
function saveTemplateChanges() {
    const template = getCurrentTemplate();
    
    // Обновляем настройки ФО из формы в модальном окне шаблонов
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    if (hasSalesPercent) {
        template.functionalBorderData.sales = parseInt(document.getElementById('functional-border-sales').value) || 30000;
    }
    
    if (hasShiftRate) {
        template.functionalBorderData.dayShift = document.getElementById('functional-border-day-shift')?.checked || false;
        const nightCheckbox = document.getElementById('functional-border-night-shift');
        if (nightCheckbox) {
            template.functionalBorderData.nightShift = nightCheckbox.checked;
        }
    }
    
    if (hasHourlyRate) {
        template.functionalBorderData.dayHours = parseFloat(document.getElementById('functional-border-day-hours').value) || 0;
        const nightHoursInput = document.getElementById('functional-border-night-hours');
        if (nightHoursInput) {
            template.functionalBorderData.nightHours = parseFloat(nightHoursInput.value) || 0;
        }
    }
    
    saveToStorage('appSettings', appSettings);
    closeModal();
    showNotification('Изменения шаблона сохранены');
}

// Генерация полей для настройки функциональной обводки
function generateFunctionalBorderFields(template) {
    const container = document.getElementById('functional-border-container');
    if (!container) return;
    
    // Очищаем только содержимое, сохраняя заголовок
    const existingContent = container.innerHTML;
    const titleMatch = existingContent.match(/<h4[^>]*>.*?<\/h4>/);
    const title = titleMatch ? titleMatch[0] : '<h4>Настройка функциональной обводки</h4>';
    
    container.innerHTML = title;
    
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    if (hasSalesPercent) {
        const salesGroup = document.createElement('div');
        salesGroup.className = 'setting-group';
        salesGroup.innerHTML = `
            <label>Значение продаж для обводки (руб):</label>
            <input type="number" id="functional-border-sales" value="${template.functionalBorderData.sales || 30000}" min="0" step="1000">
        `;
        container.appendChild(salesGroup);
    }
    
    if (hasShiftRate) {
        const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
        const hasNightShifts = shiftBlock && shiftBlock.nightRanges && shiftBlock.nightRanges.length > 0;
        
        const shiftGroup = document.createElement('div');
        shiftGroup.className = 'setting-group';
        shiftGroup.innerHTML = `
            <label style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="functional-border-day-shift" ${template.functionalBorderData.dayShift ? 'checked' : ''}>
                Дневная смена
            </label>
            ${hasNightShifts ? `
            <label style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <input type="checkbox" id="functional-border-night-shift" ${template.functionalBorderData.nightShift ? 'checked' : ''}>
                Ночная смена
            </label>
            ` : ''}
        `;
        container.appendChild(shiftGroup);
    }
    
    if (hasHourlyRate) {
        const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
        const hasNightHours = hourlyBlock && hourlyBlock.nightRanges && hourlyBlock.nightRanges.length > 0;
        
        const hoursGroup = document.createElement('div');
        hoursGroup.className = 'setting-group';
        hoursGroup.innerHTML = `
            <label>Дневные часы для обводки:</label>
            <input type="number" id="functional-border-day-hours" value="${template.functionalBorderData.dayHours || 0}" min="0" step="0.5">
            ${hasNightHours ? `
            <label style="margin-top: 10px;">Ночные часы для обводки:</label>
            <input type="number" id="functional-border-night-hours" value="${template.functionalBorderData.nightHours || 0}" min="0" step="0.5">
            ` : ''}
        `;
        container.appendChild(hoursGroup);
    }
    
    // Если нет активных блоков, отображаем сообщение
    if (!hasSalesPercent && !hasShiftRate && !hasHourlyRate) {
        const message = document.createElement('div');
        message.style.padding = '10px';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        message.textContent = 'Добавьте блоки правил для настройки функциональной обводки';
        container.appendChild(message);
    }
}

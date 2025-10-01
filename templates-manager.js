
// FILE: templates-manager.js
// Показать модальное окно шаблонов
function showTemplatesModal() {
    try {
        const modal = document.getElementById('templates-modal');
        const currentTemplate = getCurrentTemplate();
        
        if (!modal) {
            console.error('Templates modal not found');
            return;
        }
        
        const currentTemplateName = document.getElementById('current-template-name');
        if (currentTemplateName) {
            currentTemplateName.textContent = currentTemplate.name;
        }
        
        showModal('templates-modal');
        
        setupTemplatesModalListeners();
        renderRuleBlocksList();
        
        generateFunctionalBorderFields(currentTemplate);
    } catch (error) {
        console.error('Ошибка показа модального окна шаблонов:', error);
        showNotification('Ошибка открытия шаблонов');
    }
}

// Настройка обработчиков для модального окна шаблонов
function setupTemplatesModalListeners() {
    try {
        const closeButton = document.querySelector('#templates-modal .close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeModal();
                generateCalendar();
            });
        }
        
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                    generateCalendar();
                }
            });
        }
        
        const editNameButton = document.getElementById('edit-template-name');
        if (editNameButton) {
            editNameButton.addEventListener('click', showEditTemplateNameModal);
        }
        
        const currentTemplateName = document.getElementById('current-template-name');
        if (currentTemplateName) {
            currentTemplateName.addEventListener('click', showTemplatesDropdown);
        }
        
        const addRuleBlockButton = document.getElementById('add-rule-block');
        if (addRuleBlockButton) {
            addRuleBlockButton.addEventListener('click', showAddRuleBlockDropdown);
        }
        
        const saveButton = document.getElementById('save-template-changes');
        if (saveButton) {
            saveButton.addEventListener('click', saveTemplateChanges);
        }
        
        const cancelButton = document.getElementById('cancel-template-changes');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                closeModal();
                generateCalendar();
            });
        }
        
        // Обработчики для новых модальных окон
        const saveTemplateNameButton = document.getElementById('save-template-name');
        if (saveTemplateNameButton) {
            saveTemplateNameButton.addEventListener('click', saveTemplateName);
        }
        
        const cancelTemplateNameButton = document.getElementById('cancel-template-name');
        if (cancelTemplateNameButton) {
            cancelTemplateNameButton.addEventListener('click', function() {
                closeModal();
                showModal('templates-modal');
            });
        }
        
        const createTemplateButton = document.getElementById('create-template');
        if (createTemplateButton) {
            createTemplateButton.addEventListener('click', createNewTemplateFromModal);
        }
        
        const cancelCreateTemplateButton = document.getElementById('cancel-create-template');
        if (cancelCreateTemplateButton) {
            cancelCreateTemplateButton.addEventListener('click', function() {
                closeModal();
                showModal('templates-modal');
            });
        }
    } catch (error) {
        console.error('Ошибка настройки обработчиков шаблонов:', error);
    }
}

// Показать модальное окно редактирования названия шаблона
function showEditTemplateNameModal() {
    try {
        const currentTemplate = getCurrentTemplate();
        const input = document.getElementById('edit-template-name-input');
        if (input) {
            input.value = currentTemplate.name;
        }
        showModal('edit-template-name-modal');
    } catch (error) {
        console.error('Ошибка показа модального окна редактирования названия:', error);
    }
}

// Сохранение названия шаблона
function saveTemplateName() {
    try {
        const input = document.getElementById('edit-template-name-input');
        if (!input || !input.value.trim()) {
            showNotification('Введите название шаблона');
            return;
        }
        
        const currentTemplate = getCurrentTemplate();
        currentTemplate.name = input.value.trim();
        
        const currentTemplateName = document.getElementById('current-template-name');
        if (currentTemplateName) {
            currentTemplateName.textContent = currentTemplate.name;
        }
        
        saveToStorage('appSettings', appSettings);
        closeModal();
        showModal('templates-modal');
        showNotification('Название шаблона изменено');
    } catch (error) {
        console.error('Ошибка сохранения названия шаблона:', error);
        showNotification('Ошибка изменения названия шаблона');
    }
}

// Показать выпадающий список шаблонов
function showTemplatesDropdown() {
    try {
        const dropdown = document.getElementById('template-dropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        
        Object.values(appSettings.templates).forEach(template => {
            const option = document.createElement('div');
            option.style.padding = '10px';
            option.style.cursor = 'pointer';
            option.style.display = 'flex';
            option.style.justifyContent = 'space-between';
            option.style.alignItems = 'center';
            
            const templateName = document.createElement('span');
            templateName.textContent = template.name;
            
            const deleteIcon = document.createElement('span');
            deleteIcon.textContent = '🗑️';
            deleteIcon.style.marginLeft = '10px';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.style.opacity = '0.7';
            
            // Не показывать иконку удаления для основного шаблона
            if (template.id !== 'default') {
                deleteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTemplate(template.id);
                });
            } else {
                deleteIcon.style.visibility = 'hidden';
            }
            
            option.appendChild(templateName);
            option.appendChild(deleteIcon);
            
            option.addEventListener('click', () => switchTemplate(template.id));
            dropdown.appendChild(option);
        });
        
        const newTemplateOption = document.createElement('div');
        newTemplateOption.style.padding = '10px';
        newTemplateOption.style.cursor = 'pointer';
        newTemplateOption.style.fontWeight = 'bold';
        newTemplateOption.textContent = 'Новый шаблон';
        newTemplateOption.addEventListener('click', showCreateTemplateModal);
        dropdown.appendChild(newTemplateOption);
        
        // Получаем ширину кнопки "Основной" и замораживаем её
        const mainTemplateWidth = getMainTemplateButtonWidth();
        
        // Получаем модальное окно и его центр
        const modal = document.getElementById('templates-modal');
        const modalRect = modal.getBoundingClientRect();
        const modalCenter = modalRect.left + modalRect.width / 2;
        const leftPosition = modalCenter - mainTemplateWidth / 2;
        
        // Получаем кнопку, которая открыла dropdown
        const currentTemplateNameElement = document.getElementById('current-template-name');
        const currentTemplateNameRect = currentTemplateNameElement.getBoundingClientRect();
        
        // Устанавливаем позиционирование
        dropdown.style.position = 'fixed';
        dropdown.style.top = (currentTemplateNameRect.bottom + window.scrollY) + 'px';
        dropdown.style.left = leftPosition + 'px';
        dropdown.style.display = 'block';
        dropdown.style.width = mainTemplateWidth + 'px';
        
        const clickHandler = function(e) {
            if (!dropdown.contains(e.target) && e.target !== document.getElementById('current-template-name')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', clickHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', clickHandler);
        }, 0);
    } catch (error) {
        console.error('Ошибка показа выпадающего списка шаблонов:', error);
    }
}

// Удаление шаблона
function deleteTemplate(templateId) {
    try {
        // Нельзя удалить основной шаблон
        if (templateId === 'default') {
            showNotification('Нельзя удалить основной шаблон');
            return;
        }

        // Нельзя удалить, если это последний шаблон
        const templateCount = Object.keys(appSettings.templates).length;
        if (templateCount <= 1) {
            showNotification('Должен остаться хотя бы один шаблон');
            return;
        }

        const templateName = appSettings.templates[templateId].name;
        
        showConfirmModal(
            'Удаление шаблона',
            `Вы уверены, что хотите удалить шаблон "${templateName}"? Это действие нельзя отменить.`,
            () => {
                // Удаляем шаблон
                delete appSettings.templates[templateId];

                // Если удаленный шаблон был текущим, переключаемся на основной
                if (appSettings.currentTemplateId === templateId) {
                    appSettings.currentTemplateId = 'default';
                }

                saveToStorage('appSettings', appSettings);

                // Обновляем интерфейс
                generateCalendar();

                // Закрываем выпадающий список
                const dropdown = document.getElementById('template-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }

                // Обновляем модальное окно шаблонов, если оно открыто
                const templatesModal = document.getElementById('templates-modal');
                if (templatesModal && templatesModal.style.display === 'block') {
                    const currentTemplate = getCurrentTemplate();
                    const currentTemplateNameElement = document.getElementById('current-template-name');
                    if (currentTemplateNameElement) {
                        currentTemplateNameElement.textContent = currentTemplate.name;
                    }
                    renderRuleBlocksList();
                    generateFunctionalBorderFields(currentTemplate);
                }

                showNotification(`Шаблон "${templateName}" удален`);
            }
        );
    } catch (error) {
        console.error('Ошибка удаления шаблона:', error);
        showNotification('Ошибка удаления шаблона');
    }
}

// Получить ширину кнопки "Основной" и заморозить её
function getMainTemplateButtonWidth() {
    try {
        const currentTemplateNameElement = document.getElementById('current-template-name');
        if (!currentTemplateNameElement) return 200; // значение по умолчанию
        
        // Создаем временный элемент для измерения ширины текста "Основной"
        const tempElement = document.createElement('span');
        tempElement.textContent = 'Основной';
        tempElement.style.visibility = 'hidden';
        tempElement.style.position = 'absolute';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontSize = window.getComputedStyle(currentTemplateNameElement).fontSize;
        tempElement.style.fontFamily = window.getComputedStyle(currentTemplateNameElement).fontFamily;
        tempElement.style.fontWeight = window.getComputedStyle(currentTemplateNameElement).fontWeight;
        
        document.body.appendChild(tempElement);
        const width = tempElement.offsetWidth + 40; // добавляем отступы
        document.body.removeChild(tempElement);
        
        return Math.max(width, 200); // минимальная ширина 200px
    } catch (error) {
        console.error('Ошибка получения ширины кнопки:', error);
        return 200;
    }
}

// Показать модальное окно создания нового шаблона
function showCreateTemplateModal() {
    try {
        const input = document.getElementById('new-template-name-input');
        if (input) {
            input.value = '';
        }
        showModal('create-template-modal');
    } catch (error) {
        console.error('Ошибка показа модального окна создания шаблона:', error);
    }
}

// Создание нового шаблона из модального окна
function createNewTemplateFromModal() {
    try {
        const input = document.getElementById('new-template-name-input');
        if (!input || !input.value.trim()) {
            showNotification('Введите название нового шаблона');
            return;
        }
        
        const newTemplateName = input.value.trim();
        const newTemplateId = 'template_' + Date.now();
        const currentTemplate = getCurrentTemplate();
        
        appSettings.templates[newTemplateId] = {
            id: newTemplateId,
            name: newTemplateName,
            ruleBlocks: [],
            functionalBorderData: {
                sales: 30000,
                dayShift: false,
                nightShift: false,
                dayHours: 8,
                nightHours: 0
            },
            calendarData: {}
        };
        
        appSettings.currentTemplateId = newTemplateId;
        saveToStorage('appSettings', appSettings);
        
        const currentTemplateName = document.getElementById('current-template-name');
        if (currentTemplateName) {
            currentTemplateName.textContent = newTemplateName;
        }
        
        const dropdown = document.getElementById('template-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        renderRuleBlocksList();
        generateFunctionalBorderFields(appSettings.templates[newTemplateId]);
        
        generateCalendar();
        
        closeModal();
        showModal('templates-modal');
        showNotification('Создан новый шаблон: ' + newTemplateName);
    } catch (error) {
        console.error('Ошибка создания нового шаблона:', error);
        showNotification('Ошибка создания шаблона');
    }
}

// Переключение шаблона
function switchTemplate(templateId) {
    try {
        if (appSettings.currentTemplateId === templateId) return;
        
        appSettings.currentTemplateId = templateId;
        saveToStorage('appSettings', appSettings);
        generateCalendar();
        
        const template = getCurrentTemplate();
        const currentTemplateName = document.getElementById('current-template-name');
        if (currentTemplateName) {
            currentTemplateName.textContent = template.name;
        }
        
        const dropdown = document.getElementById('template-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        renderRuleBlocksList();
        generateFunctionalBorderFields(template);
        
        showNotification('Шаблон изменен: ' + template.name);
    } catch (error) {
        console.error('Ошибка переключения шаблона:', error);
        showNotification('Ошибка переключения шаблона');
    }
}

// Показать выпадающий список для добавления блоков правил
function showAddRuleBlockDropdown() {
    try {
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

        const availableBlockTypes = blockTypes.filter(blockType => {
            if (blockType.type === 'bonus' || blockType.type === 'fixedDeduction') {
                return true;
            }
            return !existingBlockTypes.includes(blockType.type);
        });

        const dropdown = document.createElement('div');
        dropdown.className = 'rule-block-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.border = '1px solid #e2e8f0';
        dropdown.style.borderRadius = '5px';
        dropdown.style.padding = '10px';
        dropdown.style.zIndex = '1000';
        dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        const addButton = document.getElementById('add-rule-block');
        if (!addButton) return;
        
        const addButtonRect = addButton.getBoundingClientRect();
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
            if (!dropdown.contains(e.target) && e.target !== addButton) {
                if (dropdown.parentNode === document.body) {
                    document.body.removeChild(dropdown);
                }
                document.removeEventListener('click', closeDropdown);
            }
        };

        document.addEventListener('click', closeDropdown, true);
    } catch (error) {
        console.error('Ошибка показа выпадающего списка блоков:', error);
        showNotification('Ошибка открытия списка блоков');
    }
}

// Добавление блока правил
function addRuleBlock(blockType) {
    try {
        const currentTemplate = getCurrentTemplate();
        
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
        
        // Инициализация значений функциональной обводки только если они еще не установлены
        if (blockType === 'salesPercent' && currentTemplate.functionalBorderData.sales === undefined) {
            currentTemplate.functionalBorderData.sales = 30000;
        }
        
        if (blockType === 'hourlyRate') {
            if (currentTemplate.functionalBorderData.dayHours === undefined) {
                currentTemplate.functionalBorderData.dayHours = 8;
            }
            if (currentTemplate.functionalBorderData.nightHours === undefined) {
                currentTemplate.functionalBorderData.nightHours = 0;
            }
        }
        
        saveToStorage('appSettings', appSettings);
        renderRuleBlocksList();
        generateFunctionalBorderFields(currentTemplate);
        showNotification('Блок правил добавлен: ' + getDefaultBlockName(blockType));
    } catch (error) {
        console.error('Ошибка добавления блока правил:', error);
        showNotification('Ошибка добавления блока');
    }
}

// Отображение списка блоков правил
function renderRuleBlocksList() {
    try {
        const listContainer = document.getElementById('rule-blocks-list');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        const currentTemplate = getCurrentTemplate();
        
        currentTemplate.ruleBlocks.forEach((block, index) => {
            const blockElement = document.createElement('div');
            blockElement.className = 'rule-block-item';
            
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
    } catch (error) {
        console.error('Ошибка отображения списка блоков:', error);
    }
}

// Удаление блока правил
function deleteRuleBlock(index) {
    try {
        const currentTemplate = getCurrentTemplate();
        if (index < 0 || index >= currentTemplate.ruleBlocks.length) {
            showNotification('Неверный индекс блока');
            return;
        }
        
        currentTemplate.ruleBlocks.splice(index, 1);
        
        saveToStorage('appSettings', appSettings);
        renderRuleBlocksList();
        generateFunctionalBorderFields(currentTemplate);
        showNotification('Блок правил удален');
    } catch (error) {
        console.error('Ошибка удаления блока правил:', error);
        showNotification('Ошибка удаления блока');
    }
}

// Преобразование camelCase в kebab-case
function camelToKebab(str) {
    try {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    } catch (error) {
        console.error('Ошибка преобразования имени:', error);
        return str;
    }
}

// Редактирование блока правил
function editRuleBlock(block, index) {
    try {
        const modalId = camelToKebab(block.type) + '-modal';
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            showNotification('Редактирование этого типа блока еще не реализовано');
            return;
        }
        
        setupBlockModal(modal, block, index);
        showModal(modalId);
    } catch (error) {
        console.error('Ошибка редактирования блока правил:', error);
        showNotification('Ошибка открытия редактора блока');
    }
}

// Настройка модального окна блока
function setupBlockModal(modal, block, index) {
    try {
        const closeButtons = modal.querySelectorAll('.close, .close-block-modal');
        closeButtons.forEach(btn => {
            btn.onclick = () => {
                closeModal();
                showModal('templates-modal');
            };
        });
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.onclick = (e) => e.stopPropagation();
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
                showModal('templates-modal');
            }
        };
        
        const saveButton = modal.querySelector('button[id^="save-"]');
        if (saveButton) {
            saveButton.onclick = () => {
                if (saveBlockChanges(modal, block, index)) {
                    closeModal();
                    showModal('templates-modal');
                }
            };
        }
        
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
    } catch (error) {
        console.error('Ошибка настройки модального окна блока:', error);
    }
}

// Сохранение изменений блока
function saveBlockChanges(modal, block, index) {
    try {
        const currentTemplate = getCurrentTemplate();
        
        let isValid = true;
        let errorMessage = '';
        
        switch (block.type) {
            case 'salesPercent':
                isValid = validateRanges(block.ranges);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные диапазоны процента с продаж';
                break;
            case 'shiftRate':
                isValid = validateShiftRate(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные ставки за смену';
                break;
            case 'hourlyRate':
                isValid = validateHourlyRate(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные ставки за час';
                break;
            case 'advance':
                isValid = validateAdvance(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные параметры аванса';
                break;
            case 'tax':
                isValid = validateTax(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные параметры налога';
                break;
            case 'bonus':
                isValid = validateBonus(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректная сумма бонуса';
                break;
            case 'overtime':
                isValid = validateOvertime(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректные параметры сверхурочных';
                break;
            case 'fixedDeduction':
                isValid = validateFixedDeduction(block);
                if (!isValid) errorMessage = 'Ошибка валидации: некорректная сумма вычета';
                break;
        }
        
        if (!isValid) {
            showNotification(errorMessage);
            return false;
        }
        
        switch (block.type) {
            case 'salesPercent':
                if (!saveSalesPercentChanges(modal, block)) return false;
                break;
            case 'shiftRate':
                if (!saveShiftRateChanges(modal, block)) return false;
                break;
            case 'hourlyRate':
                if (!saveHourlyRateChanges(modal, block)) return false;
                break;
            case 'advance':
                if (!saveAdvanceChanges(modal, block)) return false;
                break;
            case 'tax':
                if (!saveTaxChanges(modal, block)) return false;
                break;
            case 'bonus':
                if (!saveBonusChanges(modal, block)) return false;
                break;
            case 'overtime':
                if (!saveOvertimeChanges(modal, block)) return false;
                break;
            case 'fixedDeduction':
                if (!saveFixedDeductionChanges(modal, block)) return false;
                break;
        }
        
        currentTemplate.ruleBlocks[index] = block;
        saveToStorage('appSettings', appSettings);
        
        generateFunctionalBorderFields(currentTemplate);
        showNotification('Изменения блока сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения изменений блока:', error);
        showNotification('Ошибка сохранения блока');
        return false;
    }
}

// Настройка модального окна для процента с продаж
function setupSalesPercentModal(modal, block) {
    try {
        const rangesContainer = modal.querySelector('#sales-percent-ranges');
        if (!rangesContainer) return;
        
        rangesContainer.innerHTML = '';
        
        if (Array.isArray(block.ranges)) {
            block.ranges.forEach((range, rangeIndex) => {
                const rangeElement = createRangeElement(range, rangeIndex, 'percent', block.ranges);
                rangesContainer.appendChild(rangeElement);
            });
        }
        
        const addButton = modal.querySelector('#add-sales-range');
        if (addButton) {
            addButton.onclick = () => {
                const newRange = { from: 0, to: null, percent: 7 };
                if (!Array.isArray(block.ranges)) {
                    block.ranges = [];
                }
                block.ranges.push(newRange);
                const rangeElement = createRangeElement(newRange, block.ranges.length - 1, 'percent', block.ranges);
                rangesContainer.appendChild(rangeElement);
            };
        }
    } catch (error) {
        console.error('Ошибка настройки модального окна процента с продаж:', error);
    }
}

// Создание элемента диапазона
function createRangeElement(range, index, type, rangesArray) {
    try {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';
        
        const fromInput = document.createElement('input');
        fromInput.type = 'number';
        fromInput.min = '0';
        fromInput.value = range.from || 0;
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
        valueInput.value = range[type] || 0;
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
            if (Array.isArray(rangesArray)) {
                rangesArray.splice(index, 1);
            }
        });
        
        div.appendChild(fromInput);
        div.appendChild(toInput);
        div.appendChild(valueInput);
        div.appendChild(deleteButton);
        
        return div;
    } catch (error) {
        console.error('Ошибка создания элемента диапазона:', error);
        return document.createElement('div');
    }
}

// Сохранение изменений процента с продаж
function saveSalesPercentChanges(modal, block) {
    try {
        if (!validateRanges(block.ranges)) {
            showNotification('Диапазоны не должны пересекаться и должны покрывать все значения от 0');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Ошибка сохранения процента с продаж:', error);
        return false;
    }
}

// Настройка модального окна для ставки за смену
function setupShiftRateModal(modal, block) {
    try {
        const dayRateInput = modal.querySelector('#shift-rate-day');
        const nightRateInput = modal.querySelector('#shift-rate-night');
        
        if (dayRateInput) dayRateInput.value = block.dayRate || 1000;
        if (nightRateInput) nightRateInput.value = block.nightRate || 0;
    } catch (error) {
        console.error('Ошибка настройки модального окна ставки за смену:', error);
    }
}

// Сохранение изменений ставки за смену
function saveShiftRateChanges(modal, block) {
    try {
        const dayRateInput = modal.querySelector('#shift-rate-day');
        const nightRateInput = modal.querySelector('#shift-rate-night');
        
        if (!dayRateInput) return false;
        
        block.dayRate = parseFloat(dayRateInput.value) || 0;
        if (nightRateInput) {
            block.nightRate = parseFloat(nightRateInput.value) || 0;
        }
        
        if (!validateShiftRate(block)) {
            showNotification('Некорректные ставки за смену');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения ставки за смену:', error);
        return false;
    }
}

// Валидация ставки за смену
function validateShiftRate(block) {
    try {
        if (!block || typeof block !== 'object') return false;
        if (typeof block.dayRate !== 'number' || block.dayRate < 0) return false;
        if (block.nightRate !== undefined && (typeof block.nightRate !== 'number' || block.nightRate < 0)) return false;
        return true;
    } catch (error) {
        console.error('Ошибка валидации ставки за смену:', error);
        return false;
    }
}

// Настройка модального окна для ставки за час
function setupHourlyRateModal(modal, block) {
    try {
        const dayRateInput = modal.querySelector('#hourly-rate-day');
        const nightRateInput = modal.querySelector('#hourly-rate-night');
        
        if (dayRateInput) dayRateInput.value = block.dayRate || 150;
        if (nightRateInput) nightRateInput.value = block.nightRate || 0;
    } catch (error) {
        console.error('Ошибка настройки модального окна ставки за час:', error);
    }
}

// Сохранение изменений ставки за час
function saveHourlyRateChanges(modal, block) {
    try {
        const dayRateInput = modal.querySelector('#hourly-rate-day');
        const nightRateInput = modal.querySelector('#hourly-rate-night');
        
        if (!dayRateInput) return false;
        
        block.dayRate = parseFloat(dayRateInput.value) || 0;
        if (nightRateInput) {
            block.nightRate = parseFloat(nightRateInput.value) || 0;
        }
        
        if (!validateHourlyRate(block)) {
            showNotification('Некорректные ставки за час');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения ставки за час:', error);
        return false;
    }
}

// Валидация ставки за час
function validateHourlyRate(block) {
    try {
        if (!block || typeof block !== 'object') return false;
        if (typeof block.dayRate !== 'number' || block.dayRate < 0) return false;
        if (block.nightRate !== undefined && (typeof block.nightRate !== 'number' || block.nightRate < 0)) return false;
        return true;
    } catch (error) {
        console.error('Ошибка валидации ставки за час:', error);
        return false;
    }
}

// Настройка модального окна для аванса
function setupAdvanceModal(modal, block) {
    try {
        // Заменяем стандартный select на кастомные переключатели
        const advanceTypeSelect = modal.querySelector('#advance-type');
        if (advanceTypeSelect) {
            // Создаем контейнер для переключателей
            const modeSwitcher = document.createElement('div');
            modeSwitcher.className = 'mode-switcher';
            modeSwitcher.style.display = 'flex';
            modeSwitcher.style.gap = '10px';
            modeSwitcher.style.marginBottom = '15px';

            // Создаем переключатель для фиксированной суммы
            const fixedOption = document.createElement('button');
            fixedOption.className = 'mode-option period-option';
            fixedOption.textContent = 'Фиксированная сумма';
            fixedOption.dataset.mode = 'fixed';
            fixedOption.type = 'button';

            // Создаем переключатель для процента
            const percentOption = document.createElement('button');
            percentOption.className = 'mode-option period-option';
            percentOption.textContent = 'Процент от заработка';
            percentOption.dataset.mode = 'percent';
            percentOption.type = 'button';

            // Добавляем переключатели в контейнер
            modeSwitcher.appendChild(fixedOption);
            modeSwitcher.appendChild(percentOption);

            // Вставляем контейнер перед полем ввода фиксированной суммы
            const fixedContainer = modal.querySelector('#advance-fixed-container');
            if (fixedContainer) {
                fixedContainer.parentNode.insertBefore(modeSwitcher, fixedContainer);
            }

            // Удаляем старый select
            advanceTypeSelect.parentNode.removeChild(advanceTypeSelect);

            // Устанавливаем обработчики для переключателей
            fixedOption.addEventListener('click', () => {
                fixedOption.classList.add('active');
                percentOption.classList.remove('active');
                toggleAdvanceType('fixed');
            });

            percentOption.addEventListener('click', () => {
                percentOption.classList.add('active');
                fixedOption.classList.remove('active');
                toggleAdvanceType('percent');
            });

            // Устанавливаем активный переключатель в соответствии с текущим значением блока
            if (block.advanceType === 'fixed') {
                fixedOption.classList.add('active');
            } else {
                percentOption.classList.add('active');
            }
        }

        const advanceFixedInput = modal.querySelector('#advance-fixed');
        const advancePercentInput = modal.querySelector('#advance-percent');
        
        if (advanceFixedInput) advanceFixedInput.value = block.value || 0;
        if (advancePercentInput) advancePercentInput.value = block.value || 0;
        
        toggleAdvanceType(block.advanceType);
    } catch (error) {
        console.error('Ошибка настройки модального окна аванса:', error);
    }
}

function toggleAdvanceType(type) {
    try {
        const fixedContainer = document.getElementById('advance-fixed-container');
        const percentContainer = document.getElementById('advance-percent-container');
        
        if (fixedContainer) fixedContainer.style.display = type === 'fixed' ? 'block' : 'none';
        if (percentContainer) percentContainer.style.display = type === 'percent' ? 'block' : 'none';
    } catch (error) {
        console.error('Ошибка переключения типа аванса:', error);
    }
}

// Сохранение изменений аванса
function saveAdvanceChanges(modal, block) {
    try {
        // Получаем выбранный режим из переключателей
        const activeMode = modal.querySelector('.mode-option.active');
        if (!activeMode) return false;
        
        block.advanceType = activeMode.dataset.mode;
        const valueInput = modal.querySelector(block.advanceType === 'fixed' ? '#advance-fixed' : '#advance-percent');
        
        if (valueInput) {
            block.value = parseFloat(valueInput.value) || 0;
        }
        
        if (!validateAdvance(block)) {
            showNotification('Некорректные параметры аванса');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения аванса:', error);
        return false;
    }
}

// Настройка модального окна для налога
function setupTaxModal(modal, block) {
    try {
        // Заменяем стандартный select на кастомные переключатели
        const taxSourceSelect = modal.querySelector('#tax-source');
        if (taxSourceSelect) {
            // Создаем контейнер для переключателей
            const modeSwitcher = document.createElement('div');
            modeSwitcher.className = 'mode-switcher';
            modeSwitcher.style.display = 'flex';
            modeSwitcher.style.gap = '10px';
            modeSwitcher.style.marginBottom = '15px';

            // Создаем переключатель для всего заработка
            const totalOption = document.createElement('button');
            totalOption.className = 'mode-option period-option';
            totalOption.textContent = 'Со всего заработка';
            totalOption.dataset.mode = 'total';
            totalOption.type = 'button';

            // Создаем переключатель для фиксированной суммы
            const fixedOption = document.createElement('button');
            fixedOption.className = 'mode-option period-option';
            fixedOption.textContent = 'С фиксированной суммы';
            fixedOption.dataset.mode = 'fixed';
            fixedOption.type = 'button';

            // Добавляем переключатели в контейнер
            modeSwitcher.appendChild(totalOption);
            modeSwitcher.appendChild(fixedOption);

            // Вставляем контейнер перед полем ввода процента налога
            const taxPercentInput = modal.querySelector('#tax-percent');
            if (taxPercentInput) {
                taxPercentInput.parentNode.insertBefore(modeSwitcher, taxPercentInput);
            }

            // Удаляем старый select
            taxSourceSelect.parentNode.removeChild(taxSourceSelect);

            // Устанавливаем обработчики для переключателей
            totalOption.addEventListener('click', () => {
                totalOption.classList.add('active');
                fixedOption.classList.remove('active');
                toggleTaxSource('total');
            });

            fixedOption.addEventListener('click', () => {
                fixedOption.classList.add('active');
                totalOption.classList.remove('active');
                toggleTaxSource('fixed');
            });

            // Устанавливаем активный переключатель в соответствии с текущим значением блока
            if (block.taxSource === 'fixed') {
                fixedOption.classList.add('active');
            } else {
                totalOption.classList.add('active');
            }
        }

        const taxPercentInput = modal.querySelector('#tax-percent');
        const taxFixedInput = modal.querySelector('#tax-fixed');
        
        if (taxPercentInput) taxPercentInput.value = block.taxPercent || 0;
        if (taxFixedInput) taxFixedInput.value = block.fixedAmount || 0;
        
        toggleTaxSource(block.taxSource);
    } catch (error) {
        console.error('Ошибка настройки модального окна налога:', error);
    }
}

function toggleTaxSource(source) {
    try {
        const fixedContainer = document.getElementById('tax-fixed-container');
        if (fixedContainer) {
            fixedContainer.style.display = source === 'fixed' ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Ошибка переключения источника налога:', error);
    }
}

// Сохранение изменений налога
function saveTaxChanges(modal, block) {
    try {
        // Получаем выбранный режим из переключателей
        const activeMode = modal.querySelector('.mode-option.active');
        if (!activeMode) return false;
        
        block.taxSource = activeMode.dataset.mode;
        const taxPercentInput = modal.querySelector('#tax-percent');
        
        if (!taxPercentInput) return false;
        
        block.taxPercent = parseFloat(taxPercentInput.value) || 0;
        
        if (block.taxSource === 'fixed') {
            const taxFixedInput = modal.querySelector('#tax-fixed');
            if (taxFixedInput) {
                block.fixedAmount = parseFloat(taxFixedInput.value) || 0;
            }
        }
        
        if (!validateTax(block)) {
            showNotification('Некорректные параметры налога');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения налога:', error);
        return false;
    }
}

// Настройка модального окна для бонуса
function setupBonusModal(modal, block) {
    try {
        const bonusAmountInput = modal.querySelector('#bonus-amount');
        if (bonusAmountInput) {
            bonusAmountInput.value = block.amount || 0;
        }
    } catch (error) {
        console.error('Ошибка настройки модального окна бонуса:', error);
    }
}

// Сохранение изменений бонуса
function saveBonusChanges(modal, block) {
    try {
        const bonusAmountInput = modal.querySelector('#bonus-amount');
        if (!bonusAmountInput) return false;
        
        block.amount = parseFloat(bonusAmountInput.value) || 0;
        
        if (!validateBonus(block)) {
            showNotification('Некорректная сумма бонуса');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения бонуса:', error);
        return false;
    }
}

// Настройка модального окна для сверхурочных
function setupOvertimeModal(modal, block) {
    try {
        // Заменяем стандартный select на кастомные переключатели
        const overtimeTypeSelect = modal.querySelector('#overtime-type');
        if (overtimeTypeSelect) {
            // Создаем контейнер для переключателей
            const modeSwitcher = document.createElement('div');
            modeSwitcher.className = 'mode-switcher';
            modeSwitcher.style.display = 'flex';
            modeSwitcher.style.gap = '10px';
            modeSwitcher.style.marginBottom = '15px';

            // Создаем переключатель для смен
            const shiftsOption = document.createElement('button');
            shiftsOption.className = 'mode-option period-option';
            shiftsOption.textContent = 'Смены';
            shiftsOption.dataset.mode = 'shifts';
            shiftsOption.type = 'button';

            // Создаем переключатель для часов
            const hoursOption = document.createElement('button');
            hoursOption.className = 'mode-option period-option';
            hoursOption.textContent = 'Часы';
            hoursOption.dataset.mode = 'hours';
            hoursOption.type = 'button';

            // Добавляем переключатели в контейнер
            modeSwitcher.appendChild(shiftsOption);
            modeSwitcher.appendChild(hoursOption);

            // Вставляем контейнер перед полем ввода предела
            const overtimeLimitInput = modal.querySelector('#overtime-limit');
            if (overtimeLimitInput) {
                overtimeLimitInput.parentNode.insertBefore(modeSwitcher, overtimeLimitInput);
            }

            // Удаляем старый select
            overtimeTypeSelect.parentNode.removeChild(overtimeTypeSelect);

            // Устанавливаем обработчики для переключателей
            shiftsOption.addEventListener('click', () => {
                shiftsOption.classList.add('active');
                hoursOption.classList.remove('active');
            });

            hoursOption.addEventListener('click', () => {
                hoursOption.classList.add('active');
                shiftsOption.classList.remove('active');
            });

            // Устанавливаем активный переключатель в соответствии с текущим значением блока
            if (block.overtimeType === 'hours') {
                hoursOption.classList.add('active');
            } else {
                shiftsOption.classList.add('active');
            }
        }

        const overtimeLimitInput = modal.querySelector('#overtime-limit');
        const overtimeMultiplierInput = modal.querySelector('#overtime-multiplier');
        
        if (overtimeLimitInput) overtimeLimitInput.value = block.limit || 0;
        if (overtimeMultiplierInput) overtimeMultiplierInput.value = block.multiplier || 1.5;
    } catch (error) {
        console.error('Ошибка настройки модального окна сверхурочных:', error);
    }
}

// Сохранение изменений сверхурочных
function saveOvertimeChanges(modal, block) {
    try {
        // Получаем выбранный режим из переключателей
        const activeMode = modal.querySelector('.mode-option.active');
        if (!activeMode) return false;
        
        block.overtimeType = activeMode.dataset.mode;
        const overtimeLimitInput = modal.querySelector('#overtime-limit');
        const overtimeMultiplierInput = modal.querySelector('#overtime-multiplier');
        
        if (!overtimeLimitInput || !overtimeMultiplierInput) return false;
        
        block.limit = parseFloat(overtimeLimitInput.value) || 0;
        block.multiplier = parseFloat(overtimeMultiplierInput.value) || 1.5;
        
        if (!validateOvertime(block)) {
            showNotification('Некорректные параметры сверхурочных');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения сверхурочных:', error);
        return false;
    }
}

// Настройка модального окна для фиксированного вычета
function setupFixedDeductionModal(modal, block) {
    try {
        const deductionAmountInput = modal.querySelector('#deduction-amount');
        if (deductionAmountInput) {
            deductionAmountInput.value = block.amount || 0;
        }
    } catch (error) {
        console.error('Ошибка настройки модального окна вычета:', error);
    }
}

// Сохранение изменений фиксированного вычета
function saveFixedDeductionChanges(modal, block) {
    try {
        const deductionAmountInput = modal.querySelector('#deduction-amount');
        if (!deductionAmountInput) return false;
        
        block.amount = parseFloat(deductionAmountInput.value) || 0;
        
        if (!validateFixedDeduction(block)) {
            showNotification('Некорректная сумма вычета');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения вычета:', error);
        return false;
    }
}

// Сохранение изменений шаблона
function saveTemplateChanges() {
    try {
        const template = getCurrentTemplate();
        
        const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
        const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
        const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
        
        if (hasSalesPercent) {
            const salesInput = document.getElementById('functional-border-sales');
            if (salesInput) {
                const value = parseInt(salesInput.value);
                if (!isNaN(value)) {
                    template.functionalBorderData.sales = value;
                }
            }
        }
        
        if (hasShiftRate) {
            // Получаем состояние кастомных чекбоксов для функциональной обводки
            const dayShiftCheckbox = document.querySelector('#functional-border-container .custom-checkbox-container:first-child input[type="checkbox"]');
            if (dayShiftCheckbox) {
                template.functionalBorderData.dayShift = dayShiftCheckbox.checked;
            }
            
            const nightCheckbox = document.querySelector('#functional-border-container .custom-checkbox-container:last-child input[type="checkbox"]');
            if (nightCheckbox) {
                template.functionalBorderData.nightShift = nightCheckbox.checked;
            }
        }
        
        if (hasHourlyRate) {
            const dayHoursInput = document.getElementById('functional-border-day-hours');
            if (dayHoursInput) {
                const value = parseFloat(dayHoursInput.value);
                if (!isNaN(value)) {
                    template.functionalBorderData.dayHours = value;
                }
            }
            
            const nightHoursInput = document.getElementById('functional-border-night-hours');
            if (nightHoursInput) {
                const value = parseFloat(nightHoursInput.value);
                if (!isNaN(value)) {
                    template.functionalBorderData.nightHours = value;
                }
            }
        }
        
        saveToStorage('appSettings', appSettings);
        closeAllModals();
        generateCalendar();
        showNotification('Изменения шаблона сохранены');
    } catch (error) {
        console.error('Ошибка сохранения изменений шаблона:', error);
        showNotification('Ошибка сохранения шаблона');
    }
}

// Генерация полей для настройки функциональной обводки
function generateFunctionalBorderFields(template) {
    try {
        const container = document.getElementById('functional-border-container');
        if (!container) return;
        
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
            const label = document.createElement('label');
            label.textContent = 'Значение продаж для обводки (руб):';
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'functional-border-sales';
            input.value = template.functionalBorderData.sales !== undefined ? template.functionalBorderData.sales : 30000;
            input.min = 0;
            input.step = 1000;
            salesGroup.appendChild(label);
            salesGroup.appendChild(input);
            container.appendChild(salesGroup);
        }
        
        if (hasShiftRate) {
            const shiftGroup = document.createElement('div');
            shiftGroup.className = 'setting-group';
            
            // Кастомный чекбокс для дневной смены
            const dayShiftContainer = document.createElement('div');
            dayShiftContainer.className = 'custom-checkbox-container';
            dayShiftContainer.style.display = 'flex';
            dayShiftContainer.style.justifyContent = 'space-between';
            dayShiftContainer.style.alignItems = 'center';
            dayShiftContainer.style.marginBottom = '10px';
            
            const dayShiftLabel = document.createElement('label');
            dayShiftLabel.className = 'custom-checkbox-label';
            dayShiftLabel.textContent = 'Дневная смена';
            dayShiftLabel.style.flex = '1';
            dayShiftLabel.style.cursor = 'pointer';
            
            const dayShiftCheckbox = document.createElement('input');
            dayShiftCheckbox.type = 'checkbox';
            dayShiftCheckbox.style.display = 'none';
            if (template.functionalBorderData.dayShift !== undefined) {
                dayShiftCheckbox.checked = template.functionalBorderData.dayShift;
            } else {
                dayShiftCheckbox.checked = false;
            }
            
            const dayShiftCustom = document.createElement('div');
            dayShiftCustom.className = 'custom-checkbox';
            dayShiftCustom.style.width = '20px';
            dayShiftCustom.style.height = '20px';
            dayShiftCustom.style.border = '2px solid #4a6cf7';
            dayShiftCustom.style.borderRadius = '4px';
            dayShiftCustom.style.backgroundColor = dayShiftCheckbox.checked ? '#4a6cf7' : 'transparent';
            dayShiftCustom.style.position = 'relative';
            dayShiftCustom.style.marginLeft = '10px';
            dayShiftCustom.style.transition = 'all 0.2s ease';
            
            if (dayShiftCheckbox.checked) {
                const checkmark = document.createElement('div');
                checkmark.style.position = 'absolute';
                checkmark.style.left = '4px';
                checkmark.style.top = '1px';
                checkmark.style.width = '8px';
                checkmark.style.height = '12px';
                checkmark.style.border = 'solid white';
                checkmark.style.borderWidth = '0 2px 2px 0';
                checkmark.style.transform = 'rotate(45deg)';
                dayShiftCustom.appendChild(checkmark);
            }
            
            dayShiftLabel.appendChild(dayShiftCheckbox);
            dayShiftLabel.appendChild(dayShiftCustom);
            dayShiftContainer.appendChild(dayShiftLabel);
            
            dayShiftLabel.addEventListener('click', function(e) {
                e.preventDefault();
                dayShiftCheckbox.checked = !dayShiftCheckbox.checked;
                dayShiftCustom.style.backgroundColor = dayShiftCheckbox.checked ? '#4a6cf7' : 'transparent';
                
                if (dayShiftCheckbox.checked) {
                    if (!dayShiftCustom.querySelector('div')) {
                        const checkmark = document.createElement('div');
                        checkmark.style.position = 'absolute';
                        checkmark.style.left = '4px';
                        checkmark.style.top = '1px';
                        checkmark.style.width = '8px';
                        checkmark.style.height = '12px';
                        checkmark.style.border = 'solid white';
                        checkmark.style.borderWidth = '0 2px 2px 0';
                        checkmark.style.transform = 'rotate(45deg)';
                        dayShiftCustom.appendChild(checkmark);
                    }
                } else {
                    dayShiftCustom.innerHTML = '';
                }
            });
            
            shiftGroup.appendChild(dayShiftContainer);
            
            // Кастомный чекбокс для ночной смены
            const nightShiftContainer = document.createElement('div');
            nightShiftContainer.className = 'custom-checkbox-container';
            nightShiftContainer.style.display = 'flex';
            nightShiftContainer.style.justifyContent = 'space-between';
            nightShiftContainer.style.alignItems = 'center';
            
            const nightShiftLabel = document.createElement('label');
            nightShiftLabel.className = 'custom-checkbox-label';
            nightShiftLabel.textContent = 'Ночная смена';
            nightShiftLabel.style.flex = '1';
            nightShiftLabel.style.cursor = 'pointer';
            
            const nightShiftCheckbox = document.createElement('input');
            nightShiftCheckbox.type = 'checkbox';
            nightShiftCheckbox.style.display = 'none';
            if (template.functionalBorderData.nightShift !== undefined) {
                nightShiftCheckbox.checked = template.functionalBorderData.nightShift;
            } else {
                nightShiftCheckbox.checked = false;
            }
            
            const nightShiftCustom = document.createElement('div');
            nightShiftCustom.className = 'custom-checkbox';
            nightShiftCustom.style.width = '20px';
            nightShiftCustom.style.height = '20px';
            nightShiftCustom.style.border = '2px solid #4a6cf7';
            nightShiftCustom.style.borderRadius = '4px';
            nightShiftCustom.style.backgroundColor = nightShiftCheckbox.checked ? '#4a6cf7' : 'transparent';
            nightShiftCustom.style.position = 'relative';
            nightShiftCustom.style.marginLeft = '10px';
            nightShiftCustom.style.transition = 'all 0.2s ease';
            
            if (nightShiftCheckbox.checked) {
                const checkmark = document.createElement('div');
                checkmark.style.position = 'absolute';
                checkmark.style.left = '4px';
                checkmark.style.top = '1px';
                checkmark.style.width = '8px';
                checkmark.style.height = '12px';
                checkmark.style.border = 'solid white';
                checkmark.style.borderWidth = '0 2px 2px 0';
                checkmark.style.transform = 'rotate(45deg)';
                nightShiftCustom.appendChild(checkmark);
            }
            
            nightShiftLabel.appendChild(nightShiftCheckbox);
            nightShiftLabel.appendChild(nightShiftCustom);
            nightShiftContainer.appendChild(nightShiftLabel);
            
            nightShiftLabel.addEventListener('click', function(e) {
                e.preventDefault();
                nightShiftCheckbox.checked = !nightShiftCheckbox.checked;
                nightShiftCustom.style.backgroundColor = nightShiftCheckbox.checked ? '#4a6cf7' : 'transparent';
                
                if (nightShiftCheckbox.checked) {
                    if (!nightShiftCustom.querySelector('div')) {
                        const checkmark = document.createElement('div');
                        checkmark.style.position = 'absolute';
                        checkmark.style.left = '4px';
                        checkmark.style.top = '1px';
                        checkmark.style.width = '8px';
                        checkmark.style.height = '12px';
                        checkmark.style.border = 'solid white';
                        checkmark.style.borderWidth = '0 2px 2px 0';
                        checkmark.style.transform = 'rotate(45deg)';
                        nightShiftCustom.appendChild(checkmark);
                    }
                } else {
                    nightShiftCustom.innerHTML = '';
                }
            });
            
            shiftGroup.appendChild(nightShiftContainer);
            
            container.appendChild(shiftGroup);
        }
        
        if (hasHourlyRate) {
            const hoursGroup = document.createElement('div');
            hoursGroup.className = 'setting-group';
            
            const dayLabel = document.createElement('label');
            dayLabel.textContent = 'Дневные часы для обводки:';
            const dayInput = document.createElement('input');
            dayInput.type = 'number';
            dayInput.id = 'functional-border-day-hours';
            dayInput.value = template.functionalBorderData.dayHours !== undefined ? template.functionalBorderData.dayHours : 8;
            dayInput.min = 0;
            dayInput.step = 0.5;
            hoursGroup.appendChild(dayLabel);
            hoursGroup.appendChild(dayInput);
            
            const nightLabel = document.createElement('label');
            nightLabel.textContent = 'Ночные часы для обводки:';
            nightLabel.style.marginTop = '10px';
            const nightInput = document.createElement('input');
            nightInput.type = 'number';
            nightInput.id = 'functional-border-night-hours';
            nightInput.value = template.functionalBorderData.nightHours !== undefined ? template.functionalBorderData.nightHours : 0;
            nightInput.min = 0;
            nightInput.step = 0.5;
            hoursGroup.appendChild(nightLabel);
            hoursGroup.appendChild(nightInput);
            
            container.appendChild(hoursGroup);
        }
        
        if (!hasSalesPercent && !hasShiftRate && !hasHourlyRate) {
            const message = document.createElement('div');
            message.style.padding = '10px';
            message.style.textAlign = 'center';
            message.style.color = '#666';
            message.textContent = 'Добавьте блоки правил для настройки функциональной обводки';
            container.appendChild(message);
        }
    } catch (error) {
        console.error('Ошибка генерации полей функциональной обводки:', error);
    }
}



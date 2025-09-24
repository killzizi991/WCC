// Функции для работы с блоками правил и расчетов

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Расчет итогов за месяц
function calculateSummary(calendarData, currentYear, currentMonth, template) {
    const monthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let totalEarnedWithoutTax = 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales > 0) {
            workDays++;
            totalSales += dayData.sales;
            
            // Используем индивидуальные настройки дня или общие
            const dayPercent = dayData.customSalesPercent || template.salesPercent;
            const dayShiftRate = dayData.customShiftRate || template.shiftRate;
            
            totalEarnedWithoutTax += calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
        }
    }
    
    const tax = 25000 * 0.13; // Фиксированный вычет
    const totalEarned = totalEarnedWithoutTax - tax;
    const salary = totalEarned - template.advance;
    const balance = salary - template.fixedSalaryPart;
    
    return {
        workDays,
        totalSales,
        totalEarned,
        salary,
        balance
    };
}

// Обновление значений функциональных обводок
function updateFunctionalBorders(calendarData, newValue) {
    let updated = false;
    
    for (const dateKey in calendarData) {
        if (calendarData[dateKey].functionalBorder) {
            calendarData[dateKey].sales = newValue;
            calendarData[dateKey].functionalBorderValue = newValue;
            updated = true;
        }
    }
    
    return updated;
}

// Создание блока правил по типу
function createRuleBlock(blockType) {
    const defaultBlock = {
        id: 'block_' + Date.now(),
        type: blockType,
        name: getDefaultBlockName(blockType)
    };

    switch (blockType) {
        case 'salesPercent':
            return {
                ...defaultBlock,
                ranges: [{ from: 0, to: null, percent: 7 }]
            };
        case 'shiftRate':
            return {
                ...defaultBlock,
                dayRanges: [{ from: 0, to: null, rate: 1000 }],
                nightRanges: []
            };
        case 'hourlyRate':
            return {
                ...defaultBlock,
                dayRanges: [{ from: 0, to: null, rate: 150 }],
                nightRanges: []
            };
        case 'advance':
            return {
                ...defaultBlock,
                advanceType: 'fixed',
                value: 10875
            };
        case 'tax':
            return {
                ...defaultBlock,
                taxSource: 'total',
                taxPercent: 13,
                fixedAmount: 25000
            };
        case 'bonus':
            return {
                ...defaultBlock,
                amount: 0
            };
        case 'overtime':
            return {
                ...defaultBlock,
                overtimeType: 'shifts',
                limit: 20,
                multiplier: 1.5
            };
        case 'fixedDeduction':
            return {
                ...defaultBlock,
                amount: 0
            };
        default:
            return defaultBlock;
    }
}

// Проверка конфликтов между блоками
function hasConflict(newBlock, existingBlocks) {
    const conflictGroups = [
        ['shiftRate', 'hourlyRate']
    ];

    for (const group of conflictGroups) {
        if (group.includes(newBlock.type)) {
            for (const existingBlock of existingBlocks) {
                if (group.includes(existingBlock.type)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Валидация диапазонов
function validateRanges(ranges) {
    for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
            const rangeA = ranges[i];
            const rangeB = ranges[j];
            
            if (rangeA.to === null || rangeB.to === null) {
                continue;
            }
            
            if ((rangeA.from >= rangeB.from && rangeA.from <= rangeB.to) ||
                (rangeA.to >= rangeB.from && rangeA.to <= rangeB.to) ||
                (rangeB.from >= rangeA.from && rangeB.from <= rangeA.to) ||
                (rangeB.to >= rangeA.from && rangeB.to <= rangeA.to)) {
                return false;
            }
        }
    }
    return true;
}

// Получение названия блока по умолчанию
function getDefaultBlockName(blockType) {
    const names = {
        'salesPercent': 'Процент с продаж',
        'shiftRate': 'Ставка за смену',
        'hourlyRate': 'Ставка за час',
        'advance': 'Аванс',
        'tax': 'Налог',
        'bonus': 'Бонус',
        'overtime': 'Сверхурочные',
        'fixedDeduction': 'Фиксированный вычет'
    };
    return names[blockType] || 'Неизвестный блок';
}

// Функции для работы с блоками правил
function addRuleBlock(blockType) {
    console.log('Добавление блока правил типа:', blockType);
}

function validateRuleBlocks(ruleBlocks) {
    console.log('Валидация блоков правил');
    return true;
}

function calculateWithRuleBlocks(calendarData, template) {
    console.log('Расчет с блоками правил');
    return calculateSummary(calendarData, new Date().getFullYear(), new Date().getMonth(), template);
}

// Функции для работы с блоками правил и расчетов

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Нахождение подходящего диапазона для значения
function findRangeForValue(value, ranges) {
    if (!ranges || ranges.length === 0) return null;
    
    for (const range of ranges) {
        const from = range.from || 0;
        const to = range.to === null ? Infinity : range.to;
        
        if (value >= from && value < to) {
            return range;
        }
    }
    
    return null;
}

// Расчет дохода с продаж
function calculateSalesPercentIncome(calendarData, template, year, month) {
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const salesBlock = template.ruleBlocks.find(block => block.type === 'salesPercent');
    
    if (!salesBlock) return 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales && dayData.sales > 0) {
            const sales = dayData.sales;
            const range = findRangeForValue(sales, salesBlock.ranges);
            
            if (range) {
                const percent = dayData.customSalesPercent || range.percent;
                totalIncome += calculateEarnings(sales, percent);
            }
        }
    }
    
    return totalIncome;
}

// Расчет дохода за смены
function calculateShiftRateIncome(calendarData, template, year, month) {
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
    
    if (!shiftBlock) return 0;
    
    let dayShiftsCount = 0;
    let nightShiftsCount = 0;
    
    // Считаем общее количество смен за месяц
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.dayShift) dayShiftsCount++;
        if (dayData.nightShift) nightShiftsCount++;
    }
    
    // Применяем ставки для дневных смен
    if (shiftBlock.dayRanges && shiftBlock.dayRanges.length > 0) {
        const dayRange = findRangeForValue(dayShiftsCount, shiftBlock.dayRanges);
        if (dayRange) {
            totalIncome += dayShiftsCount * dayRange.rate;
        }
    }
    
    // Применяем ставки для ночных смен
    if (shiftBlock.nightRanges && shiftBlock.nightRanges.length > 0) {
        const nightRange = findRangeForValue(nightShiftsCount, shiftBlock.nightRanges);
        if (nightRange) {
            totalIncome += nightShiftsCount * nightRange.rate;
        }
    }
    
    return totalIncome;
}

// Расчет дохода за часы
function calculateHourlyRateIncome(calendarData, template, year, month) {
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
    
    if (!hourlyBlock) return 0;
    
    let totalDayHours = 0;
    let totalNightHours = 0;
    
    // Суммируем часы за месяц
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.dayHours) totalDayHours += dayData.dayHours;
        if (dayData.nightHours) totalNightHours += dayData.nightHours;
    }
    
    // Применяем ставки для дневных часов
    if (hourlyBlock.dayRanges && hourlyBlock.dayRanges.length > 0) {
        const dayRange = findRangeForValue(totalDayHours, hourlyBlock.dayRanges);
        if (dayRange) {
            totalIncome += totalDayHours * dayRange.rate;
        }
    }
    
    // Применяем ставки для ночных часов
    if (hourlyBlock.nightRanges && hourlyBlock.nightRanges.length > 0) {
        const nightRange = findRangeForValue(totalNightHours, hourlyBlock.nightRanges);
        if (nightRange) {
            totalIncome += totalNightHours * nightRange.rate;
        }
    }
    
    return totalIncome;
}

// Расчет сверхурочных
function calculateOvertimeAdjustment(calendarData, template, year, month, baseIncome) {
    const overtimeBlock = template.ruleBlocks.find(block => block.type === 'overtime');
    
    if (!overtimeBlock) return 0;
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let overtimeAmount = 0;
    
    if (overtimeBlock.overtimeType === 'shifts') {
        let totalShifts = 0;
        
        for (let day = 1; day <= monthDays; day++) {
            const dateKey = `${year}-${month+1}-${day}`;
            const dayData = calendarData[dateKey] || {};
            
            if (dayData.dayShift) totalShifts++;
            if (dayData.nightShift) totalShifts++;
        }
        
        if (totalShifts > overtimeBlock.limit) {
            const overtimeShifts = totalShifts - overtimeBlock.limit;
            // Используем среднюю ставку за смену для расчета сверхурочных
            const averageShiftRate = baseIncome / totalShifts;
            overtimeAmount = overtimeShifts * averageShiftRate * (overtimeBlock.multiplier - 1);
        }
    } else if (overtimeBlock.overtimeType === 'hours') {
        let totalHours = 0;
        
        for (let day = 1; day <= monthDays; day++) {
            const dateKey = `${year}-${month+1}-${day}`;
            const dayData = calendarData[dateKey] || {};
            
            if (dayData.dayHours) totalHours += dayData.dayHours;
            if (dayData.nightHours) totalHours += dayData.nightHours;
        }
        
        if (totalHours > overtimeBlock.limit) {
            const overtimeHours = totalHours - overtimeBlock.limit;
            // Используем среднюю ставку за час для расчета сверхурочных
            const averageHourlyRate = baseIncome / totalHours;
            overtimeAmount = overtimeHours * averageHourlyRate * (overtimeBlock.multiplier - 1);
        }
    }
    
    return overtimeAmount;
}

// Расчет аванса
function calculateAdvanceDeduction(template, totalIncome) {
    const advanceBlock = template.ruleBlocks.find(block => block.type === 'advance');
    
    if (!advanceBlock) return 0;
    
    if (advanceBlock.advanceType === 'fixed') {
        return advanceBlock.value;
    } else if (advanceBlock.advanceType === 'percent') {
        return totalIncome * (advanceBlock.value / 100);
    }
    
    return 0;
}

// Расчет налога
function calculateTaxDeduction(template, totalIncome) {
    const taxBlock = template.ruleBlocks.find(block => block.type === 'tax');
    
    if (!taxBlock) return 0;
    
    if (taxBlock.taxSource === 'fixed') {
        return taxBlock.fixedAmount * (taxBlock.taxPercent / 100);
    } else if (taxBlock.taxSource === 'total') {
        return totalIncome * (taxBlock.taxPercent / 100);
    }
    
    return 0;
}

// Получение суммы бонуса
function getBonusAmount(template) {
    const bonusBlock = template.ruleBlocks.find(block => block.type === 'bonus');
    return bonusBlock ? bonusBlock.amount : 0;
}

// Получение суммы фиксированного вычета
function getFixedDeductionAmount(template) {
    const deductionBlock = template.ruleBlocks.find(block => block.type === 'fixedDeduction');
    return deductionBlock ? deductionBlock.amount : 0;
}

// Подсчет рабочих дней
function countWorkDays(calendarData, template, year, month) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    let workDays = 0;
    
    const hasSalesPercent = template.ruleBlocks.some(block => block.type === 'salesPercent');
    const hasShiftRate = template.ruleBlocks.some(block => block.type === 'shiftRate');
    const hasHourlyRate = template.ruleBlocks.some(block => block.type === 'hourlyRate');
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        let isWorkDay = false;
        
        if (hasSalesPercent && dayData.sales > 0) {
            isWorkDay = true;
        }
        
        if (hasShiftRate && (dayData.dayShift || dayData.nightShift)) {
            isWorkDay = true;
        }
        
        if (hasHourlyRate && ((dayData.dayHours && dayData.dayHours > 0) || (dayData.nightHours && dayData.nightHours > 0))) {
            isWorkDay = true;
        }
        
        if (isWorkDay) workDays++;
    }
    
    return workDays;
}

// Подсчет общей суммы продаж
function calculateTotalSales(calendarData, year, month) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    let totalSales = 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales) {
            totalSales += dayData.sales;
        }
    }
    
    return totalSales;
}

// Основная функция расчета месяца
function calculateMonthlySummary(calendarData, template, year, month) {
    let baseIncome = 0;
    let adjustments = 0;
    let deductions = 0;
    
    // 1. РАСЧЕТ БАЗОВОГО ДОХОДА
    if (template.ruleBlocks.some(block => block.type === 'salesPercent')) {
        baseIncome += calculateSalesPercentIncome(calendarData, template, year, month);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'shiftRate')) {
        baseIncome += calculateShiftRateIncome(calendarData, template, year, month);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'hourlyRate')) {
        baseIncome += calculateHourlyRateIncome(calendarData, template, year, month);
    }
    
    // 2. ПРИМЕНЕНИЕ КОРРЕКТИРОВОК
    if (template.ruleBlocks.some(block => block.type === 'overtime')) {
        adjustments += calculateOvertimeAdjustment(calendarData, template, year, month, baseIncome);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'bonus')) {
        adjustments += getBonusAmount(template);
    }
    
    const totalIncome = baseIncome + adjustments;
    
    // 3. ПРИМЕНЕНИЕ ВЫЧЕТОВ
    if (template.ruleBlocks.some(block => block.type === 'advance')) {
        deductions += calculateAdvanceDeduction(template, totalIncome);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'tax')) {
        deductions += calculateTaxDeduction(template, totalIncome);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'fixedDeduction')) {
        deductions += getFixedDeductionAmount(template);
    }
    
    // ИТОГОВЫЙ РАСЧЕТ
    const finalSalary = totalIncome - deductions;
    
    return {
        baseIncome,
        adjustments,
        deductions,
        totalIncome,
        finalSalary,
        workDays: countWorkDays(calendarData, template, year, month),
        totalSales: calculateTotalSales(calendarData, year, month)
    };
}

// Обновление значений функциональных обводок
function updateFunctionalBorders(calendarData, newFunctionalBorderData) {
    let updated = false;
    
    for (const dateKey in calendarData) {
        if (calendarData[dateKey].functionalBorder) {
            const dayData = calendarData[dateKey];
            
            // Обновляем данные дня в соответствии с активными блоками
            if (newFunctionalBorderData.sales !== undefined) {
                dayData.sales = newFunctionalBorderData.sales;
            }
            if (newFunctionalBorderData.dayShift !== undefined) {
                dayData.dayShift = newFunctionalBorderData.dayShift;
            }
            if (newFunctionalBorderData.nightShift !== undefined) {
                dayData.nightShift = newFunctionalBorderData.nightShift;
            }
            if (newFunctionalBorderData.dayHours !== undefined) {
                dayData.dayHours = newFunctionalBorderData.dayHours;
            }
            if (newFunctionalBorderData.nightHours !== undefined) {
                dayData.nightHours = newFunctionalBorderData.nightHours;
            }
            
            // Обновляем данные функциональной обводки
            dayData.functionalBorderData = {...newFunctionalBorderData};
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
    // Проверка на пустые диапазоны
    if (!ranges || ranges.length === 0) {
        return false;
    }

    // Проверка каждого диапазона на корректность
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        
        // Проверка корректности значений
        if (range.from === null || range.from === undefined || range.from < 0) {
            return false;
        }
        
        if (range.to !== null && range.to !== undefined) {
            if (range.to < 0 || range.to <= range.from) {
                return false;
            }
        }
        
        // Проверка значения процента/ставки
        if (range.percent !== undefined && (range.percent < 0 || range.percent > 100)) {
            return false;
        }
        
        if (range.rate !== undefined && range.rate < 0) {
            return false;
        }

        // Проверка пересечения с другими диапазонами
        for (let j = i + 1; j < ranges.length; j++) {
            const otherRange = ranges[j];
            
            // Если один из диапазонов бесконечный, они не должны пересекаться по началу
            if (range.to === null || otherRange.to === null) {
                if (range.from === otherRange.from) {
                    return false;
                }
                continue;
            }
            
            // Проверка пересечения конечных диапазонов
            if ((range.from >= otherRange.from && range.from < otherRange.to) ||
                (range.to > otherRange.from && range.to <= otherRange.to) ||
                (otherRange.from >= range.from && otherRange.from < range.to) ||
                (otherRange.to > range.from && otherRange.to <= range.to)) {
                return false;
            }
        }
    }
    
    // Проверка покрытия всех значений (от 0 до бесконечности)
    let coveredFrom = 0;
    for (const range of ranges.sort((a, b) => a.from - b.from)) {
        if (range.from > coveredFrom) {
            return false; // Есть непокрытый промежуток
        }
        coveredFrom = range.to === null ? Infinity : range.to;
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

// Валидация параметров блока аванса
function validateAdvance(block) {
    if (block.advanceType === 'fixed') {
        return block.value >= 0;
    } else if (block.advanceType === 'percent') {
        return block.value >= 0 && block.value <= 100;
    }
    return false;
}

// Валидация параметров блока налога
function validateTax(block) {
    if (block.taxPercent < 0 || block.taxPercent > 100) {
        return false;
    }
    
    if (block.taxSource === 'fixed' && block.fixedAmount < 0) {
        return false;
    }
    
    return true;
}

// Валидация параметров блока бонуса
function validateBonus(block) {
    return block.amount >= 0;
}

// Валидация параметров блока сверхурочных
function validateOvertime(block) {
    return block.limit >= 0 && block.multiplier >= 1;
}

// Валидация параметров блока фиксированного вычета
function validateFixedDeduction(block) {
    return block.amount >= 0;
}

// Функции для работы с блоками правил и расчетов

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Расчет итогов за месяц
function calculateSummary(calendarData, currentYear, currentMonth, template) {
    const summary = calculateMonthlySummary(calendarData, template, currentYear, currentMonth);
    
    return {
        workDays: summary.workDays,
        totalSales: summary.totalSales,
        totalEarned: summary.totalIncome,
        salary: summary.finalSalary,
        balance: 0 // Убрали расчет остатка
    };
}

// Расчет месячной сводки по новой системе
function calculateMonthlySummary(calendarData, template, year, month) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let baseIncome = 0;
    let adjustments = 0;
    let deductions = 0;
    
    // Собираем данные по дням
    const dailyData = [];
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        // Проверяем, является ли день рабочим
        let isWorkDay = false;
        
        // Если есть блок продаж и есть сумма продаж
        if (template.ruleBlocks.some(block => block.type === 'salesPercent') && dayData.sales > 0) {
            isWorkDay = true;
        }
        
        // Если есть блок смен и отмечена дневная или ночная смена
        if (template.ruleBlocks.some(block => block.type === 'shiftRate') && 
            (dayData.dayShift || dayData.nightShift)) {
            isWorkDay = true;
        }
        
        // Если есть блок часов и есть дневные или ночные часы
        if (template.ruleBlocks.some(block => block.type === 'hourlyRate') && 
            ((dayData.dayHours && dayData.dayHours > 0) || (dayData.nightHours && dayData.nightHours > 0))) {
            isWorkDay = true;
        }
        
        if (isWorkDay) {
            workDays++;
            dailyData.push({ day: day, data: dayData, isWorkDay: true });
        } else {
            dailyData.push({ day: day, data: dayData, isWorkDay: false });
        }
    }
    
    // 1. РАСЧЕТ БАЗОВОГО ДОХОДА
    if (hasBlock(template, 'salesPercent')) {
        baseIncome += calculateSalesPercentIncome(dailyData, template);
        totalSales = calculateTotalSales(dailyData);
    }
    
    if (hasBlock(template, 'shiftRate')) {
        baseIncome += calculateShiftRateIncome(dailyData, template);
    }
    
    if (hasBlock(template, 'hourlyRate')) {
        baseIncome += calculateHourlyRateIncome(dailyData, template);
    }
    
    // 2. ПРИМЕНЕНИЕ КОРРЕКТИРОВОК
    if (hasBlock(template, 'overtime')) {
        adjustments += calculateOvertimeAdjustment(dailyData, template, baseIncome);
    }
    
    if (hasBlock(template, 'bonus')) {
        adjustments += getBonusAmount(template);
    }
    
    // 3. ПРИМЕНЕНИЕ ВЫЧЕТОВ
    if (hasBlock(template, 'advance')) {
        deductions += calculateAdvanceDeduction(template, baseIncome + adjustments);
    }
    
    if (hasBlock(template, 'tax')) {
        deductions += calculateTaxDeduction(template, baseIncome + adjustments);
    }
    
    if (hasBlock(template, 'fixedDeduction')) {
        deductions += getFixedDeductionAmount(template);
    }
    
    // ИТОГОВЫЙ РАСЧЕТ
    const totalIncome = baseIncome + adjustments;
    const finalSalary = totalIncome - deductions;
    
    return {
        baseIncome,
        adjustments,
        deductions,
        totalIncome,
        finalSalary,
        workDays,
        totalSales
    };
}

// Проверка наличия блока в шаблоне
function hasBlock(template, blockType) {
    return template.ruleBlocks.some(block => block.type === blockType);
}

// Расчет дохода от процента с продаж
function calculateSalesPercentIncome(dailyData, template) {
    let totalIncome = 0;
    const salesBlock = template.ruleBlocks.find(block => block.type === 'salesPercent');
    
    dailyData.forEach(dayInfo => {
        if (dayInfo.isWorkDay && dayInfo.data.sales) {
            const sales = dayInfo.data.sales;
            const customPercent = dayInfo.data.customSalesPercent;
            
            // Находим подходящий диапазон
            const range = findRangeForValue(sales, salesBlock.ranges);
            const percent = customPercent || (range ? range.percent : 0);
            
            totalIncome += calculateEarnings(sales, percent);
        }
    });
    
    return totalIncome;
}

// Расчет дохода от ставки за смену
function calculateShiftRateIncome(dailyData, template) {
    let totalIncome = 0;
    const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
    
    // Считаем общее количество смен каждого типа
    let dayShifts = 0;
    let nightShifts = 0;
    
    dailyData.forEach(dayInfo => {
        if (dayInfo.isWorkDay) {
            if (dayInfo.data.dayShift) dayShifts++;
            if (dayInfo.data.nightShift) nightShifts++;
        }
    });
    
    // Применяем ставки для дневных смен
    if (shiftBlock.dayRanges && shiftBlock.dayRanges.length > 0) {
        const range = findRangeForValue(dayShifts, shiftBlock.dayRanges);
        const rate = range ? range.rate : 0;
        totalIncome += dayShifts * rate;
    }
    
    // Применяем ставки для ночных смен
    if (shiftBlock.nightRanges && shiftBlock.nightRanges.length > 0) {
        const range = findRangeForValue(nightShifts, shiftBlock.nightRanges);
        const rate = range ? range.rate : 0;
        totalIncome += nightShifts * rate;
    }
    
    return totalIncome;
}

// Расчет дохода от ставки за час
function calculateHourlyRateIncome(dailyData, template) {
    let totalIncome = 0;
    const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
    
    // Суммируем часы по всем дням
    let totalDayHours = 0;
    let totalNightHours = 0;
    
    dailyData.forEach(dayInfo => {
        if (dayInfo.isWorkDay) {
            totalDayHours += dayInfo.data.dayHours || 0;
            totalNightHours += dayInfo.data.nightHours || 0;
        }
    });
    
    // Применяем ставки для дневных часов
    if (hourlyBlock.dayRanges && hourlyBlock.dayRanges.length > 0) {
        const range = findRangeForValue(totalDayHours, hourlyBlock.dayRanges);
        const rate = range ? range.rate : 0;
        totalIncome += totalDayHours * rate;
    }
    
    // Применяем ставки для ночных часов
    if (hourlyBlock.nightRanges && hourlyBlock.nightRanges.length > 0) {
        const range = findRangeForValue(totalNightHours, hourlyBlock.nightRanges);
        const rate = range ? range.rate : 0;
        totalIncome += totalNightHours * rate;
    }
    
    return totalIncome;
}

// Расчет сверхурочных
function calculateOvertimeAdjustment(dailyData, template, baseIncome) {
    const overtimeBlock = template.ruleBlocks.find(block => block.type === 'overtime');
    if (!overtimeBlock) return 0;
    
    let overtimeAdjustment = 0;
    const limit = overtimeBlock.limit || 0;
    const multiplier = overtimeBlock.multiplier || 1.5;
    
    if (overtimeBlock.overtimeType === 'shifts') {
        // Расчет по сменам
        let totalShifts = 0;
        dailyData.forEach(dayInfo => {
            if (dayInfo.isWorkDay) {
                if (dayInfo.data.dayShift) totalShifts++;
                if (dayInfo.data.nightShift) totalShifts++;
            }
        });
        
        if (totalShifts > limit) {
            const overtimeShifts = totalShifts - limit;
            // Упрощенный расчет - используем среднюю ставку
            const averageShiftRate = baseIncome / Math.max(totalShifts, 1);
            overtimeAdjustment = overtimeShifts * averageShiftRate * (multiplier - 1);
        }
    } else {
        // Расчет по часам
        let totalHours = 0;
        dailyData.forEach(dayInfo => {
            if (dayInfo.isWorkDay) {
                totalHours += (dayInfo.data.dayHours || 0) + (dayInfo.data.nightHours || 0);
            }
        });
        
        if (totalHours > limit) {
            const overtimeHours = totalHours - limit;
            // Упрощенный расчет - используем среднюю ставку за час
            const averageHourlyRate = baseIncome / Math.max(totalHours, 1);
            overtimeAdjustment = overtimeHours * averageHourlyRate * (multiplier - 1);
        }
    }
    
    return overtimeAdjustment;
}

// Получение суммы бонуса
function getBonusAmount(template) {
    const bonusBlock = template.ruleBlocks.find(block => block.type === 'bonus');
    return bonusBlock ? (bonusBlock.amount || 0) : 0;
}

// Расчет аванса
function calculateAdvanceDeduction(template, totalIncome) {
    const advanceBlock = template.ruleBlocks.find(block => block.type === 'advance');
    if (!advanceBlock) return 0;
    
    if (advanceBlock.advanceType === 'fixed') {
        return advanceBlock.value || 0;
    } else if (advanceBlock.advanceType === 'percent') {
        return totalIncome * ((advanceBlock.value || 0) / 100);
    }
    
    return 0;
}

// Расчет налога
function calculateTaxDeduction(template, totalIncome) {
    const taxBlock = template.ruleBlocks.find(block => block.type === 'tax');
    if (!taxBlock) return 0;
    
    const taxPercent = taxBlock.taxPercent || 0;
    
    if (taxBlock.taxSource === 'fixed') {
        const fixedAmount = taxBlock.fixedAmount || 0;
        return fixedAmount * (taxPercent / 100);
    } else {
        return totalIncome * (taxPercent / 100);
    }
}

// Получение суммы фиксированного вычета
function getFixedDeductionAmount(template) {
    const deductionBlock = template.ruleBlocks.find(block => block.type === 'fixedDeduction');
    return deductionBlock ? (deductionBlock.amount || 0) : 0;
}

// Поиск диапазона для значения
function findRangeForValue(value, ranges) {
    if (!ranges || ranges.length === 0) return null;
    
    for (const range of ranges) {
        const from = range.from || 0;
        const to = range.to === null ? Infinity : (range.to || Infinity);
        
        if (value >= from && value <= to) {
            return range;
        }
    }
    
    return null;
}

// Расчет общей суммы продаж
function calculateTotalSales(dailyData) {
    let total = 0;
    dailyData.forEach(dayInfo => {
        if (dayInfo.isWorkDay && dayInfo.data.sales) {
            total += dayInfo.data.sales;
        }
    });
    return total;
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

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

// Функции для работы с блоками правил (заглушки для следующих этапов)
function addRuleBlock() {
    console.log('Функция добавления блоков правил будет реализована на следующем этапе');
}

function validateRuleBlocks(ruleBlocks) {
    console.log('Функция валидации блоков правил будет реализована на следующем этапе');
    return true;
}

function calculateWithRuleBlocks(calendarData, template) {
    console.log('Функция расчета с блоками правил будет реализована на следующем этапе');
    return calculateSummary(calendarData, new Date().getFullYear(), new Date().getMonth(), template);
}

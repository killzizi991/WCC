// Константы для шаблонов расчета
const DEFAULT_TEMPLATES = [
    {
        id: 1,
        name: "Процент + ставка",
        type: "percentage",
        settings: {
            salesPercent: 7,
            shiftRate: 1000,
            advance: 0,
            functionalBorderValue: 30000
        }
    },
    {
        id: 2,
        name: "Новый шаблон",
        type: "custom",
        settings: {}
    }
];

// Расчет заработка за день
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Расчеты за месяц
function calculateMonthSummary(calendarData, year, month, templateSettings) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let totalEarnedWithoutTax = 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales > 0) {
            workDays++;
            totalSales += dayData.sales;
            
            // Используем индивидуальные настройки дня или общие
            const dayPercent = dayData.customSalesPercent || templateSettings.salesPercent;
            const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
            
            totalEarnedWithoutTax += calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
        }
    }
    
    let totalEarned = totalEarnedWithoutTax;
    let salary = totalEarned - templateSettings.advance;
    let balance = salary;

    return {
        workDays,
        totalSales,
        totalEarned,
        salary,
        balance
    };
}

// Расчет за день с учетом шаблона
function calculateDayEarnings(dayData, templateSettings) {
    if (!dayData.sales || dayData.sales <= 0) return 0;
    
    const dayPercent = dayData.customSalesPercent || templateSettings.salesPercent;
    const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
    
    return calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
}

// Обновление функциональных обводок
function updateFunctionalBorders(calendarData, newValue) {
    const updatedData = { ...calendarData };
    let updated = false;
    
    for (const dateKey in updatedData) {
        if (updatedData[dateKey].functionalBorder) {
            updatedData[dateKey].sales = newValue;
            updatedData[dateKey].functionalBorderValue = newValue;
            updated = true;
        }
    }
    
    return { updatedData, updated };
}

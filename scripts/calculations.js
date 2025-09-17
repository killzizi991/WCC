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
        name: "Почасовая оплата",
        type: "hourly",
        settings: {
            hourlyRate: 500,
            advance: 0,
            functionalBorderValue: 8
        }
    },
    {
        id: 3,
        name: "Фиксированная ставка за смену",
        type: "fixed_rate",
        settings: {
            shiftRate: 1500,
            advance: 0,
            functionalBorderValue: 1
        }
    }
];

// Расчет заработка за день
function calculateEarnings(sales, percent) {
    return sales * (percent / 100);
}

// Расчет почасового заработка
function calculateHourlyEarnings(hours, rate) {
    return hours * rate;
}

// Расчеты за месяц
function calculateMonthSummary(calendarData, year, month, templateSettings, templateType) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    let workDays = 0;
    let totalSales = 0;
    let totalEarnedWithoutTax = 0;
    let totalHours = 0;
    
    for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        if (dayData.sales > 0 || (templateType === 'hourly' && dayData.hours > 0) || (templateType === 'fixed_rate' && dayData.workingDay)) {
            workDays++;
            
            if (templateType === 'percentage') {
                totalSales += dayData.sales;
                
                // Используем индивидуальные настройки дня или общие
                const dayPercent = dayData.customSalesPercent || templateSettings.salesPercent;
                const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
                
                totalEarnedWithoutTax += calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
            } else if (templateType === 'hourly') {
                totalHours += dayData.hours || 0;
                
                // Используем индивидуальные настройки дня или общие
                const dayHourlyRate = dayData.customHourlyRate || templateSettings.hourlyRate;
                
                totalEarnedWithoutTax += calculateHourlyEarnings(dayData.hours, dayHourlyRate);
            } else if (templateType === 'fixed_rate') {
                // Используем индивидуальные настройки дня или общие
                const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
                totalEarnedWithoutTax += dayShiftRate;
            }
        }
    }
    
    let totalEarned = totalEarnedWithoutTax;
    let salary = totalEarned - templateSettings.advance;
    let balance = salary;

    return {
        workDays,
        totalSales,
        totalHours,
        totalEarned,
        salary,
        balance,
        templateType
    };
}

// Расчет за день с учетом шаблона
function calculateDayEarnings(dayData, templateSettings, templateType) {
    if (templateType === 'percentage') {
        if (!dayData.sales || dayData.sales <= 0) return 0;
        
        const dayPercent = dayData.customSalesPercent || templateSettings.salesPercent;
        const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
        
        return calculateEarnings(dayData.sales, dayPercent) + dayShiftRate;
    } else if (templateType === 'hourly') {
        if (!dayData.hours || dayData.hours <= 0) return 0;
        
        const dayHourlyRate = dayData.customHourlyRate || templateSettings.hourlyRate;
        
        return calculateHourlyEarnings(dayData.hours, dayHourlyRate);
    } else if (templateType === 'fixed_rate') {
        if (!dayData.workingDay) return 0;
        
        const dayShiftRate = dayData.customShiftRate || templateSettings.shiftRate;
        return dayShiftRate;
    }
    return 0;
}

// Обновление функциональных обводок
function updateFunctionalBorders(calendarData, newValue, templateType) {
    const updatedData = { ...calendarData };
    let updated = false;
    
    for (const dateKey in updatedData) {
        if (updatedData[dateKey].functionalBorder) {
            if (templateType === 'percentage') {
                updatedData[dateKey].sales = newValue;
            } else if (templateType === 'hourly') {
                updatedData[dateKey].hours = newValue;
            } else if (templateType === 'fixed_rate') {
                updatedData[dateKey].workingDay = true;
            }
            updatedData[dateKey].functionalBorderValue = newValue;
            updated = true;
        }
    }
    
    return { updatedData, updated };
}

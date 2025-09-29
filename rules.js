// FILE: rules.js
// Функции для работы с блоками правил и расчетов

// Расчет заработка за день с учетом индивидуального процента
function calculateEarnings(sales, percent) {
  if (typeof sales !== 'number' || sales < 0) {
    console.warn('Invalid sales value:', sales);
    return 0;
  }
  
  if (typeof percent !== 'number' || percent < 0 || percent > 100) {
    console.warn('Invalid percent value:', percent);
    return 0;
  }
  
  return sales * (percent / 100);
}

// Расчет заработка за день по прогрессивной (ступенчатой) модели
function calculateProgressiveEarnings(sales, ranges) {
  if (typeof sales !== 'number' || sales < 0) {
    console.warn('Invalid sales value for progressive calculation:', sales);
    return 0;
  }
  
  if (!Array.isArray(ranges) || ranges.length === 0) {
    console.warn('Invalid ranges for progressive calculation');
    return 0;
  }

  const sortedRanges = [...ranges].sort((a, b) => a.from - b.from);

  let totalEarnings = 0;
  let remainingSales = sales;

  for (const range of sortedRanges) {
    if (remainingSales <= 0) break;

    const rangeEnd = range.to === null ? Infinity : range.to;
    
    let amountInRange;
    if (remainingSales <= rangeEnd - range.from) {
      amountInRange = remainingSales;
    } else {
      amountInRange = rangeEnd - range.from;
    }

    if (amountInRange > 0) {
      totalEarnings += amountInRange * (range.percent / 100);
      remainingSales -= amountInRange;
    }
  }

  return totalEarnings;
}

// Нахождение подходящего диапазона для значения
function findRangeForValue(value, ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) return null;
  
  if (typeof value !== 'number' || value < 0) {
    console.warn('Invalid value for range search:', value);
    return null;
  }
  
  for (const range of ranges) {
    if (!range || typeof range !== 'object') continue;
    
    const from = (typeof range.from === 'number') ? range.from : 0;
    const to = (range.to === null || range.to === undefined) ? Infinity : range.to;
    
    if (typeof to === 'number' && to <= from) continue;
    
    if (value >= from && value < to) {
      return range;
    }
  }
  
  return null;
}

// Расчет дохода с продаж
function calculateSalesPercentIncome(calendarData, template, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') {
      console.warn('Invalid calendar data');
      return 0;
    }
    
    if (!template || typeof template !== 'object') {
      console.warn('Invalid template');
      return 0;
    }
    
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      console.warn('Invalid year:', year);
      return 0;
    }
    
    if (typeof month !== 'number' || month < 0 || month > 11) {
      console.warn('Invalid month:', month);
      return 0;
    }
    
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const salesBlock = template.ruleBlocks.find(block => block.type === 'salesPercent');
    
    if (!salesBlock) return 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.sales && dayData.sales > 0) {
        const sales = parseFloat(dayData.sales) || 0;
        
        if (typeof dayData.customSalesPercent === 'number') {
          totalIncome += calculateEarnings(sales, dayData.customSalesPercent);
        } else {
          totalIncome += calculateProgressiveEarnings(sales, salesBlock.ranges);
        }
      }
    }
    
    return Math.round(totalIncome * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета дохода с продаж:', error);
    return 0;
  }
}

// Расчет дохода за смены
function calculateShiftRateIncome(calendarData, template, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (!template || typeof template !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
    
    if (!shiftBlock) return 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.dayShift) {
        const dayRate = (dayData.customDayShiftRate > 0) ? dayData.customDayShiftRate : shiftBlock.dayRate;
        totalIncome += dayRate || 0;
      }
      
      if (dayData.nightShift) {
        const nightRate = (dayData.customNightShiftRate > 0) ? dayData.customNightShiftRate : shiftBlock.nightRate;
        totalIncome += nightRate || 0;
      }
    }
    
    return Math.round(totalIncome * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета дохода за смены:', error);
    return 0;
  }
}

// Расчет дохода за часы
function calculateHourlyRateIncome(calendarData, template, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (!template || typeof template !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
    let totalIncome = 0;
    const monthDays = new Date(year, month + 1, 0).getDate();
    const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
    
    if (!hourlyBlock) return 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.dayHours && dayData.dayHours > 0) {
        const dayRate = (dayData.customDayHourlyRate > 0) ? dayData.customDayHourlyRate : hourlyBlock.dayRate;
        totalIncome += dayData.dayHours * (dayRate || 0);
      }
      
      if (dayData.nightHours && dayData.nightHours > 0) {
        const nightRate = (dayData.customNightHourlyRate > 0) ? dayData.customNightHourlyRate : hourlyBlock.nightRate;
        totalIncome += dayData.nightHours * (nightRate || 0);
      }
    }
    
    return Math.round(totalIncome * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета дохода за часы:', error);
    return 0;
  }
}

// Расчет сверхурочных
function calculateOvertimeAdjustment(calendarData, template, year, month, baseIncome) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (!template || typeof template !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    if (typeof baseIncome !== 'number' || baseIncome < 0) return 0;
    
    const overtimeBlock = template.ruleBlocks.find(block => block.type === 'overtime');
    
    if (!overtimeBlock) return 0;
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let overtimeAmount = 0;
    
    if (overtimeBlock.overtimeType === 'shifts') {
      // Собираем все смены за месяц с их ставками
      const shifts = [];
      
      for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        const shiftBlock = template.ruleBlocks.find(block => block.type === 'shiftRate');
        
        if (dayData.dayShift) {
          const dayRate = (dayData.customDayShiftRate > 0) ? dayData.customDayShiftRate : shiftBlock.dayRate;
          shifts.push({
            date: dateKey,
            type: 'day',
            rate: dayRate || 0
          });
        }
        
        if (dayData.nightShift) {
          const nightRate = (dayData.customNightShiftRate > 0) ? dayData.customNightShiftRate : shiftBlock.nightRate;
          shifts.push({
            date: dateKey,
            type: 'night',
            rate: nightRate || 0
          });
        }
      }
      
      // Сортируем смены по дате
      shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Рассчитываем сверхурочные
      let totalShifts = 0;
      
      for (const shift of shifts) {
        if (totalShifts < overtimeBlock.limit) {
          totalShifts++;
        } else {
          // Смена сверх лимита - применяем множитель к ставке этой смены
          overtimeAmount += shift.rate * (overtimeBlock.multiplier - 1);
        }
      }
      
    } else if (overtimeBlock.overtimeType === 'hours') {
      // Собираем все часы за месяц с их ставками
      const hours = [];
      
      for (let day = 1; day <= monthDays; day++) {
        const dateKey = `${year}-${month+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        const hourlyBlock = template.ruleBlocks.find(block => block.type === 'hourlyRate');
        
        if (dayData.dayHours && dayData.dayHours > 0) {
          const dayRate = (dayData.customDayHourlyRate > 0) ? dayData.customDayHourlyRate : hourlyBlock.dayRate;
          hours.push({
            date: dateKey,
            type: 'day',
            hours: parseFloat(dayData.dayHours) || 0,
            rate: dayRate || 0
          });
        }
        
        if (dayData.nightHours && dayData.nightHours > 0) {
          const nightRate = (dayData.customNightHourlyRate > 0) ? dayData.customNightHourlyRate : hourlyBlock.nightRate;
          hours.push({
            date: dateKey,
            type: 'night',
            hours: parseFloat(dayData.nightHours) || 0,
            rate: nightRate || 0
          });
        }
      }
      
      // Сортируем часы по дате
      hours.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Рассчитываем сверхурочные
      let totalHours = 0;
      
      for (const hourEntry of hours) {
        const remainingLimit = Math.max(0, overtimeBlock.limit - totalHours);
        
        if (remainingLimit >= hourEntry.hours) {
          // Все часы в пределах лимита
          totalHours += hourEntry.hours;
        } else {
          // Часть часов сверх лимита
          const regularHours = remainingLimit;
          const overtimeHours = hourEntry.hours - regularHours;
          
          totalHours = overtimeBlock.limit;
          
          // Применяем множитель только к сверхурочным часам
          overtimeAmount += overtimeHours * hourEntry.rate * (overtimeBlock.multiplier - 1);
        }
      }
    }
    
    return Math.round(overtimeAmount * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета сверхурочных:', error);
    return 0;
  }
}

// Расчет аванса
function calculateAdvanceDeduction(template, totalIncome) {
  try {
    if (!template || typeof template !== 'object') return 0;
    if (typeof totalIncome !== 'number' || totalIncome < 0) return 0;
    
    const advanceBlock = template.ruleBlocks.find(block => block.type === 'advance');
    
    if (!advanceBlock) return 0;
    
    if (advanceBlock.advanceType === 'fixed') {
      return Math.max(0, advanceBlock.value || 0);
    } else if (advanceBlock.advanceType === 'percent') {
      const percent = Math.max(0, Math.min(100, advanceBlock.value || 0));
      return totalIncome * (percent / 100);
    }
    
    return 0;
  } catch (error) {
    console.error('Ошибка расчета аванса:', error);
    return 0;
  }
}

// Расчет налога
function calculateTaxDeduction(template, totalIncome) {
  try {
    if (!template || typeof template !== 'object') return 0;
    if (typeof totalIncome !== 'number' || totalIncome < 0) return 0;
    
    const taxBlock = template.ruleBlocks.find(block => block.type === 'tax');
    
    if (!taxBlock) return 0;
    
    if (taxBlock.taxSource === 'fixed') {
      const fixedAmount = Math.max(0, taxBlock.fixedAmount || 0);
      const taxPercent = Math.max(0, Math.min(100, taxBlock.taxPercent || 0));
      return fixedAmount * (taxPercent / 100);
    } else if (taxBlock.taxSource === 'total') {
      const taxPercent = Math.max(0, Math.min(100, taxBlock.taxPercent || 0));
      return totalIncome * (taxPercent / 100);
    }
    
    return 0;
  } catch (error) {
    console.error('Ошибка расчета налога:', error);
    return 0;
  }
}

// Получение суммы бонуса
function getBonusAmount(template) {
  try {
    if (!template || typeof template !== 'object') return 0;
    
    const bonusBlock = template.ruleBlocks.find(block => block.type === 'bonus');
    return bonusBlock ? Math.max(0, bonusBlock.amount || 0) : 0;
  } catch (error) {
    console.error('Ошибка получения суммы бонуса:', error);
    return 0;
  }
}

// Получение суммы фиксированного вычета
function getFixedDeductionAmount(template) {
  try {
    if (!template || typeof template !== 'object') return 0;
    
    const deductionBlock = template.ruleBlocks.find(block => block.type === 'fixedDeduction');
    return deductionBlock ? Math.max(0, deductionBlock.amount || 0) : 0;
  } catch (error) {
    console.error('Ошибка получения суммы вычета:', error);
    return 0;
  }
}

// Подсчет рабочих дней
function countWorkDays(calendarData, template, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (!template || typeof template !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
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
  } catch (error) {
    console.error('Ошибка подсчета рабочих дней:', error);
    return 0;
  }
}

// Подсчет общей суммы продаж
function calculateTotalSales(calendarData, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let totalSales = 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.sales) {
        totalSales += parseFloat(dayData.sales) || 0;
      }
    }
    
    return Math.round(totalSales * 100) / 100;
  } catch (error) {
    console.error('Ошибка подсчета суммы продаж:', error);
    return 0;
  }
}

// Расчет суммы бонусов за дни
function calculateDayBonuses(calendarData, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let totalBonuses = 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.bonus) {
        totalBonuses += parseFloat(dayData.bonus) || 0;
      }
    }
    
    return Math.round(totalBonuses * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета бонусов за дни:', error);
    return 0;
  }
}

// Расчет суммы фиксированных вычетов за дни
function calculateDayDeductions(calendarData, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return 0;
    if (typeof year !== 'number' || year < 2000 || year > 2100) return 0;
    if (typeof month !== 'number' || month < 0 || month > 11) return 0;
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let totalDeductions = 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.fixedDeduction) {
        totalDeductions += parseFloat(dayData.fixedDeduction) || 0;
      }
    }
    
    return Math.round(totalDeductions * 100) / 100;
  } catch (error) {
    console.error('Ошибка расчета вычетов за дни:', error);
    return 0;
  }
}

// Подсчет общего количества часов
function calculateTotalHours(calendarData, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return { day: 0, night: 0, total: 0 };
    if (typeof year !== 'number' || year < 2000 || year > 2100) return { day: 0, night: 0, total: 0 };
    if (typeof month !== 'number' || month < 0 || month > 11) return { day: 0, night: 0, total: 0 };
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let totalDayHours = 0;
    let totalNightHours = 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.dayHours) totalDayHours += parseFloat(dayData.dayHours) || 0;
      if (dayData.nightHours) totalNightHours += parseFloat(dayData.nightHours) || 0;
    }
    
    return {
      day: Math.round(totalDayHours * 10) / 10,
      night: Math.round(totalNightHours * 10) / 10,
      total: Math.round((totalDayHours + totalNightHours) * 10) / 10
    };
  } catch (error) {
    console.error('Ошибка подсчета часов:', error);
    return { day: 0, night: 0, total: 0 };
  }
}

// Подсчет общего количества смен
function calculateTotalShifts(calendarData, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return { day: 0, night: 0, total: 0 };
    if (typeof year !== 'number' || year < 2000 || year > 2100) return { day: 0, night: 0, total: 0 };
    if (typeof month !== 'number' || month < 0 || month > 11) return { day: 0, night: 0, total: 0 };
    
    const monthDays = new Date(year, month + 1, 0).getDate();
    let dayShifts = 0;
    let nightShifts = 0;
    
    for (let day = 1; day <= monthDays; day++) {
      const dateKey = `${year}-${month+1}-${day}`;
      const dayData = calendarData[dateKey] || {};
      
      if (dayData.dayShift) dayShifts++;
      if (dayData.nightShift) nightShifts++;
    }
    
    return {
      day: dayShifts,
      night: nightShifts,
      total: dayShifts + nightShifts
    };
  } catch (error) {
    console.error('Ошибка подсчета смен:', error);
    return { day: 0, night: 0, total: 0 };
  }
}

// Основная функция расчета месяца
function calculateMonthlySummary(calendarData, template, year, month) {
  try {
    if (!calendarData || typeof calendarData !== 'object') {
      return getEmptySummary();
    }
    
    if (!template || typeof template !== 'object') {
      return getEmptySummary();
    }
    
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      return getEmptySummary();
    }
    
    if (typeof month !== 'number' || month < 0 || month > 11) {
      return getEmptySummary();
    }
    
    let baseIncome = 0;
    let adjustments = 0;
    let deductions = 0;
    
    if (template.ruleBlocks.some(block => block.type === 'salesPercent')) {
      baseIncome += calculateSalesPercentIncome(calendarData, template, year, month);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'shiftRate')) {
      baseIncome += calculateShiftRateIncome(calendarData, template, year, month);
    }
    
    if (template.ruleBlocks.some(block => block.type === 'hourlyRate')) {
      baseIncome += calculateHourlyRateIncome(calendarData, template, year, month);
    }
    
    let overtimeAmount = 0;
    if (template.ruleBlocks.some(block => block.type === 'overtime')) {
      overtimeAmount = calculateOvertimeAdjustment(calendarData, template, year, month, baseIncome);
      adjustments += overtimeAmount;
    }
    
    let templateBonus = getBonusAmount(template);
    let dayBonuses = calculateDayBonuses(calendarData, year, month);
    let totalBonusAmount = templateBonus + dayBonuses;
    adjustments += totalBonusAmount;
    
    const totalIncome = baseIncome + adjustments;
    
    let advanceAmount = 0;
    if (template.ruleBlocks.some(block => block.type === 'advance')) {
      advanceAmount = calculateAdvanceDeduction(template, totalIncome);
      deductions += advanceAmount;
    }
    
    let taxAmount = 0;
    if (template.ruleBlocks.some(block => block.type === 'tax')) {
      taxAmount = calculateTaxDeduction(template, totalIncome);
      deductions += taxAmount;
    }
    
    let templateDeduction = getFixedDeductionAmount(template);
    let dayDeductions = calculateDayDeductions(calendarData, year, month);
    let totalDeductionAmount = templateDeduction + dayDeductions;
    deductions += totalDeductionAmount;
    
    const finalSalary = Math.max(0, totalIncome - deductions);
    
    const workDays = countWorkDays(calendarData, template, year, month);
    const totalSales = calculateTotalSales(calendarData, year, month);
    const hours = calculateTotalHours(calendarData, year, month);
    const shifts = calculateTotalShifts(calendarData, year, month);
    
    const salaryBeforeBonuses = Math.max(0, (baseIncome + overtimeAmount) - advanceAmount - taxAmount);
    const salaryBeforeDeductions = Math.max(0, totalIncome - advanceAmount - taxAmount);
    
    return {
      baseIncome: Math.round(baseIncome * 100) / 100,
      adjustments: Math.round(adjustments * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      finalSalary: Math.round(finalSalary * 100) / 100,
      workDays: workDays,
      totalSales: totalSales,
      hours: hours,
      shifts: shifts,
      overtimeAmount: overtimeAmount,
      totalBonusAmount: totalBonusAmount,
      totalDeductionAmount: totalDeductionAmount,
      advanceAmount: advanceAmount,
      taxAmount: taxAmount,
      salaryBeforeBonuses: Math.round(salaryBeforeBonuses * 100) / 100,
      salaryBeforeDeductions: Math.round(salaryBeforeDeductions * 100) / 100
    };
  } catch (error) {
    console.error('Критическая ошибка расчета месяца:', error);
    return getEmptySummary();
  }
}

// Пустой результат расчета
function getEmptySummary() {
  return {
    baseIncome: 0,
    adjustments: 0,
    deductions: 0,
    totalIncome: 0,
    finalSalary: 0,
    workDays: 0,
    totalSales: 0,
    hours: { day: 0, night: 0, total: 0 },
    shifts: { day: 0, night: 0, total: 0 },
    overtimeAmount: 0,
    totalBonusAmount: 0,
    totalDeductionAmount: 0,
    advanceAmount: 0,
    taxAmount: 0,
    salaryBeforeBonuses: 0,
    salaryBeforeDeductions: 0
  };
}

// Обновление значений функциональных обводок
function updateFunctionalBorders(calendarData, newFunctionalBorderData) {
  try {
    if (!calendarData || typeof calendarData !== 'object') return false;
    if (!newFunctionalBorderData || typeof newFunctionalBorderData !== 'object') return false;
    
    let updated = false;
    
    for (const dateKey in calendarData) {
      if (calendarData[dateKey].functionalBorder) {
        const dayData = calendarData[dateKey];
        
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
        
        dayData.functionalBorderData = {...newFunctionalBorderData};
        updated = true;
      }
    }
    
    return updated;
  } catch (error) {
    console.error('Ошибка обновления функциональных обводок:', error);
    return false;
  }
}

// Создание блока правил по типу
function createRuleBlock(blockType) {
  try {
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
          dayRate: 1000,
          nightRate: 0
        };
      case 'hourlyRate':
        return {
          ...defaultBlock,
          dayRate: 150,
          nightRate: 0
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
  } catch (error) {
    console.error('Ошибка создания блока правил:', error);
    return {
      id: 'block_error_' + Date.now(),
      type: blockType,
      name: 'Ошибочный блок'
    };
  }
}

// Проверка конфликтов между блоками
function hasConflict(newBlock, existingBlocks) {
  try {
    if (!newBlock || !Array.isArray(existingBlocks)) return false;
    
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
  } catch (error) {
    console.error('Ошибка проверки конфликтов блоков:', error);
    return true;
  }
}

// Валидация диапазонов
function validateRanges(ranges) {
  try {
    if (!Array.isArray(ranges) || ranges.length === 0) {
      return false;
    }

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      
      if (!range || typeof range !== 'object') {
        return false;
      }
      
      if (range.from === null || range.from === undefined || range.from < 0) {
        return false;
      }
      
      if (range.to !== null && range.to !== undefined) {
        if (range.to < 0 || range.to <= range.from) {
          return false;
        }
      }
      
      if (range.percent !== undefined && (range.percent < 0 || range.percent > 100)) {
        return false;
      }
      
      if (range.rate !== undefined && range.rate < 0) {
        return false;
      }

      for (let j = i + 1; j < ranges.length; j++) {
        const otherRange = ranges[j];
        
        if (range.to === null || otherRange.to === null) {
          if (range.from === otherRange.from) {
            return false;
          }
          continue;
        }
        
        if ((range.from >= otherRange.from && range.from < otherRange.to) ||
            (range.to > otherRange.from && range.to <= otherRange.to) ||
            (otherRange.from >= range.from && otherRange.from < range.to) ||
            (otherRange.to > range.from && otherRange.to <= range.to)) {
          return false;
        }
      }
    }
    
    let coveredFrom = 0;
    const sortedRanges = [...ranges].sort((a, b) => a.from - b.from);
    
    for (const range of sortedRanges) {
      if (range.from > coveredFrom) {
        return false;
      }
      coveredFrom = range.to === null ? Infinity : range.to;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка валидации диапазонов:', error);
    return false;
  }
}

// Получение названия блока по умолчанию
function getDefaultBlockName(blockType) {
  try {
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
  } catch (error) {
    console.error('Ошибка получения названия блока:', error);
    return 'Ошибочный блок';
  }
}

// Валидация параметров блока аванса
function validateAdvance(block) {
  try {
    if (!block || typeof block !== 'object') return false;
    
    if (block.advanceType === 'fixed') {
      return typeof block.value === 'number' && block.value >= 0;
    } else if (block.advanceType === 'percent') {
      return typeof block.value === 'number' && block.value >= 0 && block.value <= 100;
    }
    return false;
  } catch (error) {
    console.error('Ошибка валидации аванса:', error);
    return false;
  }
}

// Валидация параметров блока налога
function validateTax(block) {
  try {
    if (!block || typeof block !== 'object') return false;
    
    if (typeof block.taxPercent !== 'number' || block.taxPercent < 0 || block.taxPercent > 100) {
      return false;
    }
    
    if (block.taxSource === 'fixed' && (typeof block.fixedAmount !== 'number' || block.fixedAmount < 0)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка валидации налога:', error);
    return false;
  }
}

// Валидация параметров блока бонуса
function validateBonus(block) {
  try {
    if (!block || typeof block !== 'object') return false;
    return typeof block.amount === 'number' && block.amount >= 0;
  } catch (error) {
    console.error('Ошибка валидации бонуса:', error);
    return false;
  }
}

// Валидация параметров блока сверхурочных
function validateOvertime(block) {
  try {
    if (!block || typeof block !== 'object') return false;
    
    if (typeof block.limit !== 'number' || block.limit < 0) return false;
    if (typeof block.multiplier !== 'number' || block.multiplier < 1) return false;
    
    return true;
  } catch (error) {
    console.error('Ошибка валидации сверхурочных:', error);
    return false;
  }
}

// Валидация параметров блока фиксированного вычета
function validateFixedDeduction(block) {
  try {
    if (!block || typeof block !== 'object') return false;
    return typeof block.amount === 'number' && block.amount >= 0;
  } catch (error) {
    console.error('Ошибка валидации вычета:', error);
    return false;
  }
}

// Константы для типов блоков
const BLOCK_TYPES = {
  PERCENTAGE: 'percentage',
  SHIFT_RATE: 'shift_rate',
  HOURLY_RATE: 'hourly_rate',
  ADVANCE: 'advance',
  TAX: 'tax',
  BONUS: 'bonus',
  OVERTIME: 'overtime',
  DEDUCTION: 'deduction'
};

// Константы для источников расчета
const CALCULATION_SOURCES = {
  TOTAL_EARNED: 'total_earned',
  SALARY: 'salary', 
  ADVANCE: 'advance'
};

// Функция применения блоков расчета
function applyCalculationBlocks(blocks, dayData, context = {}) {
  let result = { 
    earnings: 0,
    deductions: 0,
    ...context 
  };
  
  blocks.forEach(block => {
    switch(block.type) {
      case BLOCK_TYPES.PERCENTAGE:
        result = applyPercentageBlock(block, dayData, result);
        break;
      case BLOCK_TYPES.SHIFT_RATE:
        result = applyShiftRateBlock(block, dayData, result);
        break;
      case BLOCK_TYPES.HOURLY_RATE:
        result = applyHourlyRateBlock(block, dayData, result);
        break;
      case BLOCK_TYPES.ADVANCE:
        result = applyAdvanceBlock(block, dayData, result);
        break;
      // Остальные типы блоков будут добавлены позже
    }
  });
  
  return result;
}

// Функции для каждого типа блока
function applyPercentageBlock(block, dayData, context) {
  if (dayData.sales && dayData.sales >= block.settings.range_min && 
      (!block.settings.range_max || dayData.sales <= block.settings.range_max)) {
    const amount = dayData.sales * (block.settings.percent / 100);
    context.earnings += amount;
    
    context.calculationSteps = context.calculationSteps || [];
    context.calculationSteps.push({
      type: BLOCK_TYPES.PERCENTAGE,
      description: `Процент с продаж (${block.settings.percent}%)`,
      amount: amount
    });
  }
  return context;
}

function applyShiftRateBlock(block, dayData, context) {
  if (dayData.workingDay) {
    context.earnings += block.settings.rate;
    
    context.calculationSteps = context.calculationSteps || [];
    context.calculationSteps.push({
      type: BLOCK_TYPES.SHIFT_RATE,
      description: `Ставка за смену`,
      amount: block.settings.rate
    });
  }
  return context;
}

function applyHourlyRateBlock(block, dayData, context) {
  if (dayData.hours && dayData.hours > 0) {
    const amount = dayData.hours * block.settings.rate;
    context.earnings += amount;
    
    context.calculationSteps = context.calculationSteps || [];
    context.calculationSteps.push({
      type: BLOCK_TYPES.HOURLY_RATE,
      description: `Почасовая оплата (${block.settings.rate} руб/час)`,
      amount: amount
    });
  }
  return context;
}

function applyAdvanceBlock(block, dayData, context) {
  if (block.settings.type === 'fixed') {
    context.deductions += block.settings.value;
    
    context.calculationSteps = context.calculationSteps || [];
    context.calculationSteps.push({
      type: BLOCK_TYPES.ADVANCE,
      description: `Аванс (фиксированный)`,
      amount: -block.settings.value
    });
  } else if (block.settings.type === 'percent') {
    const amount = context.earnings * (block.settings.value / 100);
    context.deductions += amount;
    
    context.calculationSteps = context.calculationSteps || [];
    context.calculationSteps.push({
      type: BLOCK_TYPES.ADVANCE,
      description: `Аванс (${block.settings.value}%)`,
      amount: -amount
    });
  }
  return context;
}

// Обновленная функция расчета за день
function calculateDayEarnings(dayData, blocks) {
  if (!dayData || (!dayData.sales && !dayData.hours && !dayData.workingDay)) return 0;
  
  const result = applyCalculationBlocks(blocks, dayData);
  return result.earnings - result.deductions;
}

// Расчеты за месяц
function calculateMonthSummary(calendarData, year, month, blocks) {
  const monthDays = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  let totalSales = 0;
  let totalHours = 0;
  let totalShifts = 0;
  let totalEarned = 0;
  let totalDeductions = 0;
  
  for (let day = 1; day <= monthDays; day++) {
    const dateKey = `${year}-${month+1}-${day}`;
    const dayData = calendarData[dateKey] || {};
    
    const dayResult = applyCalculationBlocks(blocks, dayData);
    
    if (dayResult.earnings > 0) {
      workDays++;
      totalEarned += dayResult.earnings;
      totalDeductions += dayResult.deductions;
    }
    
    if (dayData.sales) totalSales += dayData.sales;
    if (dayData.hours) totalHours += dayData.hours;
    if (dayData.workingDay) totalShifts++;
  }
  
  const salary = totalEarned - totalDeductions;
  
  return {
    workDays,
    totalSales,
    totalHours,
    totalShifts,
    totalEarned,
    totalDeductions,
    salary,
    blocks
  };
}

// Обновление функциональных обводок
function updateFunctionalBorders(calendarData, newValues, blocks) {
  const updatedData = { ...calendarData };
  let updated = false;
  
  for (const dateKey in updatedData) {
    if (updatedData[dateKey].functionalBorder) {
      // Определяем, какие значения нужно обновить на основе активных блоков
      const hasSales = blocks.some(b => b.type === BLOCK_TYPES.PERCENTAGE);
      const hasHours = blocks.some(b => b.type === BLOCK_TYPES.HOURLY_RATE);
      const hasShifts = blocks.some(b => b.type === BLOCK_TYPES.SHIFT_RATE);
      
      if (hasSales && newValues.sales !== undefined) {
        updatedData[dateKey].sales = newValues.sales;
      }
      
      if (hasHours && newValues.hours !== undefined) {
        updatedData[dateKey].hours = newValues.hours;
      }
      
      if (hasShifts && newValues.shifts !== undefined) {
        updatedData[dateKey].workingDay = newValues.shifts > 0;
      }
      
      updatedData[dateKey].functionalBorderValue = newValues;
      updated = true;
    }
  }
  
  return { updatedData, updated };
}

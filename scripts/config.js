// Константы приложения
const COLOR_PALETTE = [
    '#ffffff', 
    '#bbdefb', 
    '#c8e6c9', 
    '#b2ebf2', 
    '#fff9c4', 
    '#e1bee7', 
    '#f8bbd0'
];

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// Шаблоны расчета по умолчанию
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

// Версия приложения
const APP_VERSION = '1.1';
const CACHE_NAME = 'sales-calendar-v5';

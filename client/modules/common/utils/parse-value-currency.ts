import { config } from '../../../config';

export const formatCurrency = (value: string | number) => {
    let numberValue: number = 0;
    if (typeof value === 'string') {
        numberValue = parseFloat(value);
    }

    return Intl.NumberFormat(config.currency.lang, {
        maximumFractionDigits: config.currency.maximumFractionDigits,
        currency: config.currency.code,
        style: config.currency.style
    }).format(numberValue);
}
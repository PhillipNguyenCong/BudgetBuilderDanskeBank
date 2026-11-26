export const typeLabels = {
  INCOME: 'Income',
  SPENDING: 'Spending',
  FIXED_EXPENSE: 'Fixed expenses',
  SAVINGS: 'Savings',
};
export const widgetColors = {
  INCOME: { accent: '#141414', background: '#ECECEF' },
  SPENDING: { accent: '#334DDB', background: '#E4EDFF' },
  FIXED_EXPENSE: { accent: '#40434B', background: '#E7E8EC' },
  SAVINGS: { accent: '#167348', background: '#DFF2E6' },
};

const groceriesColors = { accent: '#8050A0', background: '#F1E6F8' };

export function widgetColor(type: keyof typeof widgetColors, purpose?: string) {
  return type === 'SPENDING' && purpose === 'GROCERIES' ? groceriesColors : widgetColors[type];
}

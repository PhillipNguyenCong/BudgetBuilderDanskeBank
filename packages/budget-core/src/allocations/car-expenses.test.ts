import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inferCarExpenseKind } from './index.js';

test('US-04/05: car checklist recognizes specific English/Danish bill labels conservatively', () => {
  for (const [label, kind] of [
    ['Grøn ejerafgift', 'VEHICLE_TAX'],
    ['CO2-ejerafgift', 'VEHICLE_TAX'],
    ['Miljøafgift', 'VEHICLE_TAX'],
    ['Bilforsikring', 'INSURANCE'],
    ['Car insurance', 'INSURANCE'],
    ['Brændstof', 'FUEL'],
    ['EV charging', 'FUEL'],
    ['Bilservice', 'MAINTENANCE'],
    ['Vinterhjul skift', 'TYRES'],
    ['Bilsyn', 'INSPECTION'],
  ] as const)
    assert.equal(inferCarExpenseKind({ label }), kind);
  for (const label of [
    'Insurance',
    'Service subscription',
    'Vision care',
    'Rent',
    'Netflix',
    'Car insurance and vehicle tax',
  ])
    assert.equal(inferCarExpenseKind({ label }), null);
});

test('US-04: stable accepted car metadata survives renamed planning labels', () => {
  assert.equal(
    inferCarExpenseKind({
      label: 'My renamed reserve',
      carExpense: { kind: 'INSPECTION', basis: 'MONTHLY_RESERVE' },
    }),
    'INSPECTION',
  );
});

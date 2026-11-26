import { Pressable, StyleSheet, View } from 'react-native';
import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { colors, spacing } from '../../../foundation/theme/theme';
import { billFrequencyLabels, formatDkk } from '../../budget-shared';
import { isAmountInput, parseAmount } from '../editor/draft';
import type { CarChecklistItem } from '../editor/carChecklist';
import { BillFrequencyPicker } from './BillFrequencyPicker';

export function CarExpenseChecklist({
  items,
  onChange,
}: {
  items: CarChecklistItem[];
  onChange: (item: CarChecklistItem) => void;
}) {
  return (
    <View style={styles.content}>
      <AppText>
        Check these common car costs. This checklist cannot identify every expense or estimate
        prices. Enter a missing amount or explicitly skip the cost if it is already covered or does
        not apply.
      </AppText>
      {items.map((item) => (
        <View key={item.kind} style={styles.item}>
          <AppText variant="label">{item.label}</AppText>
          <AppText variant="small">{item.description}</AppText>
          {item.existingRows.length ? (
            item.existingRows.map((row, index) => {
              const amount = parseAmount(row).amount;
              return (
                <View key={row.id} style={styles.content}>
                  <AppText>Already included: {row.label}</AppText>
                  <AppText variant="small">
                    {amount === undefined
                      ? 'Amount missing — enter it below before allocating.'
                      : row.carExpense?.basis === 'MONTHLY_RESERVE'
                        ? `${formatDkk(amount)} monthly reserve`
                        : `${formatDkk(amount)} per payment · ${billFrequencyLabels[row.frequency ?? 'MONTHLY']} · ${formatDkk(monthlyBillAllocation(amount, row.frequency))}/month`}
                  </AppText>
                  <TextField
                    label={
                      row.carExpense?.basis === 'MONTHLY_RESERVE'
                        ? 'DKK / month to set aside'
                        : 'DKK / payment'
                    }
                    accessibilityLabel={`${item.label} included bill ${index + 1} amount in DKK`}
                    value={row.input}
                    keyboardType="decimal-pad"
                    maxLength={24}
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                    placeholder="Enter amount"
                    error={parseAmount(row).error}
                    onChangeText={(input) => {
                      if (isAmountInput(input))
                        onChange({
                          ...item,
                          existingRows: item.existingRows.map((existing) =>
                            existing.id === row.id ? { ...existing, input } : existing,
                          ),
                        });
                    }}
                  />
                  <BillFrequencyPicker
                    row={row}
                    prefix={`${item.label} included bill ${index + 1}`}
                    onChange={(value) =>
                      onChange({
                        ...item,
                        existingRows: item.existingRows.map((existing) =>
                          existing.id === row.id ? value : existing,
                        ),
                      })
                    }
                  />
                  {row.suggestionConfidence === 'POSSIBLE' ? (
                    <AppText variant="small">Possible bill · recurrence unconfirmed</AppText>
                  ) : null}
                </View>
              );
            })
          ) : (
            <>
              <View style={styles.choices}>
                {[true, false].map((include) => (
                  <Pressable
                    key={String(include)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${item.label}: ${include ? 'Include this cost' : 'Skip this cost'}`}
                    accessibilityState={{ checked: item.include === include }}
                    onPress={() => onChange({ ...item, include })}
                    style={styles.choice}
                  >
                    <AppText style={styles.action}>
                      {item.include === include ? '✓ ' : ''}
                      {include ? 'Include this cost' : 'Skip this cost'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              {item.include ? (
                <>
                  <TextField
                    label={item.reserve ? 'DKK / month to set aside' : 'DKK / payment'}
                    accessibilityLabel={`${item.label} amount in DKK`}
                    value={item.row.input}
                    keyboardType="decimal-pad"
                    maxLength={24}
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                    placeholder="Enter amount"
                    error={parseAmount(item.row).error}
                    onChangeText={(input) => {
                      if (isAmountInput(input)) onChange({ ...item, row: { ...item.row, input } });
                    }}
                  />
                  {item.reserve ? (
                    <AppText variant="small">Monthly reserve · not a monthly bill</AppText>
                  ) : (
                    <BillFrequencyPicker
                      row={item.row}
                      prefix={item.label}
                      onChange={(row) => onChange({ ...item, row })}
                    />
                  )}
                </>
              ) : (
                <AppText variant="small">
                  No extra allocation will be added for this cost. Existing bills remain included.
                </AppText>
              )}
            </>
          )}
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.small },
  item: {
    gap: spacing.medium,
    paddingVertical: spacing.large,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.medium },
  choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.small },
  action: { color: colors.blue },
});

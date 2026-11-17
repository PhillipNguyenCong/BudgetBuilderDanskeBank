import { Disclosure } from '../../../foundation/components/Disclosure';
import type { BillSuggestion } from '@budget-builder/contracts';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { spacing } from '../../../foundation/theme/theme';
import { billFrequencyLabels, formatDkk } from '../../budget-shared';
import type { BillDiscoveryState } from '../hooks/useBillSuggestions';
export function BillSuggestionPanel({
  state,
  remaining,
  onAdd,
  onRefresh,
  disabled = false,
}: {
  state: BillDiscoveryState;
  remaining: BillSuggestion[];
  onAdd: () => void;
  onRefresh: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.content}>
      {state.status === 'loading' ? (
        <AppText accessibilityLiveRegion="polite">Looking for bills…</AppText>
      ) : null}
      {state.status === 'error' ? <AppText accessibilityRole="alert">{state.error}</AppText> : null}
      {state.data ? (
        <>
          <Disclosure label="Suggestion details">
            <AppText variant="small">
              Source history: {state.data.quality.coverage.from ?? 'unknown start'} to{' '}
              {state.data.quality.coverage.to ?? 'unknown end'}. Suggestions are drafts for your
              review.
            </AppText>
            {state.data.notes.map((note) => (
              <AppText key={note} variant="small">
                {note}
              </AppText>
            ))}
            {!state.data.suggestions.length ? (
              <AppText>No recurring bills found.</AppText>
            ) : !remaining.length ? (
              <AppText accessibilityLiveRegion="polite">No new bills to add.</AppText>
            ) : null}
            {remaining.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestion}>
                <AppText variant="label">
                  {suggestion.label} ·{' '}
                  {suggestion.confidence === 'RECURRING' ? 'Recurring pattern' : 'Possible bill'}
                </AppText>
                <AppText>
                  {suggestion.amountOere === null
                    ? 'Amount needs your input'
                    : `${formatDkk(suggestion.amountOere)} per payment`}{' '}
                  ·{' '}
                  {suggestion.frequency
                    ? billFrequencyLabels[suggestion.frequency]
                    : 'Monthly (default)'}
                </AppText>
                <Disclosure label="Source details">
                  <AppText variant="small">{suggestion.source.explanation}</AppText>
                </Disclosure>
              </View>
            ))}
            <Button
              label="Refresh bill suggestions"
              variant="secondary"
              disabled={disabled || state.status === 'loading'}
              onPress={onRefresh}
            />
          </Disclosure>
          {remaining.length ? (
            <Button
              label="Add found bills"
              variant="secondary"
              disabled={disabled || state.status === 'loading' || !remaining.length}
              onPress={onAdd}
            />
          ) : null}
        </>
      ) : null}
      {state.status === 'error' ? (
        <Button
          label="Try finding bills again"
          variant="secondary"
          disabled={disabled}
          onPress={onRefresh}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.medium },
  suggestion: { gap: spacing.small, paddingVertical: spacing.medium },
});

import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';
import { isAdjusted, type DraftRow } from '../editor/draft';

export function RowSourceDetails({ row }: { row: DraftRow }) {
  return (
    <>
      {row.source?.kind === 'SUGGESTED' && isAdjusted(row) ? (
        <AppText variant="small">Adjusted by you</AppText>
      ) : null}
      {row.source ? (
        <View style={styles.evidence}>
          <AppText variant="small">{row.source.explanation}</AppText>
          {row.source.period ? (
            <AppText variant="small">
              Source period: {row.source.period.from} – {row.source.period.to}
            </AppText>
          ) : null}
          {row.sourceFrequencyKnown === false ? (
            <AppText variant="small">Original payment frequency was not established.</AppText>
          ) : null}
          {row.source.kind === 'SUGGESTED' ? (
            <AppText variant="small">
              Original suggestion: {row.original.label},{' '}
              {row.sourceAmountKnown === false
                ? 'amount unavailable'
                : formatDkk(row.original.amountOere)}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  evidence: { gap: spacing.small },
});

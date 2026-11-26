import type { SpendingSummary } from '@budget-builder/contracts';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk, widgetColor } from '../../budget-shared';
import { isHistorical, monthLabel, outsideActivityCoverage } from './budgetMonth';

const gaugeColors = [
  widgetColor('SPENDING', 'FUN').accent,
  widgetColor('SPENDING', 'GROCERIES').accent,
  widgetColor('SAVINGS').accent,
  widgetColor('FIXED_EXPENSE').accent,
  widgetColor('INCOME').accent,
];

function gaugeArc(fraction: number) {
  const angle = Math.PI * fraction;
  const x = 100 - 90 * Math.cos(angle);
  const y = 100 - 90 * Math.sin(angle);
  return `M 10 100 A 90 90 0 0 1 ${x.toFixed(3)} ${y.toFixed(3)}`;
}
const fullArc = gaugeArc(1);
export function SpendingProgress({ summary }: { summary: SpendingSummary }) {
  const { overall, month } = summary;
  const historical = isHistorical(summary);
  const allowance = overall.allocationOere + overall.carriedInOere;
  const fractionLeft =
    allowance > 0 ? Math.max(0, Math.min(1, overall.remainingOere / allowance)) : null;
  const overBudget = overall.overspentOere > 0;
  const amount = formatDkk(overBudget ? overall.overspentOere : overall.remainingOere);
  const label = overBudget
    ? 'Over budget'
    : historical
      ? `Remaining in ${monthLabel(month)}`
      : 'Left after bills and savings';
  const { width, fontScale } = useWindowDimensions();
  const size = Math.min(312, width - 2 * spacing.screen);
  const stacked = fontScale > 1.25 || size < 250 || amount.length > 14;
  const outsideCoverage = outsideActivityCoverage(summary);
  const status = outsideCoverage
    ? 'Plan estimate'
    : overall.limitations.length
      ? 'Provisional'
      : undefined;
  const progressLabel = outsideCoverage
    ? undefined
    : fractionLeft === null
      ? 'No spending allocation'
      : `${Math.round(fractionLeft * 100)}% left`;
  const figures = (
    <View style={[styles.figures, !stacked && styles.inside]}>
      <AppText variant="small" style={styles.text}>
        {label}
      </AppText>
      <AppText
        variant="title"
        adjustsFontSizeToFit={!stacked}
        numberOfLines={stacked ? undefined : 1}
        style={styles.amount}
      >
        {amount}
      </AppText>
    </View>
  );
  const diameter = stacked ? Math.min(size, 160) : size;
  return (
    <View
      accessible
      accessibilityLabel={[label, amount, status, progressLabel].filter(Boolean).join(', ')}
      style={styles.card}
    >
      <View style={[styles.gauge, { width: diameter, height: diameter * 0.55 }]}>
        <View
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width="100%" height="100%" viewBox="0 0 200 110">
            <Defs>
              <LinearGradient
                id="spendingSpectrum"
                gradientUnits="userSpaceOnUse"
                x1={10}
                y1={100}
                x2={190}
                y2={100}
              >
                {gaugeColors.map((color, index) => (
                  <Stop key={color} offset={index / (gaugeColors.length - 1)} stopColor={color} />
                ))}
              </LinearGradient>
            </Defs>
            <Path
              d={fullArc}
              stroke={colors.line}
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
            />
            {fractionLeft !== null && fractionLeft > 0 ? (
              <Path
                d={gaugeArc(fractionLeft)}
                stroke="url(#spendingSpectrum)"
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>
        {!stacked && figures}
      </View>
      {stacked && figures}
      {progressLabel ? (
        <AppText variant="small" style={styles.text}>
          {progressLabel}
        </AppText>
      ) : null}
      {status ? (
        <AppText variant="small" style={styles.text}>
          {status}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.small },
  gauge: { alignItems: 'center', justifyContent: 'flex-end' },
  figures: { alignItems: 'center', gap: spacing.small },
  inside: { width: '68%', paddingBottom: spacing.small },
  amount: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  text: { textAlign: 'center' },
});

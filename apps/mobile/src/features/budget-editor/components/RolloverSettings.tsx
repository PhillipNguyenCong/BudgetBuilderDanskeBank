import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import type { DraftWidget } from '../editor/draft';
import { RolloverDestinationPicker } from './RolloverDestinationPicker';
import { RolloverSavingsTarget } from './RolloverSavingsTarget';

export function RolloverSettings({
  widget,
  savings,
  onChange,
}: {
  widget: DraftWidget;
  savings: DraftWidget[];
  onChange: (widget: DraftWidget) => void;
}) {
  if (widget.type !== 'SPENDING' || !widget.rollover) return null;
  const value = widget.rollover;
  const set = (rollover: NonNullable<DraftWidget['rollover']>) => onChange({ ...widget, rollover });
  return (
    <View style={styles.content}>
      <AppText variant="label">Month-end preference</AppText>
      <AppText variant="small">
        Optional. Your choice is saved, but automatic month-end processing is not available in this
        prototype yet.
      </AppText>
      <View style={styles.toggle}>
        <AppText>Automatic rollover</AppText>
        <Switch
          accessibilityLabel={`${widget.name} automatic rollover`}
          value={value.enabled}
          onValueChange={(enabled) =>
            set(
              !enabled &&
                (!value.destination || (value.destination === 'TO_SAVINGS' && !value.targetPotId))
                ? { enabled: false, destination: null, targetPotId: null }
                : { ...value, enabled },
            )
          }
        />
      </View>
      {value.enabled ? (
        <>
          <RolloverDestinationPicker widgetName={widget.name} value={value} onChange={set} />
          {value.destination === 'TO_SAVINGS' ? (
            <RolloverSavingsTarget
              widgetName={widget.name}
              value={value}
              savings={savings}
              onChange={set}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: spacing.medium,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: spacing.large,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
});

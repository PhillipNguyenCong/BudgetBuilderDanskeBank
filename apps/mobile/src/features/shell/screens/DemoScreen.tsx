import { Screen } from '../../../foundation/components/Screen';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
export function DemoScreen({ title }: { title: string }) {
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <Card>
        <AppText variant="label">Demo screen</AppText>
        <AppText>This section is not available in this prototype.</AppText>
      </Card>
    </Screen>
  );
}

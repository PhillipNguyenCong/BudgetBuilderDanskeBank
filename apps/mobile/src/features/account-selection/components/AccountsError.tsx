import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
export function AccountsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <AppText accessibilityRole="alert">{message}</AppText>
      <Button label="Try again" onPress={onRetry} />
    </>
  );
}

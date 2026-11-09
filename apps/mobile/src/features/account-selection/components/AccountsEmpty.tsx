import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';

export function AccountsEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <AppText variant="heading">No accounts available</AppText>
      <AppText>No accounts were returned for this demo user.</AppText>
      <Button label="Try again" onPress={onRetry} />
    </>
  );
}

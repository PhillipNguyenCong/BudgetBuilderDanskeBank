import { AppText } from '../../../foundation/components/AppText';
import { type AccountSelectionData } from '../api/accounts';

export function AccountHistory({
  quality,
}: {
  quality: AccountSelectionData['accounts']['quality'];
}) {
  return (
    <>
      <AppText variant="small">
        Available history: {quality.coverage.from ?? 'Unknown start'} to{' '}
        {quality.coverage.to ?? 'unknown end'} ({quality.coverage.completeMonths} complete months).
      </AppText>
      {quality.issues.length > 0 ? (
        <AppText variant="small">
          Some source data is incomplete or uncertain. Available history may contain gaps.
        </AppText>
      ) : null}
    </>
  );
}

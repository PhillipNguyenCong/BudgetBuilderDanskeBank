import { AllocationGuidance } from './AllocationGuidance';
import type { AllocationProgress } from '@budget-builder/budget-core/allocations';

export function WidgetAllocationStatus({ progress }: { progress: AllocationProgress }) {
  return <AllocationGuidance progress={progress} compact />;
}

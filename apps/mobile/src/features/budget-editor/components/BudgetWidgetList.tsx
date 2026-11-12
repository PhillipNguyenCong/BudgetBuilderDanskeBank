import { allocationProgress } from '../editor/allocationProgress';
import { type DraftWidget } from '../editor/draft';
import { BudgetWidget } from './BudgetWidget';

export function BudgetWidgetList({
  widgets,
  progress,
  onOpen,
  onChange,
  onAmountBlur,
}: {
  widgets: DraftWidget[];
  progress: ReturnType<typeof allocationProgress>;
  onOpen: (id: string) => void;
  onChange: (widget: DraftWidget) => void;
  onAmountBlur: (rowId: string) => void;
}) {
  return (
    <>
      {widgets.map((widget) => (
        <BudgetWidget
          key={widget.id}
          widget={widget}
          progress={progress}
          onOpen={() => onOpen(widget.id)}
          onChange={onChange}
          onAmountBlur={onAmountBlur}
        />
      ))}
    </>
  );
}

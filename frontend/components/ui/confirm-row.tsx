export function ConfirmRow({ label, onConfirm, onCancel }: {
  label: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-1 items-center gap-2 text-sm">
      <span className="flex-1">{label}</span>
      <button onClick={onConfirm} className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700">Yes</button>
      <button autoFocus onClick={onCancel} className="rounded border border-stone-300 px-2 py-1 dark:border-stone-600">Cancel</button>
    </div>
  );
}
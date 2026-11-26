
type Props = {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmRow({ label, onConfirm, onCancel }: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-1 items-center gap-2 text-sm"
    >
      <span className="flex-1">{label}</span>

      <button
        type="button"
        onClick={onConfirm}
        className="rounded bg-red-600 px-2 py-1 text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Yes
      </button>

      <button
        type="button"
        autoFocus
        onClick={onCancel}
        className="rounded border border-stone-300 px-2 py-1 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:border-stone-600 dark:hover:bg-stone-800"
      >
        Cancel
      </button>
    </div>
  );
}

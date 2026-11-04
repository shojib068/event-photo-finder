export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-8 text-stone-600">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
      <span>{label}</span>
    </div>
  );
}

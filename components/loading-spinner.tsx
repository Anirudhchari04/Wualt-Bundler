export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-600" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
      <span>{label}</span>
    </div>
  );
}

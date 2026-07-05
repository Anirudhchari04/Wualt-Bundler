export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <div>
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-0.5 text-red-800">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Retry
        </button>
      ) : null}
    </div>
  );
}

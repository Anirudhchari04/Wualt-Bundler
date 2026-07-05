import type { Bundle, Pagination, ProductionStage } from "@/types/bundle";

type ApiErrorBody = {
  error?: { message?: string; details?: unknown };
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function getBundles(page = 1, limit = 100) {
  return request<{ data: Bundle[]; pagination: Pagination }>(
    `/api/bundles?page=${page}&limit=${limit}`,
  );
}

export async function getAllBundles() {
  const first = await getBundles(1, 100);
  if (first.pagination.totalPages <= 1) return first.data;

  const remaining = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) =>
      getBundles(index + 2, 100),
    ),
  );
  return [first.data, ...remaining.map((page) => page.data)].flat();
}

export async function getBundle(id: string) {
  const response = await request<{ data: Bundle }>(`/api/bundles/${encodeURIComponent(id)}`);
  return response.data;
}

export async function advanceBundle(
  bundleId: string,
  stage: ProductionStage,
  deviceId: string,
) {
  const response = await request<{
    data: { bundle: Bundle; duplicate: boolean };
  }>(`/api/bundles/${encodeURIComponent(bundleId)}/scan`, {
    method: "POST",
    body: JSON.stringify({
      clientId: crypto.randomUUID(),
      stage,
      scannedAt: new Date().toISOString(),
      deviceId,
    }),
  });
  return response.data.bundle;
}

export async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiClientError(
      body.error?.message ?? "The request could not be completed.",
      response.status,
      body.error?.details,
    );
  }
  return body;
}

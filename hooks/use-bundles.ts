"use client";

import { useCallback, useEffect, useState } from "react";

import { getAllBundles } from "@/services/api-client";
import { getCachedBundles, cacheBundles } from "@/offline/db";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { Bundle } from "@/types/bundle";

export function useBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const online = useOnlineStatus();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (online) {
        const bundles = await getAllBundles();
        setBundles(bundles);
        await cacheBundles(bundles);
      } else {
        setBundles(await getCachedBundles());
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bundles.");
    } finally {
      setLoading(false);
    }
  }, [online]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleBundleUpdated = () => {
      void refresh();
    };

    window.addEventListener("bundle-updated", handleBundleUpdated);
    return () => window.removeEventListener("bundle-updated", handleBundleUpdated);
  }, [refresh]);

  return { bundles, loading, error, refresh };
}

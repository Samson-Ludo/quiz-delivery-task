import type { ReconcileResponse } from "./types";

export const fetchReconcile = async (clientId: string, lastSeq: number): Promise<ReconcileResponse> => {
  const params = new URLSearchParams({
    clientId,
    lastSeq: String(lastSeq)
  });
  const response = await fetch(`/reconcile?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Reconcile failed with status ${response.status}`);
  }

  return (await response.json()) as ReconcileResponse;
};

export type ProductionStage = "CUTTING" | "SEWING" | "FINISHING" | "PACKING";
export type BundleStatus = "ACTIVE" | "FLAGGED" | "COMPLETED";

export type ScanLog = {
  id: string;
  clientId: string;
  bundleId: string;
  stage: ProductionStage;
  scannedAt: string;
  receivedAt: string;
  deviceId: string;
  flagged: boolean;
  flagReason: string | null;
};

export type Bundle = {
  id: string;
  orderId: string;
  style: string;
  size: string;
  quantity: number;
  currentStage: ProductionStage;
  status: BundleStatus;
  createdAt: string;
  updatedAt: string;
  scanLogs: ScanLog[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

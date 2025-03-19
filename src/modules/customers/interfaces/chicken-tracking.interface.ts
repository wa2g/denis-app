export interface PendingDelivery {
  orderDate: Date;
  quantity: number;
  expectedDeliveryDate: Date;
}

export interface BatchProgressEntry {
  date: Date;
  currentCount: number;
  sickCount: number;
  deadCount: number;
  soldCount: number;
  averageWeight: number;
  averageAge: number;
  bandaCondition: string;
  notes?: string;
}

export interface BatchInfo {
  initialCount: number;
  currentCount: number;
  startDate: Date;
  bandaCondition: string;
  lastInspectionDate: Date;
  progressHistory: BatchProgressEntry[];
}

export interface HealthStatus {
  sickCount: number;
  deadCount: number;
  soldCount: number;
  averageWeight: number;
  averageAge: number;
}

export interface EnhancedHealthStatus extends HealthStatus {
  mortalityRate: number;
  survivalRate: number;
}

export interface BatchHistoryEntry extends Omit<BatchInfo, 'progressHistory'> {
  endDate: Date | null;
  healthStatus: EnhancedHealthStatus;
  progressHistory: BatchProgressEntry[];
}

export interface FarmVisit {
  date: Date;
  purpose: string;
  findings: string;
  recommendations: string;
}

export interface ChickenTracking {
  totalOrdered: number;
  totalReceived: number;
  lastDeliveryDate: Date | null;
  pendingDeliveries: PendingDelivery[];
  currentBatch: BatchInfo | null;
  healthStatus: HealthStatus | null;
  batchHistory: BatchHistoryEntry[];
  farmVisits: FarmVisit[];
} 
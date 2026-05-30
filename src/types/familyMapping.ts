// Family mapping job status types
export type FamilyMappingStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface FamilyMappingJobData {
  jobId: number;
  status: FamilyMappingStatus;
  progressPercentage: number;
  totalVoters: number;
  processedVoters: number;
  familiesCreated: number;
  votersWithFamilies?: number;
  uniqueHouseNumbers?: number;
  selectedParts?: number[];
  currentPartNo?: number;
  totalParts?: number;
  processedParts?: number;
  cancelRequested?: boolean;
  lastHeartbeatAt?: string;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
  estimatedEndTime?: string;
}

export interface FamilyMappingResponse {
  status: string;
  code: number;
  message: string;
  data: FamilyMappingJobData;
}

export interface FamilyMappingStatusCheckResponse {
  data: boolean;
}

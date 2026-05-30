import { message, notification } from "antd";
import { getProcessingStatus, ProcessingStatusResponse } from "../api/photoProcessingApi";

export interface ProcessingJob {
  jobId: string;
  partNo: string;
  electionId: number;
  fileName: string;
  startTime: string;
  status: "STARTED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  isActive: boolean;
}

class PhotoProcessingService {
  private static instance: PhotoProcessingService;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeJobs: Map<string, ProcessingJob> = new Map();
  private listeners: Map<string, Set<(job: ProcessingJob) => void>> = new Map();

  private constructor() {
    // Load persisted jobs from localStorage on initialization
    this.loadPersistedJobs();
  }

  public static getInstance(): PhotoProcessingService {
    if (!PhotoProcessingService.instance) {
      PhotoProcessingService.instance = new PhotoProcessingService();
    }
    return PhotoProcessingService.instance;
  }

  // Start monitoring a new job
  public startJob(
    jobId: string,
    partNo: string,
    electionId: number,
    fileName: string
  ): void {
    const job: ProcessingJob = {
      jobId,
      partNo,
      electionId,
      fileName,
      startTime: new Date().toISOString(),
      status: "STARTED",
      progress: 0,
      isActive: true,
    };

    this.activeJobs.set(jobId, job);
    this.persistJobs();
    this.startPolling(jobId);
    
    // Show notification
    notification.info({
      message: "Photo Processing Started",
      description: `Processing PDF for Part ${partNo}`,
      duration: 3,
    });
  }

  // Start polling for a specific job
  private startPolling(jobId: string): void {
    if (this.pollingIntervals.has(jobId)) {
      return; // Already polling
    }

    const interval = setInterval(async () => {
      try {
        const response = await getProcessingStatus(jobId);
        this.updateJobStatus(jobId, response);
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        // Continue polling even on error, might be temporary network issue
      }
    }, 3000); // Poll every 3 seconds

    this.pollingIntervals.set(jobId, interval);
  }

  // Update job status and notify listeners
  private updateJobStatus(jobId: string, response: ProcessingStatusResponse): void {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    const wasActive = job.isActive;
    const previousStatus = job.status;

    // Update job with new status
    const updatedJob: ProcessingJob = {
      ...job,
      status: response.status,
      progress: response.progress,
      isActive: !response.isCompleted,
    };

    this.activeJobs.set(jobId, updatedJob);
    this.persistJobs();

    // Stop polling if job is completed
    if (response.isCompleted) {
      this.stopPolling(jobId);
      
      // Show completion notification
      if (response.status === "COMPLETED") {
        notification.success({
          message: "Photo Processing Completed",
          description: `Successfully processed ${response.successfulUpdates || 0} photos for Part ${job.partNo}`,
          duration: 5,
        });
      } else if (response.status === "FAILED") {
        notification.error({
          message: "Photo Processing Failed",
          description: response.message || "Processing failed with unknown error",
          duration: 5,
        });
      }
    }

    // Notify all listeners
    const jobListeners = this.listeners.get(jobId);
    if (jobListeners) {
      jobListeners.forEach((listener) => listener(updatedJob));
    }

    // Global listeners (for any job updates)
    const globalListeners = this.listeners.get("*");
    if (globalListeners) {
      globalListeners.forEach((listener) => listener(updatedJob));
    }
  }

  // Stop polling for a specific job
  private stopPolling(jobId: string): void {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  // Subscribe to job updates
  public subscribe(jobId: string, listener: (job: ProcessingJob) => void): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const jobListeners = this.listeners.get(jobId);
      if (jobListeners) {
        jobListeners.delete(listener);
        if (jobListeners.size === 0) {
          this.listeners.delete(jobId);
        }
      }
    };
  }

  // Get current job status
  public getJob(jobId: string): ProcessingJob | undefined {
    return this.activeJobs.get(jobId);
  }

  // Get all active jobs
  public getActiveJobs(): ProcessingJob[] {
    return Array.from(this.activeJobs.values()).filter(job => job.isActive);
  }

  // Get all jobs (active and completed)
  public getAllJobs(): ProcessingJob[] {
    return Array.from(this.activeJobs.values());
  }

  // Check if any job is currently active
  public hasActiveJobs(): boolean {
    return this.getActiveJobs().length > 0;
  }

  // Remove a job from tracking
  public removeJob(jobId: string): void {
    this.stopPolling(jobId);
    this.activeJobs.delete(jobId);
    this.listeners.delete(jobId);
    this.persistJobs();
  }

  // Clear completed jobs
  public clearCompletedJobs(): void {
    const activeJobIds = this.getActiveJobs().map(job => job.jobId);
    
    // Remove all non-active jobs
    this.activeJobs.forEach((job, jobId) => {
      if (!activeJobIds.includes(jobId)) {
        this.removeJob(jobId);
      }
    });
  }

  // Persist jobs to localStorage
  private persistJobs(): void {
    try {
      const jobsArray = Array.from(this.activeJobs.values());
      localStorage.setItem("photoProcessingJobs", JSON.stringify(jobsArray));
    } catch (error) {
      console.error("Error persisting jobs:", error);
    }
  }

  // Load persisted jobs from localStorage
  private loadPersistedJobs(): void {
    try {
      const stored = localStorage.getItem("photoProcessingJobs");
      if (stored) {
        const jobs: ProcessingJob[] = JSON.parse(stored);
        jobs.forEach((job) => {
          this.activeJobs.set(job.jobId, job);
          
          // Resume polling for active jobs
          if (job.isActive) {
            this.startPolling(job.jobId);
          }
        });
      }
    } catch (error) {
      console.error("Error loading persisted jobs:", error);
      // Clear corrupted data
      localStorage.removeItem("photoProcessingJobs");
    }
  }

  // Cleanup on app close
  public cleanup(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    this.listeners.clear();
  }
}

export default PhotoProcessingService;

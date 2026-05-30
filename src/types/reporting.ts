// Types for parsed reporting data structures (after JSON field parsing)

export interface KeyValueCount { key: string; count: number; }

export interface BoothProgressEntry { booth: string; total: number; voted: number; }
export interface PartyCountEntry { partyId: string; count: number; }
export interface IssueCountEntry { issueType: string; count: number; }
export interface ContactStatusEntry { status: string; count: number; }

export interface AgeGroupEntry { group: string; registered: number; voted: number; pct: number; }
export interface HourlyTurnoutEntry { hour: string; voted: number; }
export interface BoothSummaryEntry { booth: string; total: number; voted: number; pct: number; lastVote?: string; }

export interface CadrePerformanceEntry { cadreId: number|string; name?: string; total_voter_created?: number; total_voter_updated?: number; }

// UI unified slice state shape suggestion (if adopting global state or hook)
export interface SliceState<T> {
  data: T | null; // parsed structure
  rawJson?: string; // original json string field
  loading: boolean;
  error?: string;
  etag?: string;
  refreshedAt?: string;
  freshnessSeconds?: number;
}

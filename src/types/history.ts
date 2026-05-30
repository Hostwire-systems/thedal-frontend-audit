export interface VoterHistory {
  key: string;
  id: number;
  voterHistoryName: string;
  voterHistoryImage: string | null | File;
  voterCount:number;
  orderIndex: number|null;
}

export interface PartyType {
  key: string;
  id: number;
  partyName: string;
  partyShortName: string;
  voterCount: number;
  partyImage: string; // Image URL or Base64 encoded image
  orderIndex: number | null;
}

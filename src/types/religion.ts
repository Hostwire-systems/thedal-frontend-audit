export interface ReligionType {
  key: string;
  id: number;
  religionName: string;
  religionImage: string | null | File;
  voterCount: number;
  orderIndex:number|null;
}

import { RcFile } from "antd/es/upload";
import moment from "moment";

export interface ElectionsCardProps {
  image: string;
  title: string;
  description: string;
  viewLink: string;
  id: number;
  electionType: string;
  electionCategory:string;
  category: string;
  electionBody:string;
  electionBodyString:string;
  electionState:string;
  electionReleaseData:string;
  electionsList: any[];
  isFrozen?: boolean;
}

export interface ElectionStep1FormValues {
  electionPicture: {
    file: {
      originFileObj: RcFile;
    };
  };
  electionName: string;
  electionDescription: string;
  category: null;
  stateName: null;
  year: null;
  month: null;
  orderIndex:string;
  status: null;
  state:string;
  country: string;
  states: string[];
  booths: string[];
  electionDate: [moment.Moment, moment.Moment];
  startDate: string;
  endDate: string;
  electionType: string;
  electionBody:string;
  numberOfPollingStation: string;
  electoralReleaseDate: string;
  location1: string;
  location2: string;
  location3: string;
  numberOfPinkBooths: string;
  numberOfVoters: string;
  numberOfMaleVoters: string;
  numberOfFemaleVoters: string;
  numberOfTransgenderVoters: string;
  notificationDate: string; // ISO string (e.g., "2024-11-27T10:40:46.006Z")
  scrutinyNominationDate: string; // ISO string
  lastDateForFillingNomination: string; // ISO string
  lastDateForWithdrawalOfNomination: string; // ISO string
  dateOfPoll: string; // ISO string
  dateOfCountingOfVotes: string;
  remarks: string;
}

export interface Election {
  picture: string;
  numberOfBooths: number;
  description: string;
  state: string;
  orderIndex:string;
  electionName: string;
  electionDate: string;
  country: string;
  electionType: string;
}

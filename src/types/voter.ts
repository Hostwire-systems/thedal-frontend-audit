// types.ts
import { RcFile } from "antd/es/upload";

export interface VoterData {
  electionId: string;
  voterImage?: RcFile | null;
  gender: string;
  latitude: number;
  longitude: number;
  availability: string;
  religion: string;
  religionId?: string;
  casteId?: string;
  subCasteId?: string;
  sub_caste?: string;
  caste?: string;
  remarks?: string;
  booth_number: string | number;
  voter_id: string;
  epic_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  age: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country: string;
  };
  phone_number?: string;
  alternate_phone_number?: string;
  whatsapp_number?: string;
  secondary_email?: string;
  email?: string;
  party_affiliation?: string;
  photo_url?: string;
  localBody?: string;
  stateCode?: string;
  stateName?: string;
  stateNameL1?: string;
  stateNameL2?: string;
  parliamentNo?: string;
  parliamentName?: string;
  parliamentNameL1?: string;
  parliamentNameL2?: string;
  assemblyNo?: string;
  assemblyName?: string;
  assemblyNameL1?: string;
  assemblyNameL2?: string;
  sectionNo?: string;
  sectionName?: string;
  serialNumber?: string;
  relationName?: string;
  relationNameL1?: string;
  relationNameL2?: string;
  relationType?: string;
  urbanName?: string;
  urbanNameL1?: string;
  urbanNameL2?: string;
  urbanWardNo?: string;
  districtNo?: string;
  districtName?: string;
  districtNameL1?: string;
  districtNameL2?: string;
  districtUnionName?: string;
  districtUnionNameL1?: string;
  districtUnionNameL2?: string;
  districtUnionWardNo?: string;
  panchayatUnionName?: string;
  panchayatUnionNameL1?: string;
  panchayatUnionNameL2?: string;
  panchayatUnionWardNo?: string;
  villagePanchayatName?: string;
  villagePanchayatNameL1?: string;
  villagePanchayatNameL2?: string;
  villagePanchayatWardNo?: string;
  partNo?: string;
  partName?: string;
  partNameL1?: string;
  partNameL2?: string;
  HOUSE_NO_EN?: string;
  HOUSE_NO_L1?: string;
  HOUSE_NO_L2?: string;
  RLN_FNAME_EN?: string;
  RLN_LNAME_EN?: string;
  RLN_FNAME_L1?: string;
  RLN_LNAME_L1?: string;
  RLN_FNAME_L2?: string;
  RLN_LNAME_L2?: string;
  SECTION_NAME_L1?: string;
  SECTION_NAME_L2?: string;
  schemeName?: string;
  schemeBy?: string;
}

export interface Religion {
  key: string;
  religionId: string | number;
  orderIndex: number;
  voterCount: number;
  religionName: string;
  religionImage?: string;
}

export interface Caste {
  key: string;
  casteId: string | number;
  casteName: string;
  orderIndex: number;
  voterCount: number;
  religionId: number;
  religionName: string;
}
export interface SubCaste {
  key: string;
  subCasteName: string;
  casteName: string;
  orderIndex: number;
  religionName: string;
}

export interface Party {
  key: string;
  partyName: string;
  partyShortName: string;
  partyImage: string;
}
export interface BenefitScheme {
  id?: number;
  key: string;
  schemeName: string;
  imageUrl: string;
  schemeBy: string;
}

export interface SchemeStatus {
  schemeId: number;
  selected: boolean | null;
}

export interface Availability {
  key: string;
  description: string;
  categoryName: string;
  availabilityImage?: string | null;
  orderIndex: number | null;
}
export interface LanguageType {
  id: number;
  key: string;
  languageName: string;
}

export interface EditVoterModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpdate: (voter: VoterData) => void;
  voter: VoterData;
}

export interface FormSectionProps {
  form: any;
  loading?: boolean;
  data?: {
    religions?: Religion[];
    castes?: Caste[];
    subCastes?: SubCaste[];
    parties?: Party[];
  };
  handlers?: {
    onReligionAdd?: () => void;
    onCasteAdd?: () => void;
    onSubCasteAdd?: () => void;
    onPartyAdd?: () => void;
    onLocationDetect?: () => void;
  };
  selectedValues?: {
    religionId?: string;
    casteId?: string;
    casteName?: string;
  };
}

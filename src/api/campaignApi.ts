import axios from "axios";
import { message } from "antd";
import { BASE_URL } from "../config";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export interface SimpleItem {
  id: string;
  name: string;
}

export interface FilterOptionsResponse {
  parts: number[];
  sectionsByPart: Record<number, SimpleItem[]>;
  castes: SimpleItem[];
  subCastes: SimpleItem[];
  casteCategories: SimpleItem[];
  religions: SimpleItem[];
  parties: SimpleItem[];
  availabilities: SimpleItem[];
  ageRanges: { id: string; name: string }[]; // code + label
  genders: string[];
  tags: string[];
}

export interface CampaignFilters {
  electionId?: number;
  accountId?: number;
  partNos?: number[];
  sectionIds?: string[];
  casteIds?: number[];
  subCasteIds?: number[];
  casteCategoryIds?: number[];
  religionIds?: number[];
  partyIds?: number[];
  availabilityIds?: number[];
  pollStatus?: string[]; // ["voted", "notVoted"]
  ageRange?: string; // e.g. "18-25"
  gender?: string; // male|female|other
  tags?: string[];
  aadhaarVerified?: boolean | null;
  membershipVerified?: boolean | null;
}

export interface CampaignButton {
  type: "url" | "call" | "quick_reply";
  label: string;
  value?: string;
}

export interface CampaignMedia {
  mediaId?: string;
  caption?: string;
}

export interface CampaignCreateRequest {
  channel: "whatsapp" | "sms";
  title: string;
  senderId: string;
  language: string;
  contentHtml: string;
  buttons?: CampaignButton[];
  media?: CampaignMedia | null;
  tags?: string[];
  filters: CampaignFilters;
  schedule?: { when: string };
}

export interface CampaignResponse extends CampaignCreateRequest {
  id: string;
  status: string;
  createdAt?: string;
  scheduledAt?: string;
  recipientsCount?: number;
}

export interface EstimateRequest {
  channel: "whatsapp" | "sms";
  filters: CampaignFilters;
}

export interface EstimateResponse {
  count: number;
}

export interface WhatsAppSender {
  id: string;
  display: string;
}

export interface SmsSender {
  id: string;
  display: string;
  senderName: string; // 6-char alphanumeric sender ID
}

export const getFilterOptions = async (
  electionId?: number,
  accountId?: number
): Promise<FilterOptionsResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(`${BASE_URL}/api/comm/filters`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
    params: { electionId, accountId },
  });
  return res.data;
};

export const listWhatsAppSenders = async (): Promise<WhatsAppSender[]> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(`${BASE_URL}/api/whatsapp/senders`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const listSmsSenders = async (): Promise<SmsSender[]> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(`${BASE_URL}/api/sms/senders`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const estimateCampaign = async (
  payload: EstimateRequest
): Promise<EstimateResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.post(`${BASE_URL}/api/campaigns/estimate`, payload, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const createCampaign = async (
  payload: CampaignCreateRequest
): Promise<CampaignResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.post(`${BASE_URL}/api/campaigns`, payload, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const sendCampaign = async (
  id: string
): Promise<CampaignResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.post(`${BASE_URL}/api/campaigns/${id}/send`, null, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const listCampaigns = async (
  params?: { channel?: string; status?: string; q?: string }
): Promise<CampaignResponse[]> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(`${BASE_URL}/api/campaigns`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
    params,
  });
  return res.data;
};

export const getCampaign = async (id: string): Promise<CampaignResponse> => {
  const jwtToken = await getjwtToken();
  const res = await axios.get(`${BASE_URL}/api/campaigns/${id}`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return res.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const jwtToken = await getjwtToken();
  await axios.delete(`${BASE_URL}/api/campaigns/${id}`, {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
};

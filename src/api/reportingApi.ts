import axios from 'axios';
import { message } from 'antd';
import { BASE_URL } from '../config';

/*
 Reporting API client implementing slices documented in reporting-api-full.md
 Pattern:
  - GET snapshot
  - POST recompute
  - Both require auth (Bearer token) except internal diagnostic (maybe protected too)
  - PollingDate optional for poll-day endpoints
*/

const getJwtToken = () => localStorage.getItem('jwtToken');

// ---- Shared Types ---- //
export interface BaseAggregateMeta {
  accountId: number;
  electionId: number;
  computedAt?: string; // may be absent on recompute minimal responses
  refreshedAt?: string;
  freshnessSeconds?: number;
  pollingDate?: string; // only poll-day slices
  // ETag surfaced by server via header; optionally pass through from hook layer
  _etag?: string;
}

// Each slice specific fields (JSON string fields stay string here; helpers parse)
export interface ElectionStatsAggregate extends BaseAggregateMeta {
  partNo?: string;
  totalVoters?: number;
  votersWithPhoto?: number;
  votersWithoutPhoto?: number;
  totalBooth?:number,
  totalSchool?:number,
  totalSection?:number,
  distinctMobileCount?:number,
  totalMobileCount?:number,
  whatsappNumberCount?:number,
  maleMobileCount?:number,
  femaleMobileCount?:number,
  transgenderMobileCount?:number,
  dateOfBirth?:number,
  maleDateOfBirthCount?:number,
  femaleDateOfBirthCount?:number,
  transgenderDateOfBirthCount?:number,
  totalFamily?:number,
  crossBoothFamily?:number,
  oneVoterFamily?:number,
  male?: number; female?: number; transgender?: number;
  age18To30?: number; age30To40?: number; age40To50?: number; age50To60?: number;
  age60To70?: number; ageGreaterThan70?: number;
  firstTimeVoters?: number; seniorCitizens?: number; superSeniors?: number;
  starVoters?: number;
  maleStarVoters?: number;
  femaleStarVoters?: number;
  transgenderStarVoters?: number;
  totalStarVoters?: number;
  addressedVoters?: number;
  unaddressedVoters?: number;
  voterSlipCount?: number;
  uniqueVoterSlipCount?: number;
  familySlipCount?: number;
  benefitSlipCount?: number;
  whatsappCount?: number;
  smsCount?: number;
  voiceCallCount?: number;
  schemesCount?: number;
  religionCount?: number;
  casteCategoryCount?: number;
  casteCount?: number;
  subCasteCount?: number;
  languageCount?: number;
  partyAffiliationCount?: number;
}

export interface ElectionSectionBreakdownRow {
  partNo: number;
  sectionNo: number;
  sectionNameEnglish?: string | null;
  sectionNameL1?: string | null;
  maleVotes: number;
  femaleVotes: number;
  otherVotes: number;
  totalVotes: number;
}

export interface DemographicsAggregate extends BaseAggregateMeta {
  casteJson?: string;
  subCasteJson?: string;
  religionJson?: string;
  casteCategoryJson?: string;
  availabilityJson?: string;
  schemesJson?: string;
  languageJson?: string;
  relationJson?: string;
  voterSlipJson?: string;
  familySlipJson?: string;
  smsJson?: string;
  whatsappJson?: string;
}

export interface BoothProgressAggregate extends BaseAggregateMeta { boothProgressJson?: string; }
export interface PartyPollingAggregate extends BaseAggregateMeta { partyCountsJson?: string; }
export interface FeedbackIssuesAggregate extends BaseAggregateMeta { issueCountsJson?: string; issuesJson?: string; }
export interface ContactStatusAggregate extends BaseAggregateMeta { contactStatusJson?: string; }
export interface CadreDashboardAggregate extends BaseAggregateMeta {
  totalCadres?: number; cadresLogged?: number; cadresNotLogged?: number;
  boothsAssigned?: number;
  totalMobileUpdated?: number; totalDobUpdated?: number; totalPartyUpdated?: number; totalCasteUpdated?: number; totalReligionUpdated?: number; totalLanguageUpdated?: number;
  top10CadresJson?: string; least10CadresJson?: string; // server returns arrays maybe as JSON string; adapt when integrating
}
export interface PollDayHourlyAggregate extends BaseAggregateMeta { hourlyJson?: string; }
export interface PollDayAgeGroupsAggregate extends BaseAggregateMeta { ageGroupsJson?: string; }
export interface PollDayWardAgeGroupsAggregate extends BaseAggregateMeta { ageGroupsJson?: string; ageGroupBreakdownJson?: string; partNumber?: string; }
export interface PollDayBoothSummaryAggregate extends BaseAggregateMeta { boothSummaryJson?: string; }

// Part-wise Polling Data
export interface PartWisePollingData {
  partNumber: number;
  totalVoters: number;
  polled2025: number;
  polled2024?: number;
  didNotVote: number;
  turnoutPercentage: number;
  lastUpdated?: string;
}

export interface PollDayPartWisePollingAggregate extends BaseAggregateMeta {
  parts?: PartWisePollingData[];
  summary?: {
    totalParts: number;
    totalVoters: number;
    totalPolled2025: number;
    totalPolled2024?: number;
    overallTurnoutPercentage: number;
    computedAt?: string;
  };
}

// Family-wise Polling Data
export interface FamilyWisePollingData {
  partNumber: number;
  totalFamilies: number;
  votedFamilies?: number;
  fullyVotedFamilies?: number;
  notVotedFamilies: number;
  partiallyVotedFamilies: number;
  votingPercentage: number;
  timestamp?: string;
}

export interface PollDayFamilyWisePollingAggregate extends BaseAggregateMeta {
  parts?: FamilyWisePollingData[];
  summary?: {
    totalParts: number;
    totalFamilies: number;
    totalVotedFamilies: number;
    partiallyVotedFamilies?: number; // Optional until backend implements
    notVotedFamilies: number;
    totalNotVotedFamilies: number;
    overallVotingPercentage: number;
    timestamp?: string;
  };
}

export interface ReplicaLagInfo { replicaLagSeconds: number; source?: string; [k: string]: any }

// ---- Async Recompute Job Types ----
export type JobStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type JobType = 'ELECTION_STATS';

export interface AsyncRecomputeResponse {
  jobId: string;
  message: string;
}

export interface JobStatusData {
  jobId: string;
  accountId: number;
  electionId: number;
  jobType: JobType;
  status: JobStatus;
  partNumber: string | null;
  totalParts: number;
  completedParts: number;
  progressPercent: number;
  startedAt: string;
  completedAt: string | null;
  elapsedSeconds: number;
  errorMessage: string | null;
}

export interface JobStatusResponse {
  status: 'success' | 'failure';
  code: number;
  message: string;
  data?: JobStatusData;
}

export interface JobListResponse {
  status: 'success' | 'failure';
  code: number;
  message: string;
  data?: JobStatusData[];
}

export interface CancelJobResponse {
  status: 'success' | 'failure';
  code: number;
  message: string;
  data?: {
    jobId: string;
    message: string;
  };
}

// ---- Family API Types ----
export interface FamilyMember {
  name: string;
  epicNumber: string;
  age: number | null;
  gender: string;
  partNo: number;
  serialNo: number | null;
  mobileNo: string;
  rlnType: string | null;
  voterFnameEn: string;
  voterLnameEn: string | null;
  voterFnameL1: string | null;
  voterLnameL1: string | null;
  rlnFnameEn: string | null;
  rlnLnameEn: string | null;
  rlnFnameL1: string | null;
  rlnLnameL1: string | null;
  memberVerified: boolean;
  aadhaarVerified: boolean;
  availabilityId: number | null;
  partyId: number | null;
  aadhaarNumber: string;
  panNumber: string;
  photoUrl: string | null;
  availabilityName: string | null;
  partyName: string | null;
}

export interface Family {
  familyId: string;
  familySequenceNumber: number;
  memberCount: number;
  firstMember: FamilyMember;
}

export interface GenderStats {
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  totalCount: number;
}

export interface FamilyListResponse {
  content: Family[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface FamilyApiResponse {
  status: string;
  code: number;
  message: string;
  data: {
    families: FamilyListResponse;
    genderStats: GenderStats;
    totalVotersCount: number;
  };
}

// ---- Role & Permission Types ----
export type Permission = 'C' | 'R' | 'U' | 'D';

export interface RolePermissions {
  [resource: string]: Permission[];
}

export interface Role {
  id: number;
  roleName: string;
  description: string;
  permissions: RolePermissions;
}

// Poll Day Filters Interface
export interface PollDayFilters {
  parties?: string[];
  religions?: string[];
  casteCategories?: string[];
  castes?: string[];
  subCastes?: string[];
  languages?: string[];
  schemes?: string[];
  genders?: string[];
  minAge?: number;
  maxAge?: number;
  includeUnknownAge?: boolean;
  hasMobileNo?: boolean;
  hasWhatsappNo?: boolean;
  star?: boolean;
}

export interface GraphAggregateFilters {
  parties?: string[];
  religions?: string[];
  castes?: string[];
  subCastes?: string[];
  languages?: string[];
  schemes?: string[];
  ageGroups?: string[];
}

// Chart Configuration Types
export interface ChartConfig {
  id: string;
  selectedParts: number[];
  viewType?: "bar" | "line" | "table" | "stacked";
  yAxisType?:
    | "party"
    | "religion"
    | "caste"
    | "subcaste"
    | "age"
    | "language"
    | "schemes"
    | "familyCount"
    | "voterCount"
    | "voterSlip"
    | "familySlip"
    | "whatsapp"
    | "sms"
    | "sectionVoterCount";
  customTitle?: string;
  chartColor?: string;
  order?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  sortOrder?: "asc" | "desc";
  sortType?: string | null;
  chartType?: "voterCount" | "familyCount" | "schemeVoterCount" | "sectionVoterCount" | null;
  actualChartId?: string;
  chartId?: string;
  filters?: PollDayFilters;
  showPercentage?: boolean;
  showCompleteness?: boolean;
  selectedSchemeId?: number;
  selectedSchemeName?: string;
  selectedCategoryLabels?: string[];
  secondaryFilterType?:
    | "party"
    | "religion"
    | "caste"
    | "subcaste"
    | "age"
    | "language"
    | "schemes"
    | null;
  secondaryFilterValues?: string[];
}

export interface PollDayChartConfigRequest {
  accountId: number;
  electionId: number;
  charts: ChartConfig[];
}

export interface PollDayChartConfigResponse {
  id?: number;
  accountId: number;
  electionId: number;
  charts: ChartConfig[];
  "refresh-time"?: number; // Refresh interval in milliseconds
  createdAt?: string;
  updatedAt?: string;
}

// Utility: build headers
const authHeaders = () => ({ Authorization: `Bearer ${getJwtToken()}` });

const inFlightReportingGetRequests = new Map<string, Promise<any>>();

const buildReportingGetRequestKey = (url: string, params?: any, ifNoneMatch?: string) =>
  JSON.stringify({ url, params: params || null, ifNoneMatch: ifNoneMatch || null });

// Generic GET helper capturing ETag
async function getWithEtag<T>(url: string, params?: any, ifNoneMatch?: string): Promise<T & { _etag?: string; _notModified?: boolean; }> {
  const requestKey = buildReportingGetRequestKey(url, params, ifNoneMatch);

  if (!inFlightReportingGetRequests.has(requestKey)) {
    const requestPromise = (async () => {
      try {
        const { data, headers } = await axios.get(url, {
          params,
          headers: {
            ...authHeaders(),
            'Cache-Control': 'no-cache',
            ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}),
          },
        });
        const etag = headers['etag'] as string | undefined;

        // Handle array responses - attach etag to the array object itself
        if (Array.isArray(data)) {
          const result = data as any;
          result._etag = etag;
          return result;
        }

        return { ...(data as T), _etag: etag };
      } catch (e: any) {
        if (e.response?.status === 304) {
          return { _etag: ifNoneMatch, _notModified: true } as any;
        }
        if (e.response?.status === 404) {
          // Surface empty slice gracefully
          return {} as any;
        }
        if (e.response?.status !== 401) {
          message.error(e.response?.data?.message || 'Failed to fetch reporting data');
        }
        throw e;
      } finally {
        inFlightReportingGetRequests.delete(requestKey);
      }
    })();

    inFlightReportingGetRequests.set(requestKey, requestPromise);
  }

  return inFlightReportingGetRequests.get(requestKey)!;
}

async function postRecompute<T>(url: string, params?: any): Promise<T> {
  try {
    const { data, headers } = await axios.post(url, {}, { params, headers: authHeaders() });
    const etag = headers['etag'] as string | undefined;
    return { ...(data as T), _etag: etag };
  } catch (e: any) {
    if (e.response?.status === 429) {
      const now = Date.now();
      const lastShownAt = (postRecompute as any)._lastRateLimitMessageAt ?? 0;
      if (now - lastShownAt >= 10000) {
        (postRecompute as any)._lastRateLimitMessageAt = now;
        message.warning(e.response?.data?.message || 'Rate limit: please wait before recomputing');
      }
    } else if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to recompute slice');
    }
    throw e;
  }
}

// Base path constants
const AGG_BASE = '/reporting/api/aggregates/election';
const API_BASE = '/api/reporting';
const API_BASE_CADRE = '/reporting/api/aggregates/cadre';

// Helper function to merge JSON string fields from multiple parts
function mergeJsonCounts(jsonStrings: (string | undefined)[]): string {
  const merged: Record<string, number> = {};
  
  jsonStrings.forEach(jsonStr => {
    if (!jsonStr) return;
    try {
      const obj = JSON.parse(jsonStr);
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'number') {
          merged[key] = (merged[key] || 0) + value;
        }
      });
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  });
  
  return JSON.stringify(merged);
}

// Helper function to merge ElectionStatsAggregate array into single object
function mergeElectionStats(statsArray: ElectionStatsAggregate[]): ElectionStatsAggregate {
  if (statsArray.length === 0) return {} as ElectionStatsAggregate;
  if (statsArray.length === 1) return statsArray[0];
  
  const merged: ElectionStatsAggregate = {
    accountId: statsArray[0].accountId,
    electionId: statsArray[0].electionId,
    computedAt: statsArray[0].computedAt,
    refreshedAt: statsArray[0].refreshedAt,
    totalVoters: 0,
    totalBooth: 0,
    totalSchool: 0,
    totalSection: 0,
    distinctMobileCount: 0,
    totalMobileCount: 0,
    whatsappNumberCount: 0,
    maleMobileCount: 0,
    femaleMobileCount: 0,
    transgenderMobileCount: 0,
    dateOfBirth: 0,
    maleDateOfBirthCount: 0,
    femaleDateOfBirthCount: 0,
    transgenderDateOfBirthCount: 0,
    totalFamily: 0,
    male: 0,
    female: 0,
    transgender: 0,
    age18To30: 0,
    age30To40: 0,
    age40To50: 0,
    age50To60: 0,
    age60To70: 0,
    ageGreaterThan70: 0,
    firstTimeVoters: 0,
    seniorCitizens: 0,
    superSeniors: 0,
    starVoters: 0,
    maleStarVoters: 0,
    femaleStarVoters: 0,
    transgenderStarVoters: 0,
    totalStarVoters: 0,
    addressedVoters: 0,
    unaddressedVoters: 0,
    voterSlipCount: 0,
    uniqueVoterSlipCount: 0,
    familySlipCount: 0,
    benefitSlipCount: 0,
    whatsappCount: 0,
    smsCount: 0,
    voiceCallCount: 0,
  };
  
  statsArray.forEach(stat => {
    merged.totalVoters = (merged.totalVoters || 0) + (stat.totalVoters || 0);
    merged.totalBooth = (merged.totalBooth || 0) + (stat.totalBooth || 0);
    merged.totalSchool = (merged.totalSchool || 0) + (stat.totalSchool || 0);
    merged.totalSection = (merged.totalSection || 0) + (stat.totalSection || 0);
    merged.distinctMobileCount = (merged.distinctMobileCount || 0) + (stat.distinctMobileCount || 0);
    merged.totalMobileCount = (merged.totalMobileCount || 0) + (stat.totalMobileCount || 0);
    merged.maleMobileCount = (merged.maleMobileCount || 0) + (stat.maleMobileCount || 0);
    merged.femaleMobileCount = (merged.femaleMobileCount || 0) + (stat.femaleMobileCount || 0);
    merged.transgenderMobileCount = (merged.transgenderMobileCount || 0) + (stat.transgenderMobileCount || 0);
    merged.dateOfBirth = (merged.dateOfBirth || 0) + (stat.dateOfBirth || 0);
    merged.maleDateOfBirthCount = (merged.maleDateOfBirthCount || 0) + (stat.maleDateOfBirthCount || 0);
    merged.femaleDateOfBirthCount = (merged.femaleDateOfBirthCount || 0) + (stat.femaleDateOfBirthCount || 0);
    merged.transgenderDateOfBirthCount = (merged.transgenderDateOfBirthCount || 0) + (stat.transgenderDateOfBirthCount || 0);
    merged.totalFamily = (merged.totalFamily || 0) + (stat.totalFamily || 0);
    merged.male = (merged.male || 0) + (stat.male || 0);
    merged.female = (merged.female || 0) + (stat.female || 0);
    merged.transgender = (merged.transgender || 0) + (stat.transgender || 0);
    merged.age18To30 = (merged.age18To30 || 0) + (stat.age18To30 || 0);
    merged.age30To40 = (merged.age30To40 || 0) + (stat.age30To40 || 0);
    merged.age40To50 = (merged.age40To50 || 0) + (stat.age40To50 || 0);
    merged.age50To60 = (merged.age50To60 || 0) + (stat.age50To60 || 0);
    merged.age60To70 = (merged.age60To70 || 0) + (stat.age60To70 || 0);
    merged.ageGreaterThan70 = (merged.ageGreaterThan70 || 0) + (stat.ageGreaterThan70 || 0);
    merged.firstTimeVoters = (merged.firstTimeVoters || 0) + (stat.firstTimeVoters || 0);
    merged.seniorCitizens = (merged.seniorCitizens || 0) + (stat.seniorCitizens || 0);
    merged.superSeniors = (merged.superSeniors || 0) + (stat.superSeniors || 0);
    merged.starVoters = (merged.starVoters || 0) + (stat.starVoters || 0);
    merged.maleStarVoters = (merged.maleStarVoters || 0) + (stat.maleStarVoters || 0);
    merged.femaleStarVoters = (merged.femaleStarVoters || 0) + (stat.femaleStarVoters || 0);
    merged.transgenderStarVoters = (merged.transgenderStarVoters || 0) + (stat.transgenderStarVoters || 0);
    merged.totalStarVoters = (merged.totalStarVoters || 0) + (stat.totalStarVoters || stat.starVoters || 0);
    merged.addressedVoters = (merged.addressedVoters || 0) + (stat.addressedVoters || 0);
    merged.unaddressedVoters = (merged.unaddressedVoters || 0) + (stat.unaddressedVoters || 0);
    merged.voterSlipCount = (merged.voterSlipCount || 0) + (stat.voterSlipCount || 0);
    merged.uniqueVoterSlipCount = (merged.uniqueVoterSlipCount || 0) + (stat.uniqueVoterSlipCount || 0);
    merged.familySlipCount = (merged.familySlipCount || 0) + (stat.familySlipCount || 0);
    merged.benefitSlipCount = (merged.benefitSlipCount || 0) + (stat.benefitSlipCount || 0);
    merged.whatsappCount = (merged.whatsappCount || 0) + (stat.whatsappCount || 0);
    merged.smsCount = (merged.smsCount || 0) + (stat.smsCount || 0);
    merged.voiceCallCount = (merged.voiceCallCount || 0) + (stat.voiceCallCount || 0);
  });
  
  return merged;
}

// Helper function to merge DemographicsAggregate array into single object
function mergeDemographics(demoArray: DemographicsAggregate[]): DemographicsAggregate {
  if (demoArray.length === 0) return {} as DemographicsAggregate;
  if (demoArray.length === 1) return demoArray[0];
  
  return {
    accountId: demoArray[0].accountId,
    electionId: demoArray[0].electionId,
    computedAt: demoArray[0].computedAt,
    refreshedAt: demoArray[0].refreshedAt,
    casteJson: mergeJsonCounts(demoArray.map(d => d.casteJson)),
    subCasteJson: mergeJsonCounts(demoArray.map(d => d.subCasteJson)),
    religionJson: mergeJsonCounts(demoArray.map(d => d.religionJson)),
    casteCategoryJson: mergeJsonCounts(demoArray.map(d => d.casteCategoryJson)),
    availabilityJson: mergeJsonCounts(demoArray.map(d => d.availabilityJson)),
    schemesJson: mergeJsonCounts(demoArray.map(d => d.schemesJson)),
    languageJson: mergeJsonCounts(demoArray.map(d => d.languageJson)),
    relationJson: mergeJsonCounts(demoArray.map(d => d.relationJson)),
  };
}

// Helper function to merge PartyPollingAggregate array into single object
function mergePartyPolling(partyArray: PartyPollingAggregate[]): PartyPollingAggregate {
  if (partyArray.length === 0) return {} as PartyPollingAggregate;
  if (partyArray.length === 1) return partyArray[0];
  
  return {
    accountId: partyArray[0].accountId,
    electionId: partyArray[0].electionId,
    computedAt: partyArray[0].computedAt,
    refreshedAt: partyArray[0].refreshedAt,
    partyCountsJson: mergeJsonCounts(partyArray.map(p => p.partyCountsJson)),
  };
}

// ---- Election Stats ----
export const getElectionStats = async (electionId: number, ifNoneMatch?: string, partNumbers?: number[]) => {
  const params = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  const response = await getWithEtag<ElectionStatsAggregate | ElectionStatsAggregate[]>(`${BASE_URL}${AGG_BASE}/${electionId}`, params, ifNoneMatch);
  
  // If multiple parts requested, API returns array - merge into single object
  if (Array.isArray(response)) {
    const merged = mergeElectionStats(response);
    return { ...merged, _etag: (response as any)._etag } as ElectionStatsAggregate & { _etag?: string; _notModified?: boolean; };
  }
  
  return response as ElectionStatsAggregate & { _etag?: string; _notModified?: boolean; };
};

export const getElectionSectionBreakdown = async (
  electionId: number,
  partNumbers?: number[]
) => {
  const params = partNumbers && partNumbers.length > 0
    ? { partNumber: partNumbers.join(',') }
    : undefined;

  const { data } = await axios.get<ElectionSectionBreakdownRow[]>(
    `${BASE_URL}${AGG_BASE}/${electionId}/sections`,
    { params, headers: authHeaders() }
  );

  return data;
};

const withGraphFilters = (params: any, filters?: GraphAggregateFilters) => {
  if (!filters) return params;

  const result = { ...(params || {}) };
  if (filters.parties?.length) result.parties = filters.parties.join(',');
  if (filters.religions?.length) result.religions = filters.religions.join(',');
  if (filters.castes?.length) result.castes = filters.castes.join(',');
  if (filters.subCastes?.length) result.subCastes = filters.subCastes.join(',');
  if (filters.languages?.length) result.languages = filters.languages.join(',');
  if (filters.schemes?.length) result.schemes = filters.schemes.join(',');
  if (filters.ageGroups?.length) result.ageGroups = filters.ageGroups.join(',');
  return result;
};

// Get part-wise stats without merging (for breakdown tables)
export const getElectionStatsPartWise = async (
  electionId: number,
  partNumbers?: number[],
  filters?: GraphAggregateFilters
) => {
  const baseParams = partNumbers && partNumbers.length > 0
    ? { partNumber: partNumbers.join(','), breakdown: true }
    : { breakdown: true };
  const response = await getWithEtag<ElectionStatsAggregate | ElectionStatsAggregate[]>(
    `${BASE_URL}${AGG_BASE}/${electionId}`,
    withGraphFilters(baseParams, filters)
  );
  
  // Return array as-is without merging
  if (Array.isArray(response)) {
    if (!partNumbers || partNumbers.length === 0) {
      return response as ElectionStatsAggregate[];
    }

    const requestedPartNumbers = partNumbers.map(String);
    const requestedPartSet = new Set(requestedPartNumbers);
    const usedPartNumbers = new Set<string>();

    return (response as ElectionStatsAggregate[]).map((item) => {
      const returnedPartNumber = item.partNo ? String(item.partNo) : undefined;

      if (
        returnedPartNumber &&
        requestedPartSet.has(returnedPartNumber) &&
        !usedPartNumbers.has(returnedPartNumber)
      ) {
        usedPartNumbers.add(returnedPartNumber);
        return item;
      }

      const fallbackPartNumber = requestedPartNumbers.find(
        (partNumber) => !usedPartNumbers.has(partNumber)
      );

      if (!fallbackPartNumber) {
        return item;
      }

      usedPartNumbers.add(fallbackPartNumber);

      return {
        ...item,
        partNo: fallbackPartNumber,
      };
    });
  }
  
  // If single object returned, wrap in array
  return [response] as ElectionStatsAggregate[];
};

// Updated recompute with async support
export const recomputeElectionStats = async (
  electionId: number, 
  partNumbers?: number[], 
  forceAsync?: boolean
): Promise<ElectionStatsAggregate | AsyncRecomputeResponse> => {
  const params: any = {};
  if (partNumbers && partNumbers.length > 0) {
    params.partNumber = partNumbers.join(',');
  }
  if (forceAsync !== undefined) {
    params.async = forceAsync;
  }

  try {
    const { data, status } = await axios.post(
      `${BASE_URL}${AGG_BASE}/${electionId}/recompute`,
      {},
      { params, headers: authHeaders() }
    );

    // 202 = Async job started
    if (status === 202) {
      return data as AsyncRecomputeResponse;
    }

    // 200 = Synchronous response
    return data as ElectionStatsAggregate;
  } catch (e: any) {
    if (e.response?.status === 429) {
      message.warning('Too Many Requests - wait before recompute');
    } else if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to recompute stats');
    }
    throw e;
  }
};

// Get job status
export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/reporting/api/aggregates/jobs/${jobId}/status`,
      { headers: authHeaders() }
    );
    return data as JobStatusResponse;
  } catch (e: any) {
    if (e.response?.status === 404) {
      return {
        status: 'failure',
        code: 50000,
        message: 'Job not found'
      };
    }
    throw e;
  }
};

// List recent jobs
export const listRecentJobs = async (electionId: number, limit: number = 10): Promise<JobListResponse> => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/reporting/api/aggregates/jobs`,
      { 
        params: { electionId, limit: Math.min(limit, 50) },
        headers: authHeaders() 
      }
    );
    return data as JobListResponse;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error('Failed to fetch jobs');
    }
    throw e;
  }
};

// Cancel job
export const cancelJob = async (jobId: string): Promise<CancelJobResponse> => {
  try {
    const { data } = await axios.delete(
      `${BASE_URL}/reporting/api/aggregates/jobs/${jobId}`,
      { headers: authHeaders() }
    );
    return data as CancelJobResponse;
  } catch (e: any) {
    if (e.response?.status === 400) {
      message.error('Cannot cancel job (not found or already completed/failed)');
    } else if (e.response?.status !== 401) {
      message.error('Failed to cancel job');
    }
    throw e;
  }
};

// ---- Demographics ----
export const getDemographics = async (electionId: number, ifNoneMatch?: string, partNumbers?: number[]) => {
  const params = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  const response = await getWithEtag<DemographicsAggregate | DemographicsAggregate[]>(`${BASE_URL}${AGG_BASE}/demographics/${electionId}`, params, ifNoneMatch);
  
  // If multiple parts requested, API returns array - merge into single object
  if (Array.isArray(response)) {
    const merged = mergeDemographics(response);
    return { ...merged, _etag: (response as any)._etag } as DemographicsAggregate & { _etag?: string; _notModified?: boolean; };
  }
  
  return response as DemographicsAggregate & { _etag?: string; _notModified?: boolean; };
};
export const recomputeDemographics = (electionId: number, partNumbers?: number[]) => {
  const params = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  return postRecompute<DemographicsAggregate>(`${BASE_URL}${AGG_BASE}/demographics/${electionId}/recompute`, params);
};

// ---- Booth Progress ----
export const getBoothProgress = (electionId: number, ifNoneMatch?: string) =>
  getWithEtag<BoothProgressAggregate>(`${BASE_URL}${AGG_BASE}/booth-progress/${electionId}`, undefined, ifNoneMatch);
export const recomputeBoothProgress = (electionId: number) =>
  postRecompute<BoothProgressAggregate>(`${BASE_URL}${AGG_BASE}/booth-progress/${electionId}/recompute`);

// ---- Party Polling ----
export const getPartyPolling = async (electionId: number, ifNoneMatch?: string, partNumbers?: number[]) => {
  const params = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  const response = await getWithEtag<PartyPollingAggregate | PartyPollingAggregate[]>(`${BASE_URL}${AGG_BASE}/party-polling/${electionId}`, params, ifNoneMatch);
  
  // If multiple parts requested, API returns array - merge into single object
  if (Array.isArray(response)) {
    const merged = mergePartyPolling(response);
    return { ...merged, _etag: (response as any)._etag } as PartyPollingAggregate & { _etag?: string; _notModified?: boolean; };
  }
  
  return response as PartyPollingAggregate & { _etag?: string; _notModified?: boolean; };
};
export const recomputePartyPolling = (electionId: number, partNumbers?: number[]) => {
  const params = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  return postRecompute<PartyPollingAggregate>(`${BASE_URL}${AGG_BASE}/party-polling/${electionId}/recompute`, params);
};

// ---- Feedback Issues ----
export const getFeedbackIssues = (electionId: number, ifNoneMatch?: string) =>
  getWithEtag<FeedbackIssuesAggregate>(`${BASE_URL}${AGG_BASE}/feedback-issues/${electionId}`, undefined, ifNoneMatch);
export const recomputeFeedbackIssues = (electionId: number) =>
  postRecompute<FeedbackIssuesAggregate>(`${BASE_URL}${AGG_BASE}/feedback-issues/${electionId}/recompute`);

// ---- Contact Status ----
export const getContactStatus = (electionId: number, ifNoneMatch?: string) =>
  getWithEtag<ContactStatusAggregate>(`${BASE_URL}${AGG_BASE}/contact-status/${electionId}`, undefined, ifNoneMatch);
export const recomputeContactStatus = (electionId: number) =>
  postRecompute<ContactStatusAggregate>(`${BASE_URL}${AGG_BASE}/contact-status/${electionId}/recompute`);

// ---- Cadre Dashboard ----
export const getCadreDashboard = (electionId: number, ifNoneMatch?: string) =>
  getWithEtag<CadreDashboardAggregate>(`${BASE_URL}${API_BASE_CADRE}/${electionId}`, undefined, ifNoneMatch);
export const recomputeCadreDashboard = (electionId: number) =>
  postRecompute<CadreDashboardAggregate>(`${BASE_URL}${API_BASE_CADRE}/${electionId}/recompute`);

// ---- Poll-Day shared helper ----
const withPollingDate = (params: any, pollingDate?: string) => pollingDate ? { ...params, pollingDate } : params;

export const getPollDayHourly = (electionId: number, pollingDate?: string, ifNoneMatch?: string) =>
  getWithEtag<PollDayHourlyAggregate>(`${BASE_URL}${API_BASE}/poll-day/hourly`, withPollingDate({ electionId }, pollingDate), ifNoneMatch);
export const recomputePollDayHourly = (electionId: number, pollingDate?: string) =>
  postRecompute<PollDayHourlyAggregate>(`${BASE_URL}${API_BASE}/poll-day/hourly/recompute`, withPollingDate({ electionId }, pollingDate));

export const getPollDayAgeGroups = (electionId: number, pollingDate?: string, ifNoneMatch?: string) =>
  getWithEtag<PollDayAgeGroupsAggregate>(`${BASE_URL}${API_BASE}/poll-day/age-groups`, withPollingDate({ electionId }, pollingDate), ifNoneMatch);
export const recomputePollDayAgeGroups = (electionId: number, pollingDate?: string) =>
  postRecompute<PollDayAgeGroupsAggregate>(`${BASE_URL}${API_BASE}/poll-day/age-groups/recompute`, withPollingDate({ electionId }, pollingDate));

export const getPollDayWardAgeGroups = (electionId: number, partNumber?: string, pollingDate?: string, ifNoneMatch?: string) => {
  const params = withPollingDate({ electionId }, pollingDate);
  if (partNumber) params.partNumber = partNumber;
  return getWithEtag<PollDayWardAgeGroupsAggregate>(`${BASE_URL}${API_BASE}/poll-day/ward-age-groups`, params, ifNoneMatch);
};
export const recomputePollDayWardAgeGroups = (electionId: number, partNumber?: string, pollingDate?: string) => {
  const params = withPollingDate({ electionId }, pollingDate);
  if (partNumber) params.partNumber = partNumber;
  return postRecompute<PollDayWardAgeGroupsAggregate>(`${BASE_URL}${API_BASE}/poll-day/ward-age-groups/recompute`, params);
};

export const getPollDayBoothSummary = (electionId: number, pollingDate?: string, ifNoneMatch?: string) =>
  getWithEtag<PollDayBoothSummaryAggregate>(`${BASE_URL}${API_BASE}/poll-day/booth-summary`, withPollingDate({ electionId }, pollingDate), ifNoneMatch);
export const recomputePollDayBoothSummary = (electionId: number, pollingDate?: string) =>
  postRecompute<PollDayBoothSummaryAggregate>(`${BASE_URL}${API_BASE}/poll-day/booth-summary/recompute`, withPollingDate({ electionId }, pollingDate));

// ---- Part-wise Polling ----
// Note: Supports filtering by demographics
const withFilters = (params: any, filters?: PollDayFilters) => {
  if (!filters) return params;
  
  const result = { ...params };
  
  // Convert arrays to comma-separated strings
  if (filters.parties?.length) result.parties = filters.parties.join(',');
  if (filters.religions?.length) result.religions = filters.religions.join(',');
  if (filters.casteCategories?.length) result.casteCategories = filters.casteCategories.join(',');
  if (filters.castes?.length) result.castes = filters.castes.join(',');
  if (filters.subCastes?.length) result.subCastes = filters.subCastes.join(',');
  if (filters.languages?.length) result.languages = filters.languages.join(',');
  if (filters.schemes?.length) result.schemes = filters.schemes.join(',');
  if (filters.genders?.length) result.genders = filters.genders.join(',');
  
  // Add numeric filters
  if (filters.minAge !== undefined) result.minAge = filters.minAge;
  if (filters.maxAge !== undefined) result.maxAge = filters.maxAge;
  if (filters.includeUnknownAge !== undefined) result.includeUnknownAge = filters.includeUnknownAge;
  if (filters.hasMobileNo === true) result.hasMobileNo = true;
  if (filters.hasWhatsappNo === true) result.hasWhatsappNo = true;
  if (filters.star !== undefined) result.star = filters.star;
  
  return result;
};

export const getPollDayPartWisePolling = (
  electionId: number, 
  pollingDate?: string, 
  filters?: PollDayFilters,
  ifNoneMatch?: string
) => {
  const params = withPollingDate({ electionId }, pollingDate);
  const paramsWithFilters = withFilters(params, filters);
  return getWithEtag<PollDayPartWisePollingAggregate>(
    `${BASE_URL}${API_BASE}/poll-day/part-wise-polling`, 
    paramsWithFilters, 
    ifNoneMatch
  );
};

export const recomputePollDayPartWisePolling = (
  electionId: number, 
  pollingDate?: string,
  filters?: PollDayFilters
) => {
  const params = withPollingDate({ electionId }, pollingDate);
  const paramsWithFilters = withFilters(params, filters);
  return postRecompute<PollDayPartWisePollingAggregate>(
    `${BASE_URL}${API_BASE}/poll-day/part-wise-polling/recompute`, 
    paramsWithFilters
  );
};

// ---- Family-wise Polling ----
// Note: Supports filtering by demographics
export const getPollDayFamilyWisePolling = (
  electionId: number, 
  pollingDate?: string, 
  filters?: PollDayFilters,
  ifNoneMatch?: string
) => {
  const params = withPollingDate({ electionId }, pollingDate);
  const paramsWithFilters = withFilters(params, filters);
  return getWithEtag<PollDayFamilyWisePollingAggregate>(
    `${BASE_URL}${API_BASE}/poll-day/family-wise-polling`, 
    paramsWithFilters, 
    ifNoneMatch
  );
};

export const recomputePollDayFamilyWisePolling = (
  electionId: number, 
  pollingDate?: string,
  filters?: PollDayFilters
) => {
  const params = withPollingDate({ electionId }, pollingDate);
  const paramsWithFilters = withFilters(params, filters);
  return postRecompute<PollDayFamilyWisePollingAggregate>(
    `${BASE_URL}${API_BASE}/poll-day/family-wise-polling/recompute`, 
    paramsWithFilters
  );
};

// ---- Replica Lag (internal) ----
export const getReplicaLag = async (): Promise<ReplicaLagInfo | null> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/internal/replica/lag`, { headers: authHeaders() });
    return data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to load replica lag');
    }
    return null; // non-fatal
  }
};

// ---- Family API ----
export interface FamilyFilters {
  electionId: number;
  partNo?: number;
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getFamilies = async (filters: FamilyFilters): Promise<FamilyApiResponse> => {
  try {
    const params: any = { electionId: filters.electionId };
    if (filters.partNo) params.partNo = filters.partNo;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.size !== undefined) params.size = filters.size;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await axios.get(`${BASE_URL}/api/families`, { 
      params, 
      headers: authHeaders() 
    });
    return data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to fetch families');
    }
    throw e;
  }
};

export const getFamilyById = async (familyId: string): Promise<Family> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/families/${familyId}`, { 
      headers: authHeaders() 
    });
    return data.data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to fetch family details');
    }
    throw e;
  }
};

// ---- Roles API ----
export const getRoles = async (): Promise<Role[]> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/roles`, { 
      headers: authHeaders() 
    });
    return data.data || data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to fetch roles');
    }
    throw e;
  }
};

export const getRoleById = async (roleId: number): Promise<Role> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/roles/${roleId}`, { 
      headers: authHeaders() 
    });
    return data.data || data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to fetch role details');
    }
    throw e;
  }
};

// ---- Poll Day Chart Configuration ----
export const savePollDayChartConfig = async (
  electionId: number,
  charts: ChartConfig[],
  refreshTime?: number
): Promise<PollDayChartConfigResponse> => {
  try {
    const { data } = await axios.post(
      `${BASE_URL}${API_BASE}/poll-day/chart-config`,
      { electionId, charts, "refresh-time": refreshTime },
      { 
        params: { electionId },
        headers: authHeaders() 
      }
    );
    return data.data || data; // Handle both wrapped and unwrapped responses
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to save chart configuration');
    }
    throw e;
  }
};

export const getPollDayChartConfig = async (
  electionId: number
): Promise<PollDayChartConfigResponse | null> => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}${API_BASE}/poll-day/chart-config`,
      {
        params: { electionId },
        headers: authHeaders()
      }
    );
    return data.data || data; // Handle both wrapped and unwrapped responses
  } catch (e: any) {
    if (e.response?.status === 404) {
      return null; // No saved configuration
    }
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to load chart configuration');
    }
    throw e;
  }
};

export const deletePollDayChartConfig = async (
  electionId: number
): Promise<void> => {
  try {
    await axios.delete(
      `${BASE_URL}${API_BASE}/poll-day/chart-config`,
      {
        params: { electionId },
        headers: authHeaders()
      }
    );
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to delete chart configuration');
    }
    throw e;
  }
};

// ---- Graph Chart Configuration ----
export const saveGraphChartConfig = async (
  electionId: number,
  charts: ChartConfig[]
): Promise<PollDayChartConfigResponse> => {
  try {
    const { data } = await axios.post(
      `${BASE_URL}${API_BASE}/graphs/chart-config`,
      { electionId, charts },
      { 
        params: { electionId },
        headers: authHeaders() 
      }
    );
    return data.data || data;
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to save chart configuration');
    }
    throw e;
  }
};

export const getGraphChartConfig = async (
  electionId: number
): Promise<PollDayChartConfigResponse | null> => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}${API_BASE}/graphs/chart-config`,
      {
        params: { electionId },
        headers: authHeaders()
      }
    );
    return data.data || data;
  } catch (e: any) {
    if (e.response?.status === 404) {
      return null;
    }
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to load chart configuration');
    }
    throw e;
  }
};

export const deleteGraphChartConfig = async (
  electionId: number
): Promise<void> => {
  try {
    await axios.delete(
      `${BASE_URL}${API_BASE}/graphs/chart-config`,
      {
        params: { electionId },
        headers: authHeaders()
      }
    );
  } catch (e: any) {
    if (e.response?.status !== 401) {
      message.error(e.response?.data?.message || 'Failed to delete chart configuration');
    }
    throw e;
  }
};

// Part-wise data fetchers for Graphs Dashboard
export const getDemographicsPartWise = async (
  electionId: number,
  partNumbers?: number[],
  filters?: GraphAggregateFilters
) => {
  const baseParams = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  const response = await getWithEtag<DemographicsAggregate | DemographicsAggregate[]>(
    `${BASE_URL}${AGG_BASE}/demographics/${electionId}`,
    withGraphFilters(baseParams, filters)
  );
  
  if (Array.isArray(response)) {
    return response as DemographicsAggregate[];
  }
  return [response] as DemographicsAggregate[];
};

export const getPartyPollingPartWise = async (
  electionId: number,
  partNumbers?: number[],
  filters?: GraphAggregateFilters
) => {
  const baseParams = partNumbers && partNumbers.length > 0 ? { partNumber: partNumbers.join(',') } : undefined;
  const response = await getWithEtag<PartyPollingAggregate | PartyPollingAggregate[]>(
    `${BASE_URL}${AGG_BASE}/party-polling/${electionId}`,
    withGraphFilters(baseParams, filters)
  );
  
  if (Array.isArray(response)) {
    return response as PartyPollingAggregate[];
  }
  return [response] as PartyPollingAggregate[];
};

// ---- Parsing Helpers (optional) ----
export function safeParseMap<T = Record<string, any>>(maybeJson?: string): T | null {
  if (!maybeJson) return null; try { return JSON.parse(maybeJson) as T; } catch { return null; }
}

export function derivePct(numerator?: number, denominator?: number): number | null {
  if (!denominator || denominator === 0 || numerator == null) return null; return +( (numerator/denominator) * 100 ).toFixed(2);
}

export default {
  getElectionStats,
  getElectionStatsPartWise,
  recomputeElectionStats,
  getJobStatus,
  listRecentJobs,
  cancelJob,
  getDemographics,
  recomputeDemographics,
  getBoothProgress,
  recomputeBoothProgress,
  getPartyPolling,
  recomputePartyPolling,
  getFeedbackIssues,
  recomputeFeedbackIssues,
  getContactStatus,
  recomputeContactStatus,
  getCadreDashboard,
  recomputeCadreDashboard,
  getPollDayHourly,
  recomputePollDayHourly,
  getPollDayAgeGroups,
  recomputePollDayAgeGroups,
  getPollDayBoothSummary,
  recomputePollDayBoothSummary,
  getPollDayPartWisePolling,
  recomputePollDayPartWisePolling,
  getPollDayFamilyWisePolling,
  recomputePollDayFamilyWisePolling,
  savePollDayChartConfig,
  getPollDayChartConfig,
  deletePollDayChartConfig,
  saveGraphChartConfig,
  getGraphChartConfig,
  deleteGraphChartConfig,
  getDemographicsPartWise,
  getPartyPollingPartWise,
  getReplicaLag,
  getFamilies,
  getFamilyById,
  getRoles,
  getRoleById,
  safeParseMap,
  derivePct,
};

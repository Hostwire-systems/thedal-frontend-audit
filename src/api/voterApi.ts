import { message } from "antd";
import axios from "axios";
import { BASE_URL } from "../config";
import moment from "moment";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export interface PollDayVoteUpdatePayload {
  epicNumber: string;
  hasVoted: boolean;
  votedTimestamp?: string;
}

export interface PollDayVoteBatchRequestPayload {
  partNo: number;
  updates: PollDayVoteUpdatePayload[];
}

interface GetVotersParams {
  electionId: string | number;
  boothNumber?: (string | number)[];
  hasMobileNo?: boolean;
  hasWhatsappNo?: boolean;
  epic_number?: string;
  serial_number?: string;
  voterId?: string;
  familyId?: string | number;
  voterFnameEn?: string;
  relationFirstNameEn?: string;
  gender?: string | string[];
  minAge?: number;
  maxAge?: number;
  religion?: string | string[];
  casteName?: string | string[];
  casteCategoryName?: string | string[];
  subcaste?: string | string[];
  party?: string | string[];
  voterHistoryName?: string | string[];
  categoryDescription?: string | string[];
  includeUnknownAge?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  pollStatus?:string;
  order?: "asc" | "desc";
  addressed?: boolean | null;
  hasPhoto?: boolean | null;
  photoUploadedFrom?: string | null;
  photoUploadedTo?: string | null;
  schemeId?: number | null;
  includePollStats?: boolean;
  signal?: AbortSignal;
  [key: string]: any; // for otherParams or dynamic keys
}

// export const normalizeApiFieldName = (apiFieldName: string): string => {
//   const mapping: Record<string, string> = {
//     mobileNo: "mobileNumber",
//     whatsappNo: "whatsappNumber", 
//     eMail: "email",
//     dob: "date_of_birth",
//     RELIGION: "religion",
//     CASTE_CATEGORY: "casteCategory",
//     CASTE: "caste",
//     SUB_CASTE: "sub_caste",
//     partyAffiliation: "party_affiliation",
//     availability: "availability",
//     scheme: "scheme",
//     VOTER_HISTORY: "voterHistory",
//     FEEDBACK: "feedback",
//     LANGUAGE: "languages",
//     aadhaarNumber: "aadhaarNumber",
//     panNumber: "panNumber",
//     remarks: "remarks",
//     voterLati: "voterLatitude",
//     voterLongi: "voterLongitude",
//     starNumber: "starNumber",
//     partyRegistrationNumber: "partyRegistrationNumber",
//     age: "age"
//   };

//   return mapping[apiFieldName] || apiFieldName;
// };

export const normalizeApiFieldNameForConfig = (apiFieldName: string): string => {
  const mapping: Record<string, string> = {
    "mobileNo": "mobileNo",
    "whatsappNo": "whatsapp_number", 
    "eMail": "email",
    "dob": "date_of_birth",
    "RELIGION": "religion",
    "CASTE_CATEGORY": "casteCategory",
    "CASTE": "caste",
    "SUB_CASTE": "sub_caste",
    "LANGUAGE": "languages",
    "VOTER_HISTORY": "voterHistory",
    "FEEDBACK": "feedback",
    "age": "age",
    "starNumber": "starNumber",
    "aadhaarNumber": "aadhaarNumber",
    "panNumber": "panNumber",
    "partyRegistrationNumber": "partyRegistrationNumber",
    "availability": "availability",
    "partyAffiliation": "party_affiliation",
    "scheme": "scheme",
    "remarks": "remarks",
    "voterLati": "voterLati",
    "voterLongi": "voterLongi",
  };

  return mapping[apiFieldName] || apiFieldName;
};


export const getVotersApi = async ({
  electionId,
  boothNumber, // optional, can be single or array
  hasMobileNo,
  hasWhatsappNo,
  epic_number, // optional (string or undefined)
  serial_number, // optional (string or undefined)
  voterId, // optional (string or undefined)
  familyId,
   mobileNo,
   voterFnameEn,
   // relationName,
   relationFirstNameEn,
   gender,
   age,
  minAge,
  maxAge,
  religion,
  casteName,
  casteCategoryName,
  subcaste,
  party,
  voterHistoryName,
  categoryDescription,
  includeUnknownAge = true,
  page = 0,
  size = 10,
  pollStatus="",
  sortBy = "part_number,serial_number", // default sort by serial_number
  order = "asc", // default ascending order
  signal,
  photoUploadedFrom,
  photoUploadedTo,
  hasPhoto,
  house_no,
  ...otherParams
}: GetVotersParams) => {
  try {
    const jwtToken = await getjwtToken();

    // Base query parameters
    const params: Pick<GetVotersParams, "page" | "size" | "sortBy" | "order"> &
      Record<string, any> = {
      page,
      size,
      sortBy,
      order,
      ...otherParams,
    };
    console.log("Params inside getvotersapi", params);

    // Conditionally add boothNumber
    if (
      boothNumber !== null &&
      boothNumber !== undefined &&
      boothNumber?.length !== 0
    ) {
      if (Array.isArray(boothNumber)) {
        // Convert multiple booth numbers to a comma-separated string
        params["booth-number"] = boothNumber.join(",");
      } else {
        // Single booth number
        params["booth-number"] = boothNumber;
      }
    }

    // Conditionally add voterId if present
    if (voterId) {
      params["epic-number"] = voterId;
    }
    if (epic_number) {
      params["epic-number"] = epic_number;
    }
    if (serial_number) {
      params["serial-no"] = serial_number;
    }
    if (voterFnameEn) {
      params["voterFnameEn"] = voterFnameEn;
    }
    if(mobileNo){
      params["mobileNo"] = mobileNo;
    }
    if (hasMobileNo === true) {
      params["hasMobileNo"] = true;
    }
    if (hasWhatsappNo === true) {
      params["hasWhatsappNo"] = true;
    }
    if(age){
      params["age"] = age;
    }
    // if (voterName) {
    //   params["voterName"] = voterName;
    // }
    // if (relationName) {
    //   params["relationName"] = relationName;
    // }
    if (relationFirstNameEn) {
      params["relationFirstNameEn"] = relationFirstNameEn;
    }
    if (familyId) {
      params["family-id"] = familyId;
    }
    if (order) {
      params["order"] = order;
    }

    if (Array.isArray(gender) && gender.length > 0) {
      params["gender"] = gender.join(",");
    }

    // Handle age filters
    if (minAge !== undefined) {
      params["minAge"] = minAge;
    }
    if (maxAge !== undefined) {
      params["maxAge"] = maxAge;
    }
    params["includeUnknownAge"] = !!includeUnknownAge;

    if (Array.isArray(religion) && religion.length > 0) {
      params["religion"] = religion.join(",");
    } else if (religion && !Array.isArray(religion)) {
      params["religion"] = religion;
    }
    
    if (Array.isArray(casteName) && casteName.length > 0) {
      params["casteName"] = casteName.join(",");
    } else if (casteName && !Array.isArray(casteName)) {
      params["casteName"] = casteName;
    }
    
    if (Array.isArray(subcaste) && subcaste.length > 0) {
      params["subCaste"] = subcaste.join(",");
    } else if (subcaste && !Array.isArray(subcaste)) {
      params["subCaste"] = subcaste;
    }
    
    if (Array.isArray(casteCategoryName) && casteCategoryName.length > 0) {
      params["casteCategoryName"] = casteCategoryName.join(",");
    } else if (casteCategoryName && !Array.isArray(casteCategoryName)) {
      params["casteCategoryName"] = casteCategoryName;
    }

    if (Array.isArray(party) && party.length > 0) {
      params["party"] = party.join(",");
    } else if (party && !Array.isArray(party)) {
      params["party"] = party;
    }

    if (Array.isArray(voterHistoryName) && voterHistoryName.length > 0) {
      params["voterHistoryName"] = voterHistoryName.join(",");
    } else if (voterHistoryName && !Array.isArray(voterHistoryName)) {
      params["voterHistoryName"] = voterHistoryName;
    }

    if (Array.isArray(categoryDescription) && categoryDescription.length > 0) {
      params["catagoryDescription"] = categoryDescription.join(",");
    } else if (categoryDescription && !Array.isArray(categoryDescription)) {
      params["catagoryDescription"] = categoryDescription;
    }
    if(pollStatus.length===1){
      params["pollStatus"]=pollStatus[0];
    }
    
    // Add addressed filter
    if (typeof addressed === "boolean") {
      params["addressed"] = addressed;
    }

    // Add photo filter
    if (hasPhoto !== null && hasPhoto !== undefined) {
      params["hasPhoto"] = hasPhoto;
    }

    // Add photo uploaded date range filter
    if (photoUploadedFrom) {
      params["photoUploadedFrom"] = photoUploadedFrom;
    }
    if (photoUploadedTo) {
      params["photoUploadedTo"] = photoUploadedTo;
    }
    if (house_no) {
      params["house-no"] = house_no;
    }
    
    console.log("boothNumbers", params["booth-number"]);
    console.log("voterId", voterId);
    console.log("electionId", electionId);
    console.log("params", params);

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
        signal,
      }
    );

    console.log("GetVoters response:", response.data);
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

/**
 * Requests an OTP to reset all voted voters to non-voted status.
 */
export const requestResetVotersOtpApi = async (electionId: number) => {
  const jwtToken = await getjwtToken();
  try {
    const response = await axios.post(
      `${BASE_URL}/api/cpanel/reset-votes/${electionId}/send-otp`,
      {},
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

/**
 * Verifies the OTP to reset all voted voters to non-voted status.
 */
export const verifyResetVotersOtpApi = async (electionId: number, otp: string) => {
  const jwtToken = await getjwtToken();
  try {
    const response = await axios.post(
      `${BASE_URL}/api/cpanel/reset-votes/${electionId}/verify-otp`,
      { otp },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

export const getVotersBySearch = async ({
  electionId,
  query,
  page = 0,
  size = 10,
  signal,
}: {
  electionId: string | number;
  query: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}) => {
  try {
    const jwtToken = await getjwtToken();

    const params = {
      query,
      page,
      size,
    };

    console.log("Search Params:", params);
    console.log("Election ID:", electionId);

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/search`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
        signal,
      }
    );

    console.log("GetVotersBySearch response:", response.data);
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

export const addVoterFormApi = async (data, electionId: string) => {
  console.log("addVoterForm Data", data);
  try {
    const jwtToken = await getjwtToken();

    let languages = data.languages || "";
    let languageId = null;

    console.log("Languages", languages);
    if (data.languages) {
      if (typeof data.languages === "object") {
        // If it's an object, extract name and ID
        languages =
          data.languages.languageName ||
          data.languages.name ||
          data.languages.toString();

        languageId = Number(data.languages.key || data.languages.id);
        console.log("Language ID", languageId);
      } else if (data.languagesList && Array.isArray(data.languagesList)) {
        // If it's a string, find the matching language ID
        const matchingLang = data.languagesList.find(
          (lang) =>
            lang.languageName === data.languages || lang.name === data.languages
        );
        if (matchingLang) {
          languageId = Number(matchingLang.key || matchingLang.id);
        }
      }
    }

    // Process availability data
    let availability = data.availability || "";
    let availabilityId = null;

    if (data.availability) {
      if (typeof data.availability === "object") {
        // If availability is an object, extract name and ID
        availability =
          data.availability.categoryName ||
          data.availability.name ||
          data.availability.toString();
        availabilityId = Number(data.availability.key || data.availability.id);
      } else if (data.availabilities && Array.isArray(data.availabilities)) {
        // Try to find ID from availabilities array
        const matchingAvail = data.availabilities.find(
          (avail) =>
            avail.categoryName === data.availability ||
            avail.name === data.availability
        );
        if (matchingAvail) {
          availabilityId = Number(matchingAvail.key || matchingAvail.id);
        }
      }
    }

    // Process Benefit Scheme data
    // let benefitSchemeIds = [];

    // if (Array.isArray(data.benefitSchemeIds)) {
    //   benefitSchemeIds = data.benefitSchemeIds
    //     .map((id) => Number(id))
    //     .filter(Boolean);
    // } else if (typeof data.benefitSchemeIds === "number") {
    //   benefitSchemeIds = [Number(data.benefitSchemeIds)];
    // } else if (data.schemes && Array.isArray(data.schemes)) {
    //   // If `benefitSchemeIds` contains scheme names instead of IDs
    //   benefitSchemeIds = data.schemes
    //     .filter((scheme) => data.benefitSchemeIds.includes(scheme.schemeName))
    //     .map((scheme) => Number(scheme.id));
    // }

    // Process Feedback data
    let feedbackIssueIds = [];

    if (Array.isArray(data.feedbackIssueIds)) {
      feedbackIssueIds = data.feedbackIssueIds
        .map((id) => Number(id))
        .filter(Boolean);
    } else if (typeof data.feedbackIssueIds === "number") {
      feedbackIssueIds = [Number(data.feedbackIssueIds)];
    } else if (data.feedback && Array.isArray(data.feedback)) {
      // If `feedbackIssueIds` contains feedback names instead of IDs
      feedbackIssueIds = data.feedback
        .filter((feed) => data.feedbackIssueIds.includes(feed.issueName))
        .map((feed) => Number(feed.id));
    }

    // Process Voter History data
    let voterHistoryIds = [];

    if (Array.isArray(data.voterHistoryIds)) {
      voterHistoryIds = data.voterHistoryIds
        .map((id) => Number(id))
        .filter(Boolean);
    } else if (typeof data.voterHistoryIds === "number") {
      voterHistoryIds = [Number(data.voterHistoryIds)];
    } else if (data.voterHistory && Array.isArray(data.voterHistory)) {
      // If `voterHistoryIds` contains voterHistory names instead of IDs
      voterHistoryIds = data.voterHistory
        .filter((voterHistory) =>
          data.voterHistoryIds.includes(voterHistory.voterHistoryName)
        )
        .map((voterHistory) => Number(voterHistory.id));
    }

    // Process party affiliation data
    let partyAffiliation = data.partyAffiliation || "";
    let partyId = null;

    if (data.partyAffiliation) {
      if (typeof data.partyAffiliation === "object") {
        // If party is an object, extract name and ID
        partyAffiliation =
          data.partyAffiliation.partyName ||
          data.partyAffiliation.name ||
          data.partyAffiliation.toString();
        partyId = Number(data.partyAffiliation.key || data.partyAffiliation.id);
      } else if (data.parties && Array.isArray(data.parties)) {
        // Try to find ID from parties array
        const matchingParty = data.parties.find(
          (party) =>
            party.partyName === data.partyAffiliation ||
            party.name === data.partyAffiliation
        );
        if (matchingParty) {
          partyId = Number(matchingParty.key || matchingParty.id);
        }
      }
    }

    // Process caste category data
    let casteCategories = data.casteCategories || "";
    let casteCategoryId = null;
    console.log("Caste categories", casteCategories);
    if (data.casteCategories) {
      if (typeof data.casteCategories === "object") {
        // If caste category is an object, extract name and ID
        console.log("Caste category is an object", data.casteCategories);
        casteCategories =
          data.casteCategories.casteCategoryName ||
          data.casteCategories.name ||
          data.casteCategories.toString();
        casteCategoryId = Number(
          data.casteCategories.key || data.casteCategories.id
        );
      } else if (data.casteCategories && Array.isArray(data.casteCategories)) {
        // Try to find ID from caste categories array
        console.log(
          "Finding matching caste category for",
          data.casteCategories
        );
        const matchingCasteCategory = data.casteCategories.find(
          (cst) =>
            cst.casteCategoryName === data.casteCategoryName ||
            cst.name === data.casteCategories
        );
        console.log("Matching caste category found:", matchingCasteCategory);
        if (matchingCasteCategory) {
          casteCategoryId = Number(
            matchingCasteCategory.key || matchingCasteCategory.id
          );
        }
      }
    }
    console.log("Caste category id", casteCategoryId);

    // Construct the payload with all required fields
    const payload = {
      // Election and ID Fields
      electionId: parseInt(electionId),
      epic_number: data.epic_number || "",
      pageNumber: data.pageNumber,

      booth_number: parseInt(data.boothNumber) || parseInt(data.partNo) || 0,
      partNo: parseInt(data.booth_number) || parseInt(data.partNo) || 0,

      // Basic Personal Information
      voterFnameEn: data.voterFnameEn || "",
      voterLnameEn: data.voterLnameEn || "",
      voterFnameL1: data.voterFnameL1 || "",
      voterLnameL1: data.voterLnameL1 || "",
      voterFnameL2: data.voterFnameL2 || "",
      voterLnameL2: data.voterLnameL2 || "",
      gender: data.gender || "",
      age: data.age,
      dob: data.dob || null,

      // Contact Information
      mobileNo: data.phoneNumber || data.mobileNo || "",
      whatsappNo: data.whatsappNo || "",
      email: data.email || "",

      starNumber: data.starNumber,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
      partyRegistrationNumber: data.partyRegistrationNumber,
      mobileVerified: data.mobileVerified || false,
      aadhaarVerified: data.aadhaarVerified || false,
      memberVerified: data.memberVerified || false,
      // Location Information
      latitude: parseFloat(data.voterLati) || 0,
      longitude: parseFloat(data.voterLongi) || 0,
      voterLati: parseFloat(data.voterLati) || 0,
      voterLongi: parseFloat(data.voterLongi) || 0,
      fullAddress: data.fullAddress,
      pincode: data.pincode || "",

      // Part/Booth Location
      partLati: data.partLati || "",
      partLong: data.partLong || "",

      // House Number Information
      houseNoEn: data.houseNoEn || "",
      houseNoL1: data.houseNoL1 || "",
      houseNoL2: data.houseNoL2 || "",

      // Relation Information
      rlnNameEn: data.rlnNameEn || "",
      rlnType: data.rlnType || "",
      rlnFnameEn: data.rlnFnameEn || "",
      rlnLnameEn: data.rlnLnameEn || "",
      rlnFnameL1: data.rlnFnameL1 || "",
      rlnLnameL1: data.rlnLnameL1 || "",
      rlnFnameL2: data.rlnFnameL2 || "",
      rlnLnameL2: data.rlnLnameL2 || "",

      // Section Information
      sectionNo: data.sectionNo || "",
      sectionNameEn: data.sectionNameEn || "",
      sectionNameL1: data.sectionNameL1 || "",
      sectionNameL2: data.sectionNameL2 || "",

      // Part Information
      partNameEn: data.partNameEn || "",
      partNameL1: data.partNameL1 || "",
      partNameL2: data.partNameL2 || "",

      // State Information
      stateCode: data.stateCode || "",
      stateNameEn: data.stateNameEn || data.state || "",
      stateNameL1: data.stateNameL1 || "",
      stateNameL2: data.stateNameL2 || "",

      // Parliament Information
      pcNo: data.pcNo || "",
      pcNameEn: data.pcNameEn || "",
      pcNameL1: data.pcNameL1 || "",
      pcNameL2: data.pcNameL2 || "",

      // Assembly Information
      acNo: data.acNo || "",
      acNameEn: data.acNameEn || "",
      acNameL1: data.acNameL1 || "",
      acNameL2: data.acNameL2 || "",

      // District Information
      districtCode: data.districtCode || "",
      // districtNo: data.districtNo || "",
      districtNameEn: data.districtNameEn || "",
      districtNameL1: data.districtNameL1 || "",
      districtNameL2: data.districtNameL2 || "",

      // District Union Information
      rurDistrictUnionNo: data.rurDistrictUnionNo,
      rurDistrictUnionNameEn: data.rurDistrictUnionNameEn || "",
      rurDistrictUnionNameL1: data.rurDistrictUnionNameL1 || "",
      rurDistrictUnionNameL2: data.rurDistrictUnionNameL2 || "",
      rurDistrictUnionWardNo: parseInt(data.rurDistrictUnionWardNo) || "",

      // Urban Information
      urbanNo: parseInt(data.urbanNo) || "",
      urbanNameEn: data.urbanNameEn || "",
      urbanNameL1: data.urbanNameL1 || "",
      urbanNameL2: data.urbanNameL2 || "",
      urbanWardNo: parseInt(data.urbanWardNo) || "",

      // Panchayat Information
      panUnionNameEn: data.panUnionNameEn || "",
      panUnionNo: parseInt(data.panUnionNo) || "",
      panUnionNameL1: data.panUnionNameL1 || "",
      panUnionNameL2: data.panUnionNameL2 || "",
      panUnionWardNo: parseInt(data.panUnionWardNo) || "",

      // Village Information
      villPanNameEn: data.villPanNameEn || "",
      villPanNo: parseInt(data.villPanNo) || "",
      villPanNameL1: data.villPanNameL1 || "",
      villPanNameL2: data.villPanNameL2 || "",
      villPanWardNo: parseInt(data.villPanWardNo) || "",

      // Demographics and Affiliations
      religion: data.religion || null,
      religionId: parseInt(data.religionId) || null,
      caste: data.caste || null,
      casteId: parseInt(data.casteId) || null,
      sub_caste: data.sub_caste || null,
      subCasteId: parseInt(data.subCasteId) || null,

      // Fixed values for IDs and names
      partyAffiliation: partyAffiliation,
      partyId: partyId,
      availability: availability,
      availabilityId: availabilityId,
      // scheme: scheme,
      // benefitSchemeId: benefitSchemeId,
      // languages: languages,
      // languageIds: languageIds,
      // benefitSchemeIds: benefitSchemeIds, // Array of IDs
      benefitSchemeStatuses: data.benefitSchemeStatuses, // Array of benefitSchemeStatuses IDs
      casteCategoryId: parseInt(data.casteCategoryId) || null,
      feedbackIssueIds: feedbackIssueIds, // Array of IDs
      voterHistoryIds: voterHistoryIds, // Array of IDs
      languages: languages, // Single string
      languageId: languageId || data.languageId, // Single ID

      // Additional Information
      localBody: data.localBody || "",
      remarks: data.remarks || "",
      photo_url: data.photo_url || "",
      third_party_id: data.third_party_id || "",
      schemeBy: data.schemeBy || "",

      serialNo: data.serialNo || data.serialNumber || "",
      // Important Dates
      anniversaryDate: data.anniversaryDate
        ? data.anniversaryDate.format("YYYY-MM-DD")
        : null,

      dynamicFields: data.dynamicFields,
    };

    console.log("Sending payload:", payload);

    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error in addVoterFormApi:", error);

    // Handle specific error cases
    if (
      error.response?.data?.message?.includes(
        "Query did not return a unique result"
      )
    ) {
      message.error("Voter already exists");
    } else {
      message.error(
        error.response?.data?.message ||
          "An error occurred while adding the voter"
      );
    }

    throw error.response ? error.response.data : error;
  }
};

export const addVoterImageApi = async (
  voterId,
  electionId: number,
  voterImage
) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("voterId", voterId);
    console.log("electionId", electionId);
    console.log("voterImage", voterImage);

    const response = await axios.put(
      `${BASE_URL}/api/v1/voters/${electionId}/voter-image`,
      {
        file: voterImage,
      },
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
        params: {
          epicNumber: voterId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error in voter image upload", error);
    throw error.response ? error.response.data : error;
  }
};

export const deleteVoterImageApi = async (
  electionId: number,
  epicNumber: string
) => {
  try {
   const jwtToken = await getjwtToken();
    console.log("Epic Number", epicNumber);
    console.log("electionId", electionId);

    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/${electionId}/voter-image`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: {
          epicNumber: epicNumber,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error while deleting voter image", error);
    throw error.response ? error.response.data : error;
  }
};

export const getVoterDetails = async (
  payload: { voterId: string; electionId: number; boothNumber: number },
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const jwtToken = await getjwtToken();
    const { voterId, electionId, boothNumber } = payload;
    const response = await axios.get(`${BASE_URL}/api/v1/voters`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
      params: {
        "voter-id": voterId,
        "election-id": electionId,
        "booth-number": boothNumber,
      },
    });
    setIsSearching(false);
    return response.data;
  } catch (error: any) {
    setIsSearching(false);
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};
export const getVoterDetailsApi = async (
  payload,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/v1/voters`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
      params: {
        "voter-id": payload.voterId,
        "election-id": payload.electionId,
        "booth-number": payload.boothNumber,
      },
    });
    setIsSearching(false);
    return response.data;
  } catch (error: any) {
    setIsSearching(false);
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

//get voter from third party API
export const getVoterDetailsFromThirdPartyApi = async (
  payload,
  setIsSearching
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(`${BASE_URL}/api/v1/voters/third-party`, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
      params: {
        epicNumber: payload.epicNumber,
      },
    });
    setIsSearching(false);
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    setIsSearching(false);
    throw error.response ? error.response.data : error;
  }
};

export const votersBulkUploadApi = async (formData, electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("formData", formData);
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/${electionId}/upload`,
      formData,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 413) {
      throw {
        status: "error",
        code: 413,
        message:
          "File size exceeds server limits. Please reduce the file size and try again.",
      };
    }
    const errorMessage =
      error.response?.data?.message || "An error occurred during bulk upload";
    throw {
      status: "error",
      code: error.response?.status || 500,
      message: errorMessage,
    };
  }
};
export const deleteVoterApi = async (voterId, electionId) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/election/${electionId}/singleVoter?epicNumber=${voterId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: {
          voterId: voterId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "An error occurred");
    throw error.response ? error.response.data : error;
  }
};

export const deleteAllVotersApi = async (
  electionId: number,
  epicNumbers?: number[] | string[]
) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Epic Numbers", epicNumbers);
    const params = new URLSearchParams();
    if (epicNumbers && epicNumbers.length > 0) {
      epicNumbers.forEach((id) => {
        params.append("epicNumbers", id.toString());
      });
    }
    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/election/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: params,
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = epicNumbers?.length
      ? "Error deleting Voters"
      : "Error deleting all Voters";
    message.error(error.response?.data?.message || errorMessage);
    console.error(errorMessage, error);
    throw error;
  }
};

/**
 * Poll the progress of an async voter-deletion job.
 * Returns: { operationId, status, percent, message, errorMessage? }
 */
export const getDeleteProgressApi = async (
  electionId: number,
  operationId: string
) => {
  const jwtToken = await getjwtToken();
  const response = await axios.get(
    `${BASE_URL}/api/v1/voters/election/${electionId}/delete-progress/${operationId}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return response.data?.data as {
    operationId: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "NOT_FOUND";
    percent: number;
    message: string;
    errorMessage?: string;
  };
};

export const updateVoterApi = async (voterId, electionId, data) => {
  try {
    const jwtToken = await getjwtToken();
    console.log("Voter data before getting mapped to payload format", data);

    // Handle languages (ensure it's an array of strings)
    let languages = data.languages || "";
    let languageId = null;

    if (data.languages) {
      if (typeof data.languages === "object") {
        // If it's an object, extract name and ID
        languages =
          data.languages?.languageName ||
          data.languages?.name ||
          data.languages.toString();
        languageId = Number(data.languages.key || data.languages.id);
      } else if (data.languagesList && Array.isArray(data.languagesList)) {
        // If it's a string, find the matching language ID
        const matchingLang = data.languagesList.find(
          (lang) =>
            lang.languageName === data.languages || lang.name === data.languages
        );
        if (matchingLang) {
          languageId = Number(matchingLang.key || matchingLang.id);
        }
      }
    }

    // Handle availability string
    let availability = "";
    if (data.availability) {
      if (typeof data.availability === "object") {
        availability =
          data.availability?.categoryName ||
          data.availability?.name ||
          data.availability.toString();
      } else {
        availability = data.availability;
      }
    }

    // Handle availability ID
    let availabilityId = null;
    if (data.availabilityId) {
      availabilityId =
        typeof data.availabilityId === "string"
          ? parseInt(data.availabilityId, 10)
          : data.availabilityId;
    }
    // Handle caste category ID
    let casteCategoryId = null;
    if (data.casteCategoryId) {
      casteCategoryId =
        typeof data.casteCategoryId === "string"
          ? parseInt(data.casteCategoryId, 10)
          : data.casteCategoryId;
    }

    // Handle scheme string
    let benefitSchemeIds = [];

    if (Array.isArray(data.benefitSchemeIds)) {
      benefitSchemeIds = data.benefitSchemeIds
        .map((id) => Number(id))
        .filter(Boolean);
    } else if (typeof data.benefitSchemeIds === "number") {
      benefitSchemeIds = [Number(data.benefitSchemeIds)];
    } else if (data.schemes && Array.isArray(data.schemes)) {
      // If `benefitSchemeIds` contains scheme names instead of IDs
      benefitSchemeIds = data.schemes
        .filter((scheme) => data.benefitSchemeIds.includes(scheme.schemeName))
        .map((scheme) => Number(scheme.id));
    }

    // Handle feedback string
    let feedbackIssueIds = [];

    if (Array.isArray(data.feedbackIssueIds)) {
      feedbackIssueIds = data.feedbackIssueIds
        .map((id) => Number(id))
        .filter(Boolean);
    } else if (typeof data.feedbackIssueIds === "number") {
      feedbackIssueIds = [Number(data.feedbackIssueIds)];
    } else if (data.feedback && Array.isArray(data.feedback)) {
      // If `feedbackIssueIds` contains feedback names instead of IDs
      feedbackIssueIds = data.feedback
        .filter((feed) => data.feedbackIssueIds.includes(feed.issueName))
        .map((feed) => Number(feed.id));
    }

    // Handle voter history string
    let voterHistoryIds = [];

    if (Array.isArray(data.voterHistoryIds)) {
      voterHistoryIds = data.voterHistoryIds
        .map((id) => Number(id))
        .filter(Boolean);
    } else if (typeof data.voterHistoryIds === "number") {
      voterHistoryIds = [Number(data.voterHistoryIds)];
    } else if (data.voterHistory && Array.isArray(data.voterHistory)) {
      // If `voterHistoryIds` contains voterHistory names instead of IDs
      voterHistoryIds = data.voterHistory
        .filter((voterHistory) =>
          data.voterHistoryIds.includes(voterHistory.voterHistoryName)
        )
        .map((voterHistory) => Number(voterHistory.id));
    }

    // Handle party affiliation string
    let partyAffiliation = "";
    if (data.partyAffiliation) {
      if (typeof data.partyAffiliation === "object") {
        partyAffiliation =
          data.partyAffiliation?.partyName ||
          data.partyAffiliation?.name ||
          data.partyAffiliation.toString();
      } else {
        partyAffiliation = data.partyAffiliation;
      }
    }

    // Handle party ID
    let partyId = null;
    if (data.partyId) {
      partyId =
        typeof data.partyId === "string"
          ? parseInt(data.partyId, 10)
          : data.partyId;
    }

    // --- Updated mapping for religion, caste and subcaste ---
    const religion =
      typeof data.religion === "object"
        ? data.religion?.religionName
        : data.religion;

    const religionId =
      typeof data.religion === "object"
        ? "value" in data.religion
          ? data.religion.value
          : data.religion?.id || data.religion?.key || null
        : data.religionId
        ? parseInt(data.religionId, 10)
        : null;

    const caste =
      typeof data.caste === "object" ? data.caste?.casteName : data.caste;

    const casteId =
      typeof data.caste === "object"
        ? "value" in data.caste
          ? data.caste.value
          : data.caste?.id || data.caste?.key || null
        : data.casteId
        ? parseInt(data.casteId, 10)
        : null;

    const sub_caste =
      typeof data.subcaste === "object"
        ? data.subcaste?.subCasteName
        : data.subcaste;

    const subCasteId =
      typeof data.subcaste === "object"
        ? "value" in data.subcaste
          ? data.subcaste.value
          : data.subcaste?.id || data.subcaste?.key || null
        : data.subCasteId
        ? parseInt(data.subCasteId, 10)
        : null;

    console.log("Extracted Values:");
    console.log("Languages:", languages);
    console.log("Language IDs:", languageId);
    console.log("Availability:", availability);
    console.log("Availability ID:", availabilityId);
    console.log("Scheme ID:", benefitSchemeIds);
    console.log("Party:", partyAffiliation);
    console.log("Party ID:", partyId);
    console.log("Religion:", religion, "Religion ID:", religionId);
    console.log("Caste:", caste, "Caste ID:", casteId);
    console.log("Sub-Caste:", sub_caste, "Sub-Caste ID:", subCasteId);
    console.log("Aadhaar verified:", data.aadhaarVerified);

    const payload = {
      epicNumber: data.epic_number,
      pageNumber: data.pageNumber,
      voterFnameEn: data.voterFnameEn,
      voterLnameEn: data.voterLnameEn,
      voterFnameL1: data.voterFnameL1,
      voterLnameL1: data.voterLnameL1,
      voterFnameL2: data.voterFnameL2,
      voterLnameL2: data.voterLnameL2,
      dob: data.dob,
      age: data.age,
      gender: data.gender,
      email: data.email,
      mobileNo: data.mobileNo,
      whatsappNo: data.whatsappNo,
      fullAddress: data.fullAddress,
      availability: availability,
      availabilityId: availabilityId,
      partyAffiliation: partyAffiliation,
      partyId: partyId,
      casteCategoryId: casteCategoryId,
      // benefitSchemeIds: benefitSchemeIds, // Array of IDs
      benefitSchemeStatuses: data.benefitSchemeStatuses,
      feedbackIssueIds: feedbackIssueIds, // Array of IDs
      voterHistoryIds: voterHistoryIds, // Array of IDs
      languages: languages, // Single string
      languageId: data.languageId, // Single ID
      // religion: data.religion,
      // caste: data.caste,
      // sub_caste: data.sub_caste,
      starNumber: data.starNumber,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
      partyRegistrationNumber: data.partyRegistrationNumber,
      memberVerified: data.memberVerified,
      aadhaarVerified: data.aadhaarVerified,
      mobileVerified: data.mobileVerified,
      religionId: religionId,
      casteId: casteId,
      subCasteId: subCasteId,
      remarks: data.remarks,
      latitude: data.latitude,
      longitude: data.longitude,
      electionId: parseInt(electionId),
      booth_number: parseInt(data.booth_number),
      pincode: data.pincode,
      third_party_id: data.third_party_id || "",
      photo_url: data.photo_url,
      localBody: data.localBody || null,

      stateCode: data.stateCode || null,
      stateNameEn: data.stateNameEn || data.state || null,
      stateNameL1: data.stateNameL1 || null,
      stateNameL2: data.stateNameL2 || null,

      pcNo: data.pcNo || null,
      pcNameEn: data.pcNameEn || null,
      pcNameL1: data.pcNameL1 || null,
      pcNameL2: data.pcNameL2 || null,

      acNo: data.acNo || null,
      acNameEn: data.acNameEn || null,
      acNameL1: data.acNameL1 || null,
      acNameL2: data.acNameL2 || null,

      sectionNo: data.sectionNo || null,
      sectionNameEn: data.sectionNameEn || null,
      sectionNameL1: data.sectionNameL1 || "",
      sectionNameL2: data.sectionNameL2 || "",
      serialNo: data.serialNo || null,

      rlnType: data.rlnType || null,
      rlnFnameEn: data.rlnFnameEn || null,
      rlnLnameEn: data.rlnLnameEn || null,
      rlnFnameL1: data.rlnFnameL1 || null,
      rlnLnameL1: data.rlnLnameL1 || null,
      rlnFnameL2: data.rlnFnameL2 || null,
      rlnLnameL2: data.rlnLnameL2 || null,

      urbanNo: parseInt(data.urbanNo),
      urbanNameEn: data.urbanNameEn || null,
      urbanNameL1: data.urbanNameL1 || null,
      urbanNameL2: data.urbanNameL2 || null,
      urbanWardNo: data.urbanWardNo || null,

      districtCode: data.districtCode || "",
      districtNameEn: data.districtNameEn || null,
      districtNameL1: data.districtNameL1 || null,
      districtNameL2: data.districtNameL2 || null,

      rurDistrictUnionNo: data.rurDistrictUnionNo,
      rurDistrictUnionNameEn: data.rurDistrictUnionNameEn || null,
      rurDistrictUnionNameL1: data.rurDistrictUnionNameL1 || null,
      rurDistrictUnionNameL2: data.rurDistrictUnionNameL2 || null,
      rurDistrictUnionWardNo: data.rurDistrictUnionWardNo || null,

      panUnionNo: parseInt(data.panUnionNo) || null,
      panUnionNameEn: data.panUnionNameEn || null,
      panUnionNameL1: data.panUnionNameL1 || null,
      panUnionNameL2: data.panUnionNameL2 || null,
      panUnionWardNo: data.panUnionWardNo || null,

      villPanNo: data.villPanNo || null,
      villPanNameEn: data.villPanNameEn || null,
      villPanNameL1: data.villPanNameL1 || null,
      villPanWardNo: data.villPanWardNo || null,

      partNo: data.partNo || null,
      partNameEn: data.partNameEn || null,
      partNameL1: data.partNameL1 || null,
      partNameL2: data.partNameL2 || null,
      partLati: data.partLati,
      partLong: data.partLong,

      houseNoEn: data.houseNoEn || null,
      houseNoL1: data.houseNoL1 || null,
      houseNoL2: data.houseNoL2 || null,

      voterLati: parseFloat(data.voterLati) || 0,
      voterLongi: parseFloat(data.voterLongi) || 0,

      dynamicFields: data.dynamicFields,
    };
    const prevVoterId = data.prev_epic_number || voterId;

    const epicNumberParam =
      prevVoterId && prevVoterId !== "undefined" ? prevVoterId : voterId;

    console.log("Final epicNumber parameter:", epicNumberParam);

    console.log("Final Payload for Update Voter API:", payload);

    const response = await axios.put(
      `${BASE_URL}/api/v1/voters/election/${electionId}?epicNumber=${epicNumberParam}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log("updatedVoter response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating voter:", error);
    console.error("Error response:", error.response?.data);
    message.error(
      error.response?.data?.message ||
        "An error occurred while updating the voter"
    );
    throw error.response ? error.response.data : error;
  }
};

export const getVoteCountApi = async (
  electionId: string,
  boothNumber: number | string
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/booth-status?boothNumber=${boothNumber}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          accept: "*/*",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error fetch vote count: ", error);
    throw error;
  }
};

export const getVotersGeolocationApi = async (
  page = 0,
  size = 100,
  electionId: string | number,
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
    boothNumber?: number;
  }
) => {
  try {
    const jwtToken = await getjwtToken();
    const params = {
      electionId,
      page,
      size,
      ...(bounds && {
        northBound: bounds.north,
        southBound: bounds.south,
        eastBound: bounds.east,
        westBound: bounds.west,
        boothNumber: bounds.boothNumber,
      }),
    };

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/map-location/${electionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params,
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getBulkUploadsByElectionId = async (electionId) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/${electionId}/uploads?page=0&size=10&sortBy=startTime`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message ||
        "An error occurred while fetching voters geolocation"
    );
    throw error.response ? error.response.data : error;
  }
};

export const getBulkUploadStatus = async (id: number, electionId: number) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/uploads/${id}/status?electionId=${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message ||
        "An error occurred while fetching voters geolocation"
    );
    throw error.response ? error.response.data : error;
  }
};

export const markVoterAsVoted = async (
  electionId: number,
  voterId: string,
  data
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/hasVoted?epicNumber=${voterId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

export const markPollDayVotersBatch = async (
  electionId: number,
  payload: PollDayVoteBatchRequestPayload
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/poll-day/votes/batch`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

export const getPollDaySerialGrid = async (
  electionId: number,
  partNo: number
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/poll-day/parts/${partNo}/serial-grid`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : error;
  }
};

export const addVoterToFamily = async (
  payload: Record<string, any> | undefined,
  electionId: string,
  epicNumber: string
) => {
  const jwtToken = await getjwtToken();
  try {
    console.log("electionId", electionId);
    console.log("epicNumber", epicNumber);
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/family-mapping/election/${electionId}`,
      payload || null,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: {
          epicNumber: epicNumber,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(
      error.response?.data?.message ||
        "An error occurred while mapping voter to family"
    );
    throw error.response ? error.response.data : error;
  }
};

export const deleteFamilyMember = async (
  electionId: string,
  epicNumber: string
) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/family-mapping/election/${electionId}?epicNumber=${epicNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error removing family member"
    );
    throw error.response ? error.response.data : error;
  }
};
export const addVoterToFriends = async (
  payload: Record<string, any> | undefined,
  electionId: string,
  epicNumber: string
) => {
  const jwtToken = await getjwtToken();
  try {
    console.log("electionId", electionId);
    console.log("epicNumber", epicNumber);
    console.log("Add voter to friends payload", payload);
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/friend-mapping/election/${electionId}`,
      payload || null,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        params: {
          epicNumber: epicNumber,
        },
      }
    );
    return response;
  } catch (error: any) {
    message.error(
      error.response?.data?.message ||
        "An error occurred while mapping voter as a friend"
    );
    throw error.response ? error.response.data : error;
  }
};

export const deleteFriend = async (
  electionId: string,
  voterId: string,
  epicNumber: string
) => {
  try {
    const jwtToken = await getjwtToken();
    console.log({
      ElectionId: electionId,
      "Epic Number": epicNumber,
    });
    const payload = [epicNumber];
    const response = await axios.delete(
      `${BASE_URL}/api/v1/voters/friend-mapping/election/${electionId}?epicNumber=${voterId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
        data: payload,
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Error removing the friend");
    throw error.response ? error.response.data : error;
  }
};

/**
 * Invokes (sends) a mobile OTP for the given mobile number.
 *
 * @param {string} mobileNo - The mobile number to which the OTP will be sent.
 * @param {number} electionId - The election ID.
 * @returns {Promise<object>} - The response data from the API.
 */
export const invokeMobileOtpApi = async (mobileNo, electionId) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/invoke`,
      { mobileNo },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data; // Expect a response with a status like { status: "SUCCESS", ... }
  } catch (error) {
    message.error(
      error.response?.data?.message || "Failed to invoke mobile OTP"
    );
    throw error.response ? error.response.data : error;
  }
};

/**
 * Verifies the OTP entered for the given mobile number.
 *
 * @param {string} mobileNo - The mobile number for which the OTP was sent.
 * @param {string} otp - The OTP entered by the user.
 * @param {number} electionId - The election ID.
 * @returns {Promise<object>} - The response data from the API.
 */
export const verifyMobileOtpApi = async (mobileNo, otp, electionId) => {
  try {
    const jwtToken = await getjwtToken();
    const response = await axios.post(
      `${BASE_URL}/api/v1/voters/election/${electionId}/verify`,
      { mobileNo, otp },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data; // Expect a response with a status like { status: "SUCCESS", ... }
  } catch (error) {
    message.error(
      error.response?.data?.message || "Failed to verify mobile OTP"
    );
    throw error.response ? error.response.data : error;
  }
};

/**
 * Saves Aadhaar verification data using the dedicated Aadhaar API endpoint
 *
 * @param {number} electionId - The election ID
 * @param {object} aadhaarData - The Aadhaar verification response data from verification
 * @returns {Promise<object>} - The response data from the API
 */
export const saveAadhaarDataApi = async (electionId, aadhaarData) => {
  try {
    const jwtToken = await getjwtToken();

    // Create payload with the verified Aadhaar data
    const payload = {
      electionId: electionId,
      aadhaarData: aadhaarData,
    };

    console.log("Payload of saveAadhaarData api", payload);

    const response = await axios.post(
      `${BASE_URL}/api/aadhaar/election/${electionId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log("Aadhaar data saved successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error saving Aadhaar data:", error);
    message.error(
      error.response?.data?.message || "Failed to save Aadhaar data"
    );
    throw error.response ? error.response.data : error;
  }
};

export const getVoterLocationsJsonApi = async (electionId: string | number) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/map-location/${electionId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log("GetVoterLocationsJson response:", response.data);

    // The response contains a URL to the actual JSON data
    if (response.data?.data) {
      // Fetch the actual JSON data from the S3 URL
      const jsonDataResponse = await axios.get(response.data.data);
      console.log("jsonDataResponse", jsonDataResponse);
      return jsonDataResponse.data;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error fetching voter locations JSON:", error);
    message.error(
      error.response?.data?.message ||
        "An error occurred while fetching voter locations JSON"
    );
    throw error.response ? error.response.data : error;
  }
};

// Get part-wise breakdown of addressed and unaddressed voters
export const getAddressedVotersPartWise = async (electionId: string | number) => {
  try {
    const jwtToken = await getjwtToken();

    const response = await axios.get(
      `${BASE_URL}/api/v1/voters/election/${electionId}/addressed-voters/part-wise`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log("GetAddressedVotersPartWise response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching addressed voters part-wise breakdown:", error);
    message.error(
      error.response?.data?.message ||
        "An error occurred while fetching addressed voters breakdown"
    );
    throw error.response ? error.response.data : error;
  }
};

import axios from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

const getjwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const fetchBooths = async (electionId: number, boothNumber?: number) => {
  try {
    const jwtToken = await getjwtToken();
    
    // If a specific booth number is requested, use the direct endpoint
    if (boothNumber) {
      const url = `${BASE_URL}/booths/${electionId}/${boothNumber}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: "*/*",
        },
      });
      return response.data;
    } 
    // Otherwise, fetch all booths
    else {
      // Start with the original request - exactly as in your original code
      const url = `${BASE_URL}/booths/${electionId}?size=100`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: "*/*",
        },
      });
      
      const responseData = response.data;
      
      // Check if there are more pages to fetch
      if (responseData?.data?.last === false) {
        // We have more pages to fetch
        const totalPages = responseData.data.totalPages;
        const allBooths = [...responseData.data.content]; // Start with page 0 content
        
        // Fetch remaining pages
        for (let page = 1; page < totalPages; page++) {
          const nextPageUrl = `${BASE_URL}/booths/${electionId}?page=${page}&size=100`;
          const nextPageResponse = await axios.get(nextPageUrl, {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              Accept: "*/*",
            },
          });
          
          if (nextPageResponse.data?.data?.content) {
            // Add these booths to our full collection
            allBooths.push(...nextPageResponse.data.data.content);
          }
        }
        
        // Replace content in the original response with the complete set
        responseData.data.content = allBooths;
        responseData.data.last = true;
        responseData.data.numberOfElements = allBooths.length;
      }
      
      // Return the same response structure that your UI already works with
      return responseData;
    }
  } catch (error: any) {
    console.log("Error getting booths: ", error);
    throw error;
  }
};

export const updateBoothsOrder = async (
  electionId: number,
  payload: { newOrderIndex: number; boothNumber: number }
): Promise<any> => {
  try {
    console.log("payload", payload);
    console.log("electionId", electionId);
    const jwtToken = await getjwtToken();
    const response = await axios.put(
      `${BASE_URL}/booths/${electionId}/booths/reorder`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating Booths order"
    );
    console.error("Error updating Booths order", error);
    throw error;
  }
};
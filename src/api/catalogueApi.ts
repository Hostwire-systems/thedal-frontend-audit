import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "../config";
import { message } from "antd";

interface CatalogueItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface CatalogueResponse {
  status: string;
  code: number;
  message: string;
  data: CatalogueItem[];
}

const getJwtToken = async () => {
  return localStorage.getItem("jwtToken");
};

export const getCatalogueApi = async (): Promise<CatalogueItem[]> => {
  try {
    const jwtToken = await getJwtToken();
    const response: AxiosResponse<CatalogueResponse> = await axios.get(
      `${BASE_URL}/api/app/catalogue`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching catalogue:", error);
    message.error(error.response?.data?.message || "Error fetching catalogue");
    throw error;
  }
};

//update catalogue order
export const updateCatalogueOrder = async (
  payload: { itemId: number; newOrderIndex: number }
): Promise<AxiosResponse> => {
  try {
    const jwtToken = await getJwtToken();
    const response = await axios.put(
      `${BASE_URL}/api/cpanel/catalogue/reorder`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    message.success("Order updated successfully!");
    return response.data;
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Error updating Catalogue order"
    );
    console.error("Error updating Catalogue order", error);
    throw error;
  }
};

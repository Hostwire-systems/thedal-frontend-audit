import { useState } from "react";
import { fetchCaste } from "../api/casteApi";

export const useCasteData = (
  selectedElectionId: number,
  // religionId?: number,
  partNo?: string | number,
  gender?: string
) => {
  const [castes, setCastes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCasteData = async () => {
    try {
      setLoading(true);
      const response = await fetchCaste(selectedElectionId);
      const mapped =
        response?.data?.data
          ?.map((caste: any) => ({
            key: caste.casteId.toString(),
            id: caste.casteId,
            casteName: caste.casteName,
            religionId: caste.religionId,
            orderIndex: caste.orderIndex,
            voterCount: caste.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setCastes(mapped);
    } catch (err) {
      console.error("Failed to fetch castes", err);
      setCastes([]);
    } finally {
      setLoading(false);
    }
  };

  return { castes, loading, fetchCasteData };
};

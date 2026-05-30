import { useState } from "react";
import { fetchSubCaste } from "../api/subCasteApi";

export const useSubCasteData = (
  selectedElectionId: number,
  partNo?: string | number,
  gender?: string
) => {
  const [subCastes, setSubCastes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubCasteData = async () => {
    try {
      setLoading(true);
      const response = await fetchSubCaste(selectedElectionId);
      const mapped =
        response?.data?.data
          ?.map((sub: any) => ({
            key: sub.subCasteId.toString(),
            id: sub.subCasteId,
            subCasteName: sub.subCasteName,
            casteName: sub.casteName,
            religionName: sub.religionName,
            orderIndex: sub.orderIndex,
            voterCount: sub.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setSubCastes(mapped);
    } catch (err) {
      console.error("Failed to fetch sub-castes", err);
      setSubCastes([]);
    } finally {
      setLoading(false);
    }
  };

  return { subCastes, loading, fetchSubCasteData };
};

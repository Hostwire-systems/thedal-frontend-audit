import { useState } from "react";
import { getBenefitSchemesApi } from "../api/benefitSchemeApi";

export const useSchemeData = (
  selectedElectionId: number,
  partNo?: string | number,
  gender?: string
) => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchemeData = async () => {
    try {
      setLoading(true);
      const response = await getBenefitSchemesApi(selectedElectionId);
      const mapped =
        response?.data
          ?.map((scheme: any) => ({
            key: scheme.id.toString(),
            id: scheme.id,
            ...scheme,
            voterCount: scheme.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setSchemes(mapped);
    } catch (err) {
      console.error("Failed to fetch schemes", err);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  return { schemes, loading, fetchSchemeData };
};

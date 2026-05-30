import { useState } from "react";
import { getAvailabilityApi } from "../api/availabilityApi";

export const useAvailabilityData = (
  selectedElectionId: number,
  partNo?: string | number,
  gender?: string
) => {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      const response = await getAvailabilityApi(selectedElectionId);
      const mapped =
        response?.data
          ?.map((item: any) => ({
            key: item.id.toString(),
            description: item.description,
            categoryName: item.categoryName,
            imageUrl: item.availabilityImage,
            orderIndex: item.orderIndex,
            voterCount: item.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setAvailabilities(mapped);
    } catch (err) {
      console.error("Failed to fetch availabilities", err);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  return { availabilities, loading, fetchAvailabilityData };
};

import { ReligionType } from "../types/religion";
import { fetchReligion } from "../api/religionApi";
import { useState } from "react";

export function useReligionData(selectedElectionId?: string,partNo?:string|number,gender?:string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [religions, setReligions] = useState<ReligionType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchReligionData = async () => {
    if (!selectedElectionId) {
      setError("No election ID provided");
      return;
    }
    try {
      setLoading(true);
      const response = await fetchReligion(parseInt(selectedElectionId));
      console.log("Fetched Relgions", response?.data?.data);
      const fetchedReligions =
        response?.data?.data
          ?.map((religion: any) => ({
            key: religion.religionId.toString(),
            orderIndex: religion.orderIndex,
            id: religion.religionId,
            religionName: religion.religionName,
            religionImage: religion.religionImage,
            voterCount:religion.voterCount
          }))
          .sort((a:any, b:any) => Number(a.orderIndex) - Number(b.orderIndex)) || [];
      console.log("fetchedReligions", fetchedReligions);
      setReligions(fetchedReligions);
    } catch (error) {
      console.error("Error fetching religions: ", error);
      setReligions([]);
    } finally {
      setLoading(false);
    }
  };
  return { religions, loading, fetchReligionData };
}

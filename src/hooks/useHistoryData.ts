import { fetchHistory } from "../api/historyApi";
import { useState } from "react";

export function useHistoryData(
  selectedElectionId?: string,
  partNo?: string | number,
  gender?: string
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [histories, setHistories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchHistoryData = async () => {
    if (!selectedElectionId) {
      setError("No election ID provided");
      return;
    }
    try {
      setLoading(true);
      const response = await fetchHistory(parseInt(selectedElectionId));
      const fetchedHistories =
        response?.data?.data
          ?.map((history: any) => ({
            key: history.voterHistoryId.toString(),
            orderIndex: history.orderIndex,
            id: history.voterHistoryId,
            voterHistoryName: history.voterHistoryName,
            voterHistoryImage: history.voterHistoryImage,
            voterCount: history.voterCount,
          }))
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];
      setHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };
  return { histories, loading, fetchHistoryData };
}

import { useState } from "react";
import { fetchParties } from "../api/partyApi";

export const usePartyData = (
  selectedElectionId: number,
  partNo?: string | number,
  gender?: string
) => {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPartyData = async () => {
    try {
      setLoading(true);
      const response = await fetchParties(selectedElectionId);
      const mapped =
        response?.data
          ?.map((party: any) => ({
            key: party.id.toString(),
            id: party.id,
            partyName: party.partyName,
            partyShortName: party.partyShortName,
            partyImage: party.partyImage,
            orderIndex: party.orderIndex,
            voterCount: party.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setParties(mapped);
    } catch (err) {
      console.error("Failed to fetch parties", err);
      setParties([]);
    } finally {
      setLoading(false);
    }
  };

  return { parties, loading, fetchPartyData };
};

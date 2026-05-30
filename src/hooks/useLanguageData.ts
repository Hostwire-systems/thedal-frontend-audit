import { useState } from "react";
import { getLanguagesApi } from "../api/languageApi";

export const useLanguageData = (
  selectedElectionId: number,
  partNo?: string | number,
  gender?: string
) => {
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLanguageData = async () => {
    try {
      setLoading(true);
      const response = await getLanguagesApi(selectedElectionId);
      const mapped =
        response?.data
          ?.map((lang: any) => ({
            key: lang.id.toString(),
            id: lang.id,
            languageName: lang.languageName,
            orderIndex: lang.orderIndex,
            voterCount: lang.voterCount,
          }))
          ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex) || [];

      setLanguages(mapped);
    } catch (err) {
      console.error("Failed to fetch languages", err);
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  return { languages, loading, fetchLanguageData };
};

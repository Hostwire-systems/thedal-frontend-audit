import { useState } from "react";
import { getFeedbackApi } from "../api/feedbackApi"; // adjust path as needed
import { FeedbackType } from "../types/feedback";


export function useFeedbacksData(
  selectedElectionId?: string,
  partNo?: string | number,
  gender?: string
) {
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbackData = async () => {
    if (!selectedElectionId) {
      setError("No election ID provided");
      return;
    }
    try {
      setError(null);
      const response = await getFeedbackApi(parseInt(selectedElectionId));
      const feedbackData = response.data
        .map((feedback: any) => ({
          key: feedback.id.toString(),
          id: feedback.id,
          issueName: feedback.issueName,
          voterCount: feedback.voterCount,
          orderIndex: feedback.orderIndex,
        }))
        .sort((a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex));
      setFeedbacks(feedbackData);
    } catch {
      setError("Failed to fetch feedbacks");
    }
  };

  return { feedbacks, fetchFeedbackData, error };
}

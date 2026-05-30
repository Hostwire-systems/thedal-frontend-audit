// 🎯 Final Implementation of the Two Additional Graphs for Election Dashboard

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, Select } from "antd";
import { getPollDayDataAgeWise } from "../../api/pollingApi";
import { useReligionData } from "../../hooks/useReligionData";
import { useCasteData } from "../../hooks/useCasteData";
import { useSubCasteData } from "../../hooks/useSubCasteData";
import { useSchemeData } from "../../hooks/useSchemeData";
import { useHistoryData } from "../../hooks/useHistoryData";
import { useAvailabilityData } from "../../hooks/useAvailabilityData";
import { usePartyData } from "../../hooks/usePartyData";
import { useLanguageData } from "../../hooks/useLanguageData";
import { useFeedbacksData } from "../../hooks/useFeedbacksData";
// import { getRandomColor } from "../../utils/colors";

const { Option } = Select;

const CategoryTabs = [
  "religion",
  "caste",
  "subcaste",
  "scheme",
  "history",
  "availability",
  "party",
  "language",
  "issues",
];

const AdditionalElectionGraphs = ({
  selectedElectionId,
  selectedBooth,
}: //   selectedGender,
{
  selectedElectionId: string;
  selectedBooth?: string;
  //   selectedGender?: string;
}) => {
  const [agePollingData, setAgePollingData] = useState<any>({});
  const [categoryDistActiveTab, setCategoryDistActiveTab] =
    useState("religion");
  const [selectedGender, setSelectedGender] = useState<string | undefined>(
    "male"
  );
  // 🧠 Second Graph Hooks (with booth and gender)
  const { religions: tabReligions, fetchReligionData: fetchTabReligionData } =
    useReligionData(selectedElectionId, selectedBooth, selectedGender);
  const { castes: tabCastes, fetchCasteData: fetchTabCasteData } = useCasteData(
    parseInt(selectedElectionId),
    selectedBooth,
    selectedGender
  );
  const { subCastes: tabSubCastes, fetchSubCasteData: fetchTabSubCasteData } =
    useSubCasteData(
      parseInt(selectedElectionId),
      selectedBooth,
      selectedGender
    );
  const { schemes: tabSchemes, fetchSchemeData: fetchTabSchemeData } =
    useSchemeData(parseInt(selectedElectionId), selectedBooth, selectedGender);
  const { histories: tabHistories, fetchHistoryData: fetchTabHistoryData } =
    useHistoryData(selectedElectionId, selectedBooth, selectedGender);
  const {
    availabilities: tabAvailabilities,
    fetchAvailabilityData: fetchTabAvailabilityData,
  } = useAvailabilityData(
    parseInt(selectedElectionId),
    selectedBooth,
    selectedGender
  );
  const { parties: tabParties, fetchPartyData: fetchTabPartyData } =
    usePartyData(parseInt(selectedElectionId), selectedBooth, selectedGender);
  const { languages: tabLanguages, fetchLanguageData: fetchTabLanguageData } =
    useLanguageData(
      parseInt(selectedElectionId),
      selectedBooth,
      selectedGender
    );
  const { feedbacks: tabFeedbacks, fetchFeedbackData: fetchTabFeedbackData } =
    useFeedbacksData(selectedElectionId, selectedBooth, selectedGender);

  const getRandomColor = useCallback(() => {
    const colors = [
      "#6A80FF",
      "#85F88D",
      "#191919",
      "#6A80FF",
      "#85F88D",
      "#191919",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const fetchAgePollingData = useCallback(async () => {
    try {
      const response = await getPollDayDataAgeWise(parseInt(selectedElectionId));
      const record = response?.pollingAgeWiseRecords?.[0] || {};
      setAgePollingData(record);
    } catch (err) {
      console.error("Error fetching polling age data:", err);
    }
  }, [selectedElectionId]);
  

  useEffect(() => {
    console.log("selected booth",selectedBooth);
    console.log("selected election",selectedElectionId);
    fetchAgePollingData();
  }, [fetchAgePollingData]);

  const agePollingChartData = useMemo(
    () => [
      { name: "18-30", value: agePollingData.ageGroup18To30 || 0 },
      { name: "30-40", value: agePollingData.ageGroup30To40 || 0 },
      { name: "40-50", value: agePollingData.ageGroup40To50 || 0 },
      { name: "50-60", value: agePollingData.ageGroup50To60 || 0 },
      { name: "60-70", value: agePollingData.ageGroup60To70 || 0 },
      { name: "70+", value: agePollingData.above70 || 0 },
    ],
    [agePollingData]
  );

  const categoryTabData = {
    religion: tabReligions,
    caste: tabCastes,
    subcaste: tabSubCastes,
    scheme: tabSchemes,
    history: tabHistories,
    availability: tabAvailabilities,
    party: tabParties,
    language: tabLanguages,
    issues: tabFeedbacks,
  };

  useEffect(() => {
    if (!selectedElectionId || !selectedBooth || !selectedGender) return;

    let activeFetcher: (() => Promise<void>) | null = null;

    switch (categoryDistActiveTab) {
      case "religion":
        activeFetcher = fetchTabReligionData;
        break;
      case "caste":
        activeFetcher = fetchTabCasteData;
        break;
      case "subcaste":
        activeFetcher = fetchTabSubCasteData;
        break;
      case "scheme":
        activeFetcher = fetchTabSchemeData;
        break;
      case "history":
        activeFetcher = fetchTabHistoryData;
        break;
      case "availability":
        activeFetcher = fetchTabAvailabilityData;
        break;
      case "party":
        activeFetcher = fetchTabPartyData;
        break;
      case "language":
        activeFetcher = fetchTabLanguageData;
        break;
      case "issues":
        activeFetcher = fetchTabFeedbackData;
        break;
    }

    if (activeFetcher) {
      activeFetcher();
    }
  }, [
    categoryDistActiveTab,
    selectedElectionId,
    selectedBooth,
    selectedGender,
  ]);
  useEffect(() => {
    console.log("🧪 Fetched religions", tabReligions);
  }, [tabReligions]);

  const normalizedCategoryData = useMemo(() => {
    const rawData = categoryTabData[categoryDistActiveTab] || [];
    return rawData.map((item: any) => ({
      name:
        item.religionName ||
        item.casteName ||
        item.subCasteName ||
        item.schemeName ||
        item.historyName ||
        item.availabilityName ||
        item.partyName ||
        item.languageName ||
        item.issueTitle || // for issues
        item.name || // fallback
        "Unnamed",
      value: item.voterCount || item.value || 0,
      color: item.color,
    }));
  }, [categoryDistActiveTab, categoryTabData]);
  
  

  return (
    <div className="mt-8 space-y-8">
      {/* 👴 Age Polling Graph */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Polling Based on Age</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agePollingChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {agePollingChartData.map((entry, index) => (
                <Cell key={index} fill={getRandomColor()} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🧠 Category Distribution */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Category Distribution</h3>
          <Select
            placeholder="Select Gender"
            style={{ width: 160 }}
            value={selectedGender}
            onChange={setSelectedGender}
            allowClear
          >
            <Option value={undefined}>All</Option>
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="other">Other</Option>
          </Select>
        </div>{" "}
        <Tabs
          activeKey={categoryDistActiveTab}
          onChange={setCategoryDistActiveTab}
          className="mb-4"
        >
          {CategoryTabs.map((tab) => (
            <Tabs.TabPane
              key={tab}
              tab={tab.charAt(0).toUpperCase() + tab.slice(1)}
            />
          ))}
        </Tabs>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={normalizedCategoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {(categoryTabData[categoryDistActiveTab] || []).map(
                (entry, index) => (
                  <Cell key={index} fill={entry.color || getRandomColor()} />
                )
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdditionalElectionGraphs;

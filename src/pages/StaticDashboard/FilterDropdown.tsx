import React, { useState, useEffect } from "react";
import {
  Dropdown,
  Button,
  Checkbox,
  Select,
  Slider,
  Divider,
  Space,
  Spin,
  Tooltip,
  message,
  Radio,
} from "antd";
import { DownOutlined, FilterOutlined } from "@ant-design/icons";
import { getLanguagesApi } from "../../api/languageApi";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import { fetchSubCaste } from "../../api/subCasteApi";
import { fetchCaste } from "../../api/casteApi";
import { fetchReligion } from "../../api/religionApi";
import { fetchParties } from "../../api/partyApi";
import { PollDayFilters } from "../../api/reportingApi";

const { Option } = Select;

interface FilterDropdownProps {
  chartId: string;
  selectedElectionId: string;
  currentFilters?: PollDayFilters;
  onApply: (filters: PollDayFilters) => void;
}

interface FilterData {
  religions: any[];
  castes: any[];
  subCastes: any[];
  casteCategories: any[];
  languages: any[];
  schemes: any[];
  parties: any[];
}

const sharedFilterDataCache = new Map<string, FilterData>();
const sharedFilterDataRequests = new Map<string, Promise<FilterData>>();

const createEmptyFilterData = (): FilterData => ({
  religions: [],
  castes: [],
  subCastes: [],
  casteCategories: [],
  languages: [],
  schemes: [],
  parties: [],
});

const getSharedFilterData = async (
  selectedElectionId: string
): Promise<FilterData> => {
  const cachedData = sharedFilterDataCache.get(selectedElectionId);
  if (cachedData) {
    return cachedData;
  }

  const pendingRequest = sharedFilterDataRequests.get(selectedElectionId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const electionId = parseInt(selectedElectionId, 10);
  const request = Promise.all([
    fetchReligion(electionId),
    fetchCasteCategories(electionId),
    getLanguagesApi(electionId),
    getBenefitSchemesApi(electionId),
    fetchParties(electionId),
  ])
    .then(
      ([
        religionResponse,
        casteCategoryResponse,
        languageResponse,
        schemeResponse,
        partyResponse,
      ]) => {
        const data: FilterData = {
          religions:
            religionResponse?.data?.data
              ?.map((r: any) => ({
                key: r.religionId,
                religionName: r.religionName,
                orderIndex: r?.orderIndex,
              }))
              .sort(
                (a: any, b: any) =>
                  Number(a?.orderIndex) - Number(b?.orderIndex)
              ) || [],
          castes: [],
          subCastes: [],
          casteCategories:
            casteCategoryResponse?.data?.map((item: any) => ({
              key: item.casteCategoryId,
              casteCategoryName: item.casteCategoryName,
            })) || [],
          languages:
            languageResponse.data
              ?.map((lang: any) => ({
                key: lang.id,
                languageName: lang.languageName,
                orderIndex: lang?.orderIndex,
              }))
              .sort(
                (a: any, b: any) =>
                  Number(a?.orderIndex) - Number(b?.orderIndex)
              ) || [],
          schemes:
            schemeResponse.data
              ?.map((scheme: any) => ({
                ...scheme,
                key: scheme.id,
                orderIndex: scheme?.orderIndex,
              }))
              .sort(
                (a: any, b: any) =>
                  Number(a?.orderIndex) - Number(b?.orderIndex)
              ) || [],
          parties:
            partyResponse?.data
              ?.map((p: any) => ({
                key: p.id,
                partyName: p.partyName,
                orderIndex: p?.orderIndex,
              }))
              .sort(
                (a: any, b: any) =>
                  Number(a?.orderIndex) - Number(b?.orderIndex)
              ) || [],
        };

        sharedFilterDataCache.set(selectedElectionId, data);
        sharedFilterDataRequests.delete(selectedElectionId);
        return data;
      }
    )
    .catch((error) => {
      sharedFilterDataRequests.delete(selectedElectionId);
      throw error;
    });

  sharedFilterDataRequests.set(selectedElectionId, request);
  return request;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  chartId,
  selectedElectionId,
  currentFilters,
  onApply,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState<FilterData>(
    createEmptyFilterData()
  );
  const [star, setStar] = useState<boolean | null>(null);

  // Local state for filter values - initialize from currentFilters
  const [selectedParties, setSelectedParties] = useState<string[]>(
    currentFilters?.parties || []
  );
  const [selectedReligions, setSelectedReligions] = useState<string[]>(
    currentFilters?.religions || []
  );
  const [selectedCasteCategories, setSelectedCasteCategories] = useState<
    string[]
  >(currentFilters?.casteCategories || []);
  const [selectedCastes, setSelectedCastes] = useState<string[]>(
    currentFilters?.castes || []
  );
  const [selectedSubCastes, setSelectedSubCastes] = useState<string[]>(
    currentFilters?.subCastes || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    currentFilters?.languages || []
  );
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>(
    currentFilters?.schemes || []
  );
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    currentFilters?.genders || []
  );
  const [ageRange, setAgeRange] = useState<[number, number]>([
    currentFilters?.minAge ?? 18,
    currentFilters?.maxAge ?? 120,
  ]);
  const [includeUnknownAge, setIncludeUnknownAge] = useState(
    currentFilters?.includeUnknownAge ?? true
  );
  const [hasMobileNo, setHasMobileNo] = useState(
    currentFilters?.hasMobileNo ?? false
  );
  const [hasWhatsappNo, setHasWhatsappNo] = useState(
    currentFilters?.hasWhatsappNo ?? false
  );

  // Local state for age input strings to allow typing
  const [minAgeInput, setMinAgeInput] = useState<string>(
    (currentFilters?.minAge ?? 18).toString()
  );
  const [maxAgeInput, setMaxAgeInput] = useState<string>(
    (currentFilters?.maxAge ?? 120).toString()
  );

  useEffect(() => {
    setSelectedParties(currentFilters?.parties || []);
    setSelectedReligions(currentFilters?.religions || []);
    setSelectedCasteCategories(currentFilters?.casteCategories || []);
    setSelectedCastes(currentFilters?.castes || []);
    setSelectedSubCastes(currentFilters?.subCastes || []);
    setSelectedLanguages(currentFilters?.languages || []);
    setSelectedSchemes(currentFilters?.schemes || []);
    setSelectedGenders(currentFilters?.genders || []);
    setAgeRange([currentFilters?.minAge ?? 18, currentFilters?.maxAge ?? 120]);
    setMinAgeInput((currentFilters?.minAge ?? 18).toString());
    setMaxAgeInput((currentFilters?.maxAge ?? 120).toString());
    setIncludeUnknownAge(currentFilters?.includeUnknownAge ?? true);
    setHasMobileNo(currentFilters?.hasMobileNo ?? false);
    setHasWhatsappNo(currentFilters?.hasWhatsappNo ?? false);
  }, [currentFilters]);

  // Update input fields when slider moves
  const handleSliderChange = (values: [number, number]) => {
    setAgeRange(values);
    setMinAgeInput(values[0].toString());
    setMaxAgeInput(values[1].toString());
  };

  const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinAgeInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 18 && num <= ageRange[1]) {
      setAgeRange([num, ageRange[1]]);
    }
  };

  const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMaxAgeInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= ageRange[0] && num <= 120) {
      setAgeRange([ageRange[0], num]);
    }
  };

  const handleAgeBlur = () => {
    // Final validation on blur to ensure values are within bounds
    let min = parseInt(minAgeInput, 10);
    let max = parseInt(maxAgeInput, 10);

    if (isNaN(min) || min < 18) min = 18;
    if (isNaN(max) || max > 120) max = 120;
    if (min > max) min = max;

    setAgeRange([min, max]);
    setMinAgeInput(min.toString());
    setMaxAgeInput(max.toString());
  };

  useEffect(() => {
    let active = true;

    if (!selectedElectionId) {
      setFilterData(createEmptyFilterData());
      return () => {
        active = false;
      };
    }

    getSharedFilterData(selectedElectionId)
      .then((data) => {
        if (active) {
          setFilterData((prev) => ({
            ...data,
            castes: prev.castes,
            subCastes: prev.subCastes,
          }));
        }
      })
      .catch((error) => {
        console.error("Error preloading filter data:", error);
      });

    return () => {
      active = false;
    };
  }, [selectedElectionId]);

  useEffect(() => {
    if (currentFilters?.star === true) setStar(true);
    else if (currentFilters?.star === false) setStar(false);
    else setStar(null);
  }, [currentFilters]);

  useEffect(() => {
    if (dropdownVisible && selectedElectionId) {
      fetchAllFilterData();
    }
  }, [dropdownVisible, selectedElectionId]);

  const fetchAllFilterData = async () => {
    const cachedData = sharedFilterDataCache.get(selectedElectionId);
    if (cachedData) {
      setFilterData((prev) => ({
        ...cachedData,
        castes: prev.castes,
        subCastes: prev.subCastes,
      }));
      return;
    }

    setLoading(true);
    try {
      const data = await getSharedFilterData(selectedElectionId);
      setFilterData((prev) => ({
        ...data,
        castes: prev.castes,
        subCastes: prev.subCastes,
      }));
    } catch (error) {
      console.error("Error fetching filter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCastesData = async (religionId: number) => {
    try {
      const response = await fetchCaste(
        parseInt(selectedElectionId),
        religionId
      );
      const fetchedCastes =
        response?.data?.data
          ?.map((caste: any) => ({
            key: caste.casteId,
            casteName: caste.casteName,
            religionId: caste.religionId,
            orderIndex: caste?.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];

      setFilterData((prev) => ({ ...prev, castes: fetchedCastes }));
    } catch (error) {
      console.error("Error fetching castes: ", error);
      setFilterData((prev) => ({ ...prev, castes: [] }));
    }
  };

  const fetchSubCastesData = async (casteId: number) => {
    try {
      const response = await fetchSubCaste(
        parseInt(selectedElectionId),
        casteId
      );
      const fetchedSubCastes =
        response?.data?.data
          ?.map((subCaste: any) => ({
            key: subCaste.subCasteId,
            subCasteName: subCaste.subCasteName,
            casteName: subCaste.casteName,
            religionName: subCaste.religionName,
            orderIndex: subCaste.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];

      setFilterData((prev) => ({ ...prev, subCastes: fetchedSubCastes }));
    } catch (error) {
      console.error("Error fetching sub-castes: ", error);
      setFilterData((prev) => ({ ...prev, subCastes: [] }));
    }
  };


  // Handle religion change to fetch castes
  const handleReligionChange = (religionIds: string[]) => {
    setSelectedReligions(religionIds);
    if (religionIds.length > 0) {
      // Fetch castes for the first selected religion
      const firstReligion = filterData.religions.find(
        (r) => r.religionName === religionIds[0]
      );
      if (firstReligion) {
        fetchCastesData(firstReligion.key);
      }
    } else {
      setFilterData((prev) => ({ ...prev, castes: [], subCastes: [] }));
      setSelectedCastes([]);
      setSelectedSubCastes([]);
    }
  };

  // Handle caste change to fetch sub-castes
  const handleCasteChange = (casteNames: string[]) => {
    setSelectedCastes(casteNames);
    if (casteNames.length > 0) {
      const firstCaste = filterData.castes.find(
        (c) => c.casteName === casteNames[0]
      );
      if (firstCaste) {
        fetchSubCastesData(firstCaste.key);
      }
    } else {
      setFilterData((prev) => ({ ...prev, subCastes: [] }));
      setSelectedSubCastes([]);
    }
  };

  const handleApply = () => {
    const filters: PollDayFilters = {
      parties: selectedParties.length > 0 ? selectedParties : undefined,
      religions: selectedReligions.length > 0 ? selectedReligions : undefined,
      casteCategories: selectedCasteCategories.length > 0 ? selectedCasteCategories : undefined,
      castes: selectedCastes.length > 0 ? selectedCastes : undefined,
      subCastes: selectedSubCastes.length > 0 ? selectedSubCastes : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      schemes: selectedSchemes.length > 0 ? selectedSchemes : undefined,
      genders: selectedGenders.length > 0 ? selectedGenders : undefined,
      minAge: ageRange[0] !== 18 ? ageRange[0] : undefined,
      maxAge: ageRange[1] !== 120 ? ageRange[1] : undefined,
      includeUnknownAge,
      hasMobileNo: hasMobileNo || undefined,
      hasWhatsappNo: hasWhatsappNo || undefined,
      star: star !== null ? star : undefined,
    };

    const hasFilters = Object.values(filters).some((v) => v !== undefined && (!Array.isArray(v) || v.length > 0));

    console.log("Filters saved for chart:", chartId, filters);
    onApply(filters);
    setDropdownVisible(false);
    
    if (hasFilters) {
      message.success("Filters applied - Chart data will refresh");
    } else {
      message.info("All filters cleared - Showing global data");
    }
  };

  const handleClear = () => {
    setSelectedParties([]);
    setSelectedReligions([]);
    setSelectedCasteCategories([]);
    setSelectedCastes([]);
    setSelectedSubCastes([]);
    setSelectedLanguages([]);
    setSelectedSchemes([]);
    setSelectedGenders([]);
    setAgeRange([18, 120]);
    setMinAgeInput("18");
    setMaxAgeInput("120");
    setIncludeUnknownAge(true);
    setHasMobileNo(false);
    setHasWhatsappNo(false);
    setStar(null);

    const emptyFilters: PollDayFilters = {
      includeUnknownAge: true,
    };

    console.log("Filters cleared for chart:", chartId);
    onApply(emptyFilters);
    setDropdownVisible(false);
  };

  const filterMenu = (
    <div
      className="bg-[#f9f9f9] rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)] w-[350px] flex flex-col"
      style={{ maxHeight: "500px" }}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 pb-0 bg-[#f9f9f9]">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Party Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Party:
              </span>
              <Select
                mode="multiple"
                placeholder="Select Parties"
                className="w-full"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                value={selectedParties}
                onChange={setSelectedParties}
                allowClear
              >
                {filterData.parties?.map((p) => (
                  <Option key={p.key} value={p.partyName}>
                    {p.partyName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Religion Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Religion:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder="Select Religions"
                className="w-full"
                value={selectedReligions}
                onChange={handleReligionChange}
                allowClear
                loading={loading}
              >
                {filterData.religions.map((religion) => (
                  <Option key={religion.key} value={religion.religionName}>
                    {religion.religionName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Caste Category Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Caste Category:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder="Select Caste Categories"
                className="w-full"
                value={selectedCasteCategories}
                onChange={setSelectedCasteCategories}
                allowClear
              >
                {filterData.casteCategories.map((category) => (
                  <Option key={category.key} value={category.casteCategoryName}>
                    {category.casteCategoryName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Caste Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Caste:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder={
                  selectedReligions.length > 0
                    ? "Select Castes"
                    : "Select Religion first"
                }
                className="w-full"
                value={selectedCastes}
                onChange={handleCasteChange}
                allowClear
                disabled={selectedReligions.length === 0}
                loading={loading}
              >
                {filterData.castes.map((caste) => (
                  <Option key={caste.key} value={caste.casteName}>
                    {caste.casteName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Sub-Caste Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Sub-Caste:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder={
                  selectedCastes.length > 0
                    ? "Select Sub-Castes"
                    : "Select Caste first"
                }
                className="w-full"
                value={selectedSubCastes}
                onChange={setSelectedSubCastes}
                allowClear
                disabled={selectedCastes.length === 0}
                loading={loading}
              >
                {filterData.subCastes.map((subCaste) => (
                  <Option key={subCaste.key} value={subCaste.subCasteName}>
                    {subCaste.subCasteName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Language Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Language:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder="Select Languages"
                className="w-full"
                value={selectedLanguages}
                onChange={setSelectedLanguages}
                allowClear
              >
                {filterData.languages.map((language) => (
                  <Option key={language.key} value={language.languageName}>
                    {language.languageName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Schemes Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Schemes:
              </span>
              <Select
                mode="multiple"
                getPopupContainer={(trigger) =>
                  trigger.parentElement || document.body
                }
                placeholder="Select Schemes"
                className="w-full"
                value={selectedSchemes}
                onChange={setSelectedSchemes}
                allowClear
              >
                {filterData.schemes.map((scheme) => (
                  <Option key={scheme.key} value={scheme.schemeName}>
                    {scheme.schemeName}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Gender Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Gender:
              </span>
              <Checkbox.Group
                options={["Male", "Female", "Other"]}
                value={selectedGenders}
                onChange={setSelectedGenders}
                className="w-full"
              />
            </div>

            <div className="mb-4">
  <span className="block mb-2 font-medium text-gray-700">
    Star:
  </span>

<Radio.Group
  value={star}
  onChange={(e) => setStar(e.target.value)}
>
  <Space direction="vertical">
    <Radio value={null}>All</Radio>
    <Radio value={true}>Yes</Radio>
    <Radio value={false}>No</Radio>
  </Space>
</Radio.Group>
</div>

            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Contact Number:
              </span>
              <Space direction="vertical" className="w-full">
                <Checkbox
                  checked={hasMobileNo}
                  onChange={(e) => setHasMobileNo(e.target.checked)}
                >
                  Mobile Number
                </Checkbox>
                <Checkbox
                  checked={hasWhatsappNo}
                  onChange={(e) => setHasWhatsappNo(e.target.checked)}
                >
                  WhatsApp Number
                </Checkbox>
              </Space>
            </div>

            {/* Age Range Filter */}
            <div className="mb-4">
              <span className="block mb-2 font-medium text-gray-700">
                Age Range:
              </span>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={minAgeInput}
                  onChange={handleMinAgeChange}
                  onBlur={handleAgeBlur}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="border rounded px-2 py-1 w-20 text-sm"
                  placeholder="Min"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={maxAgeInput}
                  onChange={handleMaxAgeChange}
                  onBlur={handleAgeBlur}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="border rounded px-2 py-1 w-20 text-sm"
                  placeholder="Max"
                />
              </div>
              <Slider
                range
                min={18}
                max={120}
                step={1}
                value={ageRange}
                className="custom-slider"
                onChange={(values) => handleSliderChange(values as [number, number])}
              />
              <div className="text-center mt-1 text-sm text-gray-600">
                {ageRange[0]} - {ageRange[1]} years
              </div>
              <Checkbox
                checked={includeUnknownAge}
                onChange={(e) => setIncludeUnknownAge(e.target.checked)}
                className="mt-2"
              >
                Include Unknown Age
              </Checkbox>
            </div>
          </>
        )}
      </div>

      {/*footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        <div className="p-4">
          <Space direction="vertical" className="w-full">
            <Button
              type="primary"
              onClick={handleApply}
              block
              className="h-[40px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[14px] font-semibold hover:!bg-[#1D4ED8] hover:!border-[#1D4ED8]"
            >
              Apply Filters
            </Button>
            <Button
              onClick={handleClear}
              block
              className="h-[40px] bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300 hover:border-gray-400"
            >
              Clear All Filters
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );

  // Check if there are any active filters applied to this chart
  const hasActiveFilters = currentFilters && Object.keys(currentFilters).length > 0 && 
    Object.values(currentFilters).some((v) => 
      v !== undefined && 
      v !== true && // Don't count includeUnknownAge as it's default true
      (!Array.isArray(v) || v.length > 0)
    );

  return (
    <Dropdown
      dropdownRender={() => filterMenu}
      trigger={["click"]}
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      placement="bottomRight"
    >
      <Tooltip title={hasActiveFilters ? "Filters active - Click to edit" : "Add filters"}>
        <Button
          type={hasActiveFilters ? "primary" : "text"}
          icon={<FilterOutlined />}
          size="middle"
          className={hasActiveFilters ? "bg-[#1D4ED8]" : ""}
        />
      </Tooltip>
    </Dropdown>
  );
};

export default FilterDropdown;

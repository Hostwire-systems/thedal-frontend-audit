import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "./Communication.css";
import "react-quill/dist/quill.snow.css";
import {
  Input,
  Select,
  Button,
  Tag,
  Upload,
  Card,
  Tabs,
  Typography,
  Row,
  Col,
  Descriptions,
  Space,
  message,
  Checkbox,
} from "antd";
import CampaignWizardLayout from "../../components/communication/CampaignWizardLayout";
import { Breadcrumb } from "antd";
import {
  LeftOutlined,
  PlusOutlined,
  PaperClipOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  getFilterOptions,
  listWhatsAppSenders,
  estimateCampaign,
  createCampaign,
  sendCampaign,
  type FilterOptionsResponse,
  type WhatsAppSender,
  type CampaignButton,
  type CampaignFilters,
  type SimpleItem,
} from "../../api/campaignApi";
import { fetchCaste } from "../../api/casteApi";
import { fetchSubCaste } from "../../api/subCasteApi";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface FormData {
  title: string;
  content: string;
  senderId: string;
  language: string;
  age: string; // age range code
  gender: string; // gender code
  tags: string[];
  parts?: number[];
  sections?: string[];
  pollStatus?: string[];
  religionIds?: string[];
  casteIds?: string[];
  subCasteIds?: string[];
  casteCategoryIds?: string[];
  availabilityIds?: string[];
  partyIds?: string[];
}

interface ButtonData {
  id: number;
  type: "url" | "call" | "quick_reply";
  label: string;
  value: string;
}

interface MediaFile {
  uid: string;
  name: string;
  type: string;
  size: number;
  caption?: string;
}

const CreateWhatsappMessage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("text");
  const [variableTags, setVariableTags] = useState<string[]>([
    "{voter_name}",
    "{party_name}",
    "{constituency}",
  ]);
  const [newVariableTag, setNewVariableTag] = useState<string>("");

  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [shouldAutoEstimate, setShouldAutoEstimate] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "BJP Manifesto Brief",
    content:
      "<p>Dear [voter_name],</p><p>Summary of our manifesto:</p><ul><li>Improved infrastructure</li><li>Free healthcare</li><li>Better education</li></ul>",
    senderId: "",
    language: "en",
    age: "",
    gender: "",
    tags: ["Manifesto", "Election2024"],
    parts: [],
    sections: [],
    religionIds: [],
    casteIds: [],
    subCasteIds: [],
    casteCategoryIds: [],
    availabilityIds: [],
    partyIds: [],
  });

  // Global context
  const selectedElectionId = useSelector(
    (state: any) => state.election?.selectedElectionId
  );
  const accountId =
    Number(localStorage.getItem("accountId")) ||
    Number(localStorage.getItem("userId")) ||
    undefined;

  // Backend-driven options
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [senders, setSenders] = useState<WhatsAppSender[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [estimateCount, setEstimateCount] = useState<number | null>(null);

  // Dynamic caste/subcaste filtering based on religion/caste selection
  const [filteredCastes, setFilteredCastes] = useState<SimpleItem[]>([]);
  const [filteredSubCastes, setFilteredSubCastes] = useState<SimpleItem[]>([]);
  const [loadingCastes, setLoadingCastes] = useState(false);
  const [loadingSubCastes, setLoadingSubCastes] = useState(false);

  // Load URL parameters and pre-fill parts filter
  useEffect(() => {
    const partsParam = searchParams.get("parts");
    const autoEstimate = searchParams.get("autoEstimate");

    if (partsParam) {
      const partsArray = partsParam
        .split(",")
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p));
      if (partsArray.length > 0) {
        setFormData((prev) => ({ ...prev, parts: partsArray }));
        setShouldAutoEstimate(autoEstimate === "true");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingFilters(true);
        const [filtersRes, sendersRes] = await Promise.all([
          getFilterOptions(
            selectedElectionId ? parseInt(selectedElectionId) : undefined,
            accountId
          ),
          listWhatsAppSenders(),
        ]);
        setFilterOptions(filtersRes);
        setSenders(sendersRes || []);
        if (!formData.senderId && sendersRes && sendersRes.length > 0) {
          setFormData((prev) => ({ ...prev, senderId: sendersRes[0].id }));
        }
      } catch (e: any) {
        message.error(e?.message || "Failed to load filter options");
      } finally {
        setLoadingFilters(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElectionId, accountId]);

  // Auto-estimate when filters are loaded and parts are pre-filled
  useEffect(() => {
    if (
      shouldAutoEstimate &&
      !loadingFilters &&
      filterOptions &&
      formData.parts &&
      formData.parts.length > 0
    ) {
      setShouldAutoEstimate(false); // Only run once
      onEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingFilters, filterOptions, shouldAutoEstimate]);

  // Fetch castes when religion selection changes
  useEffect(() => {
    const fetchCastesForReligions = async () => {
      if (!selectedElectionId || !formData.religionIds || formData.religionIds.length === 0) {
        setFilteredCastes([]);
        return;
      }

      try {
        setLoadingCastes(true);
        // Fetch castes for all selected religions
        const allCastesPromises = formData.religionIds.map(async (religionId) => {
          const response = await fetchCaste(
            parseInt(selectedElectionId),
            parseInt(religionId)
          );
          return response?.data?.data?.map((caste: any) => ({
            id: caste.casteId.toString(),
            name: caste.casteName,
          })) || [];
        });

        const allCastesArrays = await Promise.all(allCastesPromises);
        // Flatten and remove duplicates based on id
        const allCastes = allCastesArrays
          .flat()
          .filter((caste, index, self) => 
            index === self.findIndex((c) => c.id === caste.id)
          );
        
        setFilteredCastes(allCastes);
      } catch (error) {
        console.error("Error fetching castes:", error);
        setFilteredCastes([]);
      } finally {
        setLoadingCastes(false);
      }
    };

    fetchCastesForReligions();
    // Reset dependent selections when religion changes
    setFormData((prev) => ({ ...prev, casteIds: [], subCasteIds: [] }));
  }, [formData.religionIds, selectedElectionId]);

  // Fetch subcastes when caste selection changes
  useEffect(() => {
    const fetchSubCastesForCastes = async () => {
      if (!selectedElectionId || !formData.casteIds || formData.casteIds.length === 0) {
        setFilteredSubCastes([]);
        return;
      }

      try {
        setLoadingSubCastes(true);
        // Fetch subcastes for all selected castes
        const allSubCastesPromises = formData.casteIds.map(async (casteId) => {
          const response = await fetchSubCaste(
            parseInt(selectedElectionId),
            parseInt(casteId)
          );
          return response?.data?.data?.map((subCaste: any) => ({
            id: subCaste.subCasteId.toString(),
            name: subCaste.subCasteName,
          })) || [];
        });

        const allSubCastesArrays = await Promise.all(allSubCastesPromises);
        // Flatten and remove duplicates based on id
        const allSubCastes = allSubCastesArrays
          .flat()
          .filter((subCaste, index, self) => 
            index === self.findIndex((sc) => sc.id === subCaste.id)
          );
        
        setFilteredSubCastes(allSubCastes);
      } catch (error) {
        console.error("Error fetching subcastes:", error);
        setFilteredSubCastes([]);
      } finally {
        setLoadingSubCastes(false);
      }
    };

    fetchSubCastesForCastes();
    // Reset subcaste selection when caste changes
    setFormData((prev) => ({ ...prev, subCasteIds: [] }));
  }, [formData.casteIds, selectedElectionId]);

  const steps = ["Audience", "Compose", "Review"];
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
      ],
    }),
    []
  );

  const handleChange = (key: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleInsertTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      content: (prev.content || "") + " " + tag,
    }));
  };

  const handleAddCustomTag = () => {
    if (!newVariableTag.trim()) return;

    if (!newVariableTag.startsWith("{") || !newVariableTag.endsWith("}")) {
      alert("Variable must start with { and end with }");
      return;
    }

    if (variableTags.includes(newVariableTag)) {
      alert("This variable already exists!");
      return;
    }

    setVariableTags([...variableTags, newVariableTag]);
    setNewVariableTag(""); // clear the input after adding
  };
  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const addButton = (type: ButtonData["type"]) => {
    if (buttons.length < 3) {
      setButtons([...buttons, { id: Date.now(), type, label: "", value: "" }]);
    }
  };

  const buildFilters = (): CampaignFilters => {
    return {
      electionId: selectedElectionId ? parseInt(selectedElectionId) : undefined,
      accountId: accountId || undefined,
      partNos:
        formData.parts && formData.parts.length ? formData.parts : undefined,
      sectionIds:
        formData.sections && formData.sections.length
          ? (formData.sections as string[])
          : undefined,
      casteIds:
        (formData.casteIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      subCasteIds:
        (formData.subCasteIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      casteCategoryIds:
        (formData.casteCategoryIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      religionIds:
        (formData.religionIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      partyIds:
        (formData.partyIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      availabilityIds:
        (formData.availabilityIds || [])
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v)) || undefined,
      pollStatus:
        formData.pollStatus && formData.pollStatus.length
          ? formData.pollStatus
          : undefined,
      ageRange: formData.age || undefined,
      gender: formData.gender || undefined,
      tags: formData.tags && formData.tags.length ? formData.tags : undefined,
    };
  };

  const onEstimate = async () => {
    try {
      setLoadingEstimate(true);
      const res = await estimateCampaign({
        channel: "whatsapp",
        filters: buildFilters(),
      });
      setEstimateCount(res.count);
      message.success(`Estimated recipients: ${res.count}`);
    } catch (e: any) {
      message.error(e?.message || "Failed to estimate recipients");
    } finally {
      setLoadingEstimate(false);
    }
  };

  const toCampaignButtons = (btns: ButtonData[]): CampaignButton[] =>
    btns.map((b) => ({ type: b.type, label: b.label, value: b.value }));

  const onCreate = async (sendNow: boolean) => {
    try {
      setLoadingCreate(true);
      const payload = {
        channel: "whatsapp" as const,
        title: formData.title,
        senderId: formData.senderId,
        language: formData.language,
        contentHtml: formData.content,
        buttons: buttons.length ? toCampaignButtons(buttons) : undefined,
        media: mediaFile
          ? { mediaId: mediaFile.uid, caption: mediaFile.caption }
          : undefined,
        tags: formData.tags,
        filters: buildFilters(),
        schedule: { when: sendNow ? "now" : "now" },
      };
      const created = await createCampaign(payload);
      if (sendNow) {
        await sendCampaign(created.id);
      }
      message.success(
        sendNow ? "Campaign created and sent" : "Campaign created"
      );
      setEstimateCount(created.recipientsCount ?? estimateCount);
      // Navigate back to the previous page (list)
      navigate(-1);
    } catch (e: any) {
      message.error(e?.message || "Failed to create campaign");
    } finally {
      setLoadingCreate(false);
    }
  };

  const updateButton = (id: number, field: keyof ButtonData, value: string) => {
    setButtons(
      buttons.map((btn) => (btn.id === id ? { ...btn, [field]: value } : btn))
    );
  };

  const removeButton = (id: number) =>
    setButtons(buttons.filter((btn) => btn.id !== id));

  const handleMediaUpload = (file: any) => {
    setMediaFile({
      uid: file.uid,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    return false;
  };

  const ComposeStep = () => (
    <Card>
      <Title level={4}>Compose Message</Title>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Sender
          </label>
          <Select
            placeholder="Select sender"
            className="w-full"
            loading={loadingFilters}
            options={(senders || []).map((s) => ({
              value: s.id,
              label: s.display,
            }))}
            value={formData.senderId || undefined}
            onChange={(val) => handleChange("senderId", val)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <Select
            className="w-full"
            value={formData.language}
            onChange={(val) => handleChange("language", val)}
            options={[
              { value: "en", label: "English" },
              { value: "ta", label: "Tamil" },
            ]}
          />
        </div>
      </div>
      <Input
        placeholder="Message Title"
        value={formData.title}
        onChange={(e) => handleChange("title", e.target.value)}
        className="mb-4"
      />
      <Tabs
        activeKey={activeTab}
        className="whatsapp-tabs"
        tabBarStyle={{
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "24px",
        }}
        onChange={setActiveTab}
      >
        <TabPane
          tab={
            <span
              className={`tab-label ${activeTab === "text" ? "active" : ""}`}
            >
              Text
            </span>
          }
          key="text"
        >
          <div className="my-5">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => handleChange("content", value)}
              modules={quillModules}
              className="mb-4 h-48"
            />
          </div>
          <div className="my-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variable Tags
            </label>

            {/* Existing Tags */}
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {variableTags.map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-1 border border-[#1D4ED8] text-[#1D4ED8] bg-white rounded-full text-sm cursor-pointer hover:bg-[#dbe7ff]"
                  onClick={() => handleInsertTag(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>

            {/* Input to Add Custom Tag */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Enter new variable (e.g., {district})"
                value={newVariableTag}
                onChange={(e) => setNewVariableTag(e.target.value)}
                className="w-full"
              />
              <Button
                className="bg-[#1D4ED8] text-white"
                onClick={() => {
                  if (!newVariableTag.trim()) return;
                  if (
                    !newVariableTag.startsWith("{") ||
                    !newVariableTag.endsWith("}")
                  ) {
                    message.error("Tag must start with { and end with }");
                    return;
                  }
                  setVariableTags([...variableTags, newVariableTag]);
                  setNewVariableTag(""); // Clear input
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <Text type="secondary">
            {formData.content.replace(/<[^>]*>/g, "").length}/1000 chars
          </Text>
        </TabPane>
        <TabPane
          tab={
            <span
              className={`tab-label ${activeTab === "media" ? "active" : ""}`}
            >
              Media
            </span>
          }
          key="media"
        >
          <Row gutter={16} className="mb-4">
            {[
              {
                id: "image-upload",
                accept: "image/*",
                icon: <PictureOutlined />,
              },
              {
                id: "video-upload",
                accept: "video/*",
                icon: <VideoCameraOutlined />,
              },
              { id: "doc-upload", accept: ".pdf", icon: <FilePdfOutlined /> },
            ].map(({ id, accept, icon }) => (
              <Col span={8} key={id}>
                <Upload
                  accept={accept}
                  showUploadList={false}
                  beforeUpload={handleMediaUpload}
                >
                  <Card hoverable className="text-center">
                    {icon}
                    <Text strong>{id.split("-")[0]}</Text>
                  </Card>
                </Upload>
              </Col>
            ))}
          </Row>
          {mediaFile && (
            <div className="p-3 border rounded mb-4">
              <Space>
                <PaperClipOutlined />
                <Text>
                  {mediaFile.name} ({Math.round(mediaFile.size / 1024)} KB)
                </Text>
                <Button type="link" danger onClick={() => setMediaFile(null)}>
                  Remove
                </Button>
              </Space>
            </div>
          )}
        </TabPane>
        <TabPane
          tab={
            <span
              className={`tab-label ${activeTab === "buttons" ? "active" : ""}`}
            >
              Buttons
            </span>
          }
          key="buttons"
        >
          <Row gutter={16} className="mb-4">
            {["url", "call", "quick_reply"].map((type) => (
              <Col span={8} key={type}>
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => addButton(type as ButtonData["type"])}
                  disabled={buttons.length >= 3}
                >
                  {type.replace("_", " ")}
                </Button>
              </Col>
            ))}
          </Row>
          {buttons.map((button) => (
            <div key={button.id} className="mb-4 p-3 border rounded">
              <Space className="w-full" direction="vertical">
                <Text strong>{button.type.replace("_", " ")} Button</Text>
                <Input
                  placeholder="Button label"
                  value={button.label}
                  onChange={(e) =>
                    updateButton(button.id, "label", e.target.value)
                  }
                />
                {button.type !== "quick_reply" && (
                  <Input
                    placeholder={
                      button.type === "url" ? "Website URL" : "Phone number"
                    }
                    value={button.value}
                    onChange={(e) =>
                      updateButton(button.id, "value", e.target.value)
                    }
                  />
                )}
                <Button
                  type="link"
                  danger
                  onClick={() => removeButton(button.id)}
                >
                  Remove
                </Button>
              </Space>
            </div>
          ))}
        </TabPane>
        <TabPane
          tab={
            <span
              className={`tab-label ${activeTab === "preview" ? "active" : ""}`}
            >
              Preview
            </span>
          }
          key="preview"
        >
          <Card>
            <Text strong>BJP Tamil Nadu</Text>
            {mediaFile?.type?.startsWith("image") && (
              <div>{mediaFile.caption || "[Image]"}</div>
            )}
            <div
              dangerouslySetInnerHTML={{
                __html: formData.content.replace(
                  "[voter_name]",
                  "<strong>Ramesh</strong>"
                ),
              }}
            />
            {buttons.map((button) => (
              <Button key={button.id} block className="mb-2">
                {button.label || `[${button.type}]`}
              </Button>
            ))}
          </Card>
        </TabPane>
      </Tabs>
      <Space className="mt-4">
        <Button onClick={prevStep} disabled={currentStep === 0}>
          Back
        </Button>
        <Button className="bg-[#1D4ED8] text-white" onClick={nextStep}>
          Next: Review
        </Button>
      </Space>
    </Card>
  );

  const FiltersStep = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">Recipient Filters</h2>
      <p className="text-gray-500 mb-6">
        Select filters to target specific recipients
      </p>

      {/* Location Section (extended with Parts/Sections) */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Location</h3>
          <Row gutter={12} className="my-3">
            <Col span={24}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Status
              </label>
              <Checkbox.Group
                options={[
                  { label: "Voted", value: "voted" },
                  { label: "Not Voted", value: "notVoted" },
                ]}
                value={formData.pollStatus || []}
                onChange={(val) => handleChange("pollStatus", val)}
              />
            </Col>
          </Row>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parts
            </label>
            <Select
              mode="multiple"
              placeholder="Select parts"
              className="w-full"
              loading={loadingFilters}
              options={(filterOptions?.parts || []).map((p) => ({
                value: p,
                label: String(p),
              }))}
              value={formData.parts}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, parts: vals, sections: [] }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sections
            </label>
            <Select
              mode="multiple"
              placeholder="Select sections"
              className="w-full"
              loading={loadingFilters}
              options={(formData.parts || []).flatMap((p) =>
                (filterOptions?.sectionsByPart?.[p] || []).map((s) => ({
                  value: s.id,
                  label: `${p}-${s.name}`,
                }))
              )}
              value={formData.sections}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, sections: vals }))
              }
              disabled={!formData.parts || formData.parts.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Demographic Section (extended) */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Demographics</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Religion
            </label>
            <Select
              mode="multiple"
              placeholder="Select religions"
              className="w-full"
              loading={loadingFilters}
              options={(filterOptions?.religions || []).map((r) => ({
                value: r.id,
                label: r.name,
              }))}
              value={formData.religionIds}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, religionIds: vals }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caste Categories
            </label>
            <Select
              mode="multiple"
              placeholder="Select caste categories"
              className="w-full"
              loading={loadingFilters}
              options={(filterOptions?.casteCategories || []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              value={formData.casteCategoryIds}
              onChange={(vals) =>
                setFormData((prev) => ({
                  ...prev,
                  casteCategoryIds: vals as string[],
                }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Castes
            </label>
            <Select
              mode="multiple"
              placeholder={
                formData.religionIds && formData.religionIds.length > 0
                  ? "Select castes"
                  : "Select religion first"
              }
              className="w-full"
              loading={loadingCastes}
              disabled={!formData.religionIds || formData.religionIds.length === 0}
              options={filteredCastes.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              value={formData.casteIds}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, casteIds: vals }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcastes
            </label>
            <Select
              mode="multiple"
              placeholder={
                formData.casteIds && formData.casteIds.length > 0
                  ? "Select subcastes"
                  : "Select caste first"
              }
              className="w-full"
              loading={loadingSubCastes}
              disabled={!formData.casteIds || formData.casteIds.length === 0}
              options={filteredSubCastes.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={formData.subCasteIds}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, subCasteIds: vals }))
              }
            />
          </div>
        </div>
      </div>

      {/* Affinity Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Affinity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Affiliation
            </label>
            <Select
              mode="multiple"
              placeholder="Select parties"
              className="w-full"
              loading={loadingFilters}
              options={(filterOptions?.parties || []).map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              value={formData.partyIds}
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, partyIds: vals }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voter Category
            </label>
            <Select
              mode="multiple"
              placeholder="Select voter category"
              className="w-full"
              loading={loadingFilters}
              options={(filterOptions?.availabilities || []).map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              value={formData.availabilityIds}
              onChange={(vals) =>
                setFormData((prev) => ({
                  ...prev,
                  availabilityIds: vals as string[],
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Estimate Count Display */}
      {estimateCount !== null && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Text strong className="text-blue-900">
                Estimated Recipients
              </Text>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {estimateCount.toLocaleString()}
              </div>
            </div>
            <Button 
              className="bg-[#1D4ED8] text-white"
              loading={loadingEstimate}
              onClick={onEstimate}
              size="small"
            >
              Refresh Estimate
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="flex justify-between mt-8">
        <Button icon={<LeftOutlined />} size="large" onClick={prevStep}>
          Back
        </Button>
        <Space>
          {estimateCount === null && (
            <Button
              className="bg-[#1D4ED8] text-white"
              size="large"
              loading={loadingEstimate}
              onClick={onEstimate}
            >
              Estimate recipients
            </Button>
          )}
          <Button
            className="bg-[#1D4ED8] text-white"
            size="large"
            onClick={nextStep}
          >
            Next: Compose
          </Button>
        </Space>
      </div>
    </div>
  );

  const ConfirmStep = () => (
    <Card>
      <Title level={4}>Review and Confirm</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Title">{formData.title}</Descriptions.Item>
        <Descriptions.Item label="Content">
          <div dangerouslySetInnerHTML={{ __html: formData.content }} />
        </Descriptions.Item>
        <Descriptions.Item label="Media">
          {mediaFile?.name || "None"}
        </Descriptions.Item>
        <Descriptions.Item label="Buttons">
          {buttons.length} added
        </Descriptions.Item>
        <Descriptions.Item label="Filters">
          {formData.age || "All ages"}
        </Descriptions.Item>
        <Descriptions.Item label="Estimated recipients">
          {estimateCount ?? "N/A"}
        </Descriptions.Item>
      </Descriptions>
      <Space className="mt-4">
        <Button icon={<LeftOutlined />} onClick={prevStep}>
          Back
        </Button>
        <Button
          className="bg-[#1D4ED8] text-white"
          loading={loadingCreate}
          onClick={() => onCreate(false)}
        >
          Create Draft
        </Button>
        <Button
          className="bg-[#1D4ED8] text-white"
          loading={loadingCreate}
          onClick={() => onCreate(true)}
        >
          Create & Send Now
        </Button>
      </Space>
    </Card>
  );

  const RightPanel = (
    <Card>
      <Title level={5}>Phone Preview</Title>
      <Card>
        <Text strong>WhatsApp</Text>
        <div
          dangerouslySetInnerHTML={{
            __html: formData.content.replace(
              "[voter_name]",
              "<strong>Ramesh</strong>"
            ),
          }}
        />
        {buttons.slice(0, 2).map((button) => (
          <Button key={button.id} block className="mt-2">
            {button.label || `[${button.type}]`}
          </Button>
        ))}
      </Card>
      <Descriptions column={1} size="small" className="mt-4">
        <Descriptions.Item label="Length">
          {formData.content.replace(/<[^>]*>/g, "").length}/1000
        </Descriptions.Item>
        <Descriptions.Item label="Media">
          {mediaFile
            ? `${mediaFile.name} (${Math.round(mediaFile.size / 1024)} KB)`
            : "None"}
        </Descriptions.Item>
        <Descriptions.Item label="Buttons">{buttons.length}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  return (
    <CampaignWizardLayout
      title="Create WhatsApp Campaign"
      subtitle="Compose, target your audience, and review before sending"
      steps={steps}
      currentStep={currentStep}
      onStepChange={(idx) => setCurrentStep(idx)}
      onBack={
        currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined
      }
      rightPanel={RightPanel}
      extraLeft={
        <Breadcrumb
          items={[
            {
              title: (
                <a onClick={() => navigate("/communication")}>
                  Campaign Manager
                </a>
              ),
            },
            {
              title: <a onClick={() => navigate("/create-message")}>Create</a>,
            },
            { title: "WhatsApp" },
          ]}
        />
      }
    >
      {currentStep === 0 && <FiltersStep />}
      {currentStep === 1 && <ComposeStep />}
      {currentStep === 2 && <ConfirmStep />}
    </CampaignWizardLayout>
  );
};

export default CreateWhatsappMessage;

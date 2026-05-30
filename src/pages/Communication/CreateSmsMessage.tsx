import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Input,
  Select,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Space,
  message,
  Tag,
  Checkbox,
} from "antd";
import CampaignWizardLayout from "../../components/communication/CampaignWizardLayout";
import { LeftOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";
import {
  getFilterOptions,
  listSmsSenders,
  estimateCampaign,
  createCampaign,
  sendCampaign,
  type FilterOptionsResponse,
  type SmsSender,
  type CampaignFilters,
} from "../../api/campaignApi";

const { Title, Text } = Typography;

interface FormData {
  title: string;
  content: string;
  senderId: string;
  language: string;
  age: string;
  gender: string;
  tags: string[];
  parts?: number[];
  pollStatus?: string[];
  sections?: string[];
  religionIds?: string[];
  casteIds?: string[];
  subCasteIds?: string[];
  casteCategoryIds?: string[];
  availabilityIds?: string[];
  partyIds?: string[];
}

const CreateSmsMessage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    title: "Election SMS Campaign",
    content: "Dear voter, remember to vote tomorrow!",
    senderId: "",
    language: "en",
    age: "",
    gender: "",
    tags: ["election", "reminder"],
    parts: [],
    pollStatus:[],
    sections: [],
    religionIds: [],
    casteIds: [],
    subCasteIds: [],
    casteCategoryIds: [],
    availabilityIds: [],
    partyIds: [],
  });

  const selectedElectionId = useSelector(
    (state: any) => state.election?.selectedElectionId
  );
  const accountId =
    Number(localStorage.getItem("accountId")) ||
    Number(localStorage.getItem("userId")) ||
    undefined;

  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [senders, setSenders] = useState<SmsSender[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [estimateCount, setEstimateCount] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [shouldAutoEstimate, setShouldAutoEstimate] = useState(false);

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
        const [filtersRes, smsSenders] = await Promise.all([
          getFilterOptions(
            selectedElectionId ? parseInt(selectedElectionId) : undefined,
            accountId
          ),
          listSmsSenders(),
        ]);
        setFilterOptions(filtersRes);
        setSenders(smsSenders || []);
        if (!formData.senderId && smsSenders && smsSenders.length > 0) {
          setFormData((prev) => ({ ...prev, senderId: smsSenders[0].id }));
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

  const steps = ["Audience", "Compose", "Review"];

  // SMS counters (GSM-7 approximate)
  const gsmLength = useMemo(() => formData.content.length, [formData.content]);
  const smsSegments = useMemo(() => {
    // 160 chars single, concatenated 153 per segment
    if (gsmLength <= 160) return 1;
    return Math.ceil(gsmLength / 153);
  }, [gsmLength]);

  const canProceedCompose = useMemo(() => {
    return Boolean(
      formData.title && formData.senderId && formData.content.trim()
    );
  }, [formData.title, formData.senderId, formData.content]);

  const handleChange = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
        channel: "sms",
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

  const onCreate = async (sendNow: boolean) => {
    if (loadingCreate) return; // Prevent duplicate submissions

    try {
      setLoadingCreate(true);
      const payload = {
        channel: "sms" as const,
        title: formData.title,
        senderId: formData.senderId,
        language: formData.language,
        contentHtml: formData.content,
        // buttons/media ignored by server for SMS
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
      navigate("/communication"); // Navigate to communication list
    } catch (e: any) {
      message.error(e?.message || "Failed to create campaign");
    } finally {
      setLoadingCreate(false);
    }
  };

  const ComposeStep = () => (
    <Card>
      <Title level={4}>Compose SMS</Title>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMS Sender
          </label>
          <Select
            placeholder="Select sender"
            className="w-full"
            loading={loadingFilters}
            options={(senders || []).map((s) => ({
              value: s.id,
              label: `${s.display} (${s.senderName})`,
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
        className="mb-3"
      />
      <Input.TextArea
        rows={6}
        placeholder="Type your SMS content..."
        value={formData.content}
        onChange={(e) => handleChange("content", e.target.value)}
      />
      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
        <span>{gsmLength} characters</span>
        <span>
          {smsSegments} SMS segment{smsSegments > 1 ? "s" : ""}
        </span>
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <Space wrap>
          {formData.tags.map((t) => (
            <Tag
              key={t}
              closable
              onClose={() =>
                handleChange(
                  "tags",
                  formData.tags.filter((x) => x !== t)
                )
              }
            >
              {t}
            </Tag>
          ))}
        </Space>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button
            onClick={() => {
              const tag = newTag.trim();
              if (!tag) return;
              if ((formData.tags || []).includes(tag)) return;
              handleChange("tags", [...(formData.tags || []), tag]);
              setNewTag("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  );

  const FiltersStep = () => (
    <Card>
      <Title level={4}>Recipient Filters</Title>
      <Row gutter={12} className="mt-3">
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
      <Row gutter={12} className="mt-3">
        <Col span={12}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parts
          </label>
          <Select
            mode="multiple"
            className="w-full"
            loading={loadingFilters}
            options={(filterOptions?.parts || []).map((p) => ({
              value: p,
              label: String(p),
            }))}
            value={formData.parts}
            onChange={(val) => handleChange("parts", val)}
          />
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sections
          </label>
          <Select
            mode="multiple"
            className="w-full"
            loading={loadingFilters}
            options={
              formData.parts && formData.parts.length
                ? formData.parts.flatMap((part) =>
                    (filterOptions?.sectionsByPart?.[Number(part)] || []).map(
                      (s) => ({ value: s.id, label: s.name })
                    )
                  )
                : []
            }
            value={formData.sections}
            onChange={(val) => handleChange("sections", val)}
          />
        </Col>
      </Row>
      <Row gutter={12} className="mt-3">
        <Col span={8}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age Range
          </label>
          <Select
            className="w-full"
            allowClear
            options={(filterOptions?.ageRanges || []).map((r) => ({
              value: r.id,
              label: r.name,
            }))}
            value={formData.age || undefined}
            onChange={(val) => handleChange("age", val)}
          />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <Select
            className="w-full"
            allowClear
            options={(filterOptions?.genders || []).map((g) => ({
              value: g,
              label: g,
            }))}
            value={formData.gender || undefined}
            onChange={(val) => handleChange("gender", val)}
          />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <Select
            mode="multiple"
            className="w-full"
            allowClear
            options={(filterOptions?.tags || []).map((t) => ({
              value: t,
              label: t,
            }))}
            value={formData.tags}
            onChange={(val) => handleChange("tags", val)}
          />
        </Col>
      </Row>
      {estimateCount !== null && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              onClick={onEstimate} 
              loading={loadingEstimate} 
              type="default"
              size="small"
            >
              Refresh Estimate
            </Button>
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <Button onClick={() => setCurrentStep(0)}>Back</Button>
        <div className="flex items-center gap-3">
          {estimateCount === null && (
            <Button onClick={onEstimate} loading={loadingEstimate} type="default">
              Estimate recipients
            </Button>
          )}
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            Next: Compose
          </Button>
        </div>
      </div>
    </Card>
  );
  const ConfirmStep = () => (
    <Card>
      <Title level={4}>Review & Confirm</Title>
      <Row gutter={16}>
        <Col span={12}>
          <div className="mb-3">
            <Text type="secondary">Sender:</Text>
            <div className="font-medium">{formData.senderId || "-"}</div>
          </div>
          <div className="mb-3">
            <Text type="secondary">Language:</Text>
            <div className="font-medium">{formData.language || "-"}</div>
          </div>
          <div className="mb-3">
            <Text type="secondary">Title:</Text>
            <div className="font-medium">{formData.title || "-"}</div>
          </div>
        </Col>
        <Col span={12}>
          <div className="mb-3">
            <Text type="secondary">Estimated recipients:</Text>
            <div className="font-medium">
              {estimateCount ?? "(Run estimate)"}
            </div>
          </div>
          <div className="mb-3">
            <Text type="secondary">Tags:</Text>
            <div className="font-medium">
              {(formData.tags || []).join(", ") || "-"}
            </div>
          </div>
        </Col>
      </Row>
      <div className="mb-4">
        <Text type="secondary">Content:</Text>
        <div className="font-medium whitespace-pre-wrap mt-1">
          {formData.content || "-"}
        </div>
      </div>
      <Space>
        <Button onClick={() => setCurrentStep(1)}>Back</Button>
        <Button
          type="default"
          loading={loadingCreate}
          onClick={() => onCreate(false)}
        >
          Create Campaign
        </Button>
        <Button
          type="primary"
          loading={loadingCreate}
          onClick={() => onCreate(true)}
          disabled
        >
          Create & Send Now (Coming Soon)
        </Button>
      </Space>
    </Card>
  );

  const RightPanel = (
    <Card>
      <Title level={5}>Phone Preview</Title>
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">
          {formData.senderId || "Sender"}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {formData.content || "Your SMS preview will appear here."}
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <div>Characters: {gsmLength}</div>
        <div>Segments: {smsSegments}</div>
        <div>Estimated recipients: {estimateCount ?? "-"}</div>
      </div>
    </Card>
  );

  return (
    <CampaignWizardLayout
      title="Create SMS Campaign"
      subtitle="Compose your message, choose your audience, and review before sending"
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
            { title: "SMS" },
          ]}
        />
      }
    >
      {currentStep === 0 && (
        <>
          <FiltersStep />
        </>
      )}
      {currentStep === 1 && (
        <>
          <ComposeStep />
          <div className="mt-4 flex justify-between">
            <Button onClick={() => setCurrentStep(0)}>Back: Audience</Button>
            <Button
              type="primary"
              disabled={!canProceedCompose}
              onClick={() => setCurrentStep(2)}
            >
              Next: Review
            </Button>
          </div>
        </>
      )}
      {currentStep === 2 && <ConfirmStep />}
    </CampaignWizardLayout>
  );
};

export default CreateSmsMessage;

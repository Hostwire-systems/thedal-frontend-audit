import React, { useState } from "react";
import {
  Input,
  Button,
  Steps,
  Typography,
  Card,
  Upload,
  Tag,
  Divider,
  Row,
  Col,
  Select,
  Checkbox,
} from "antd";
import {
  UploadOutlined,
  LeftOutlined,
  PlusOutlined,
  CheckOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

const CreateRCSMessage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [variableTags, setVariableTags] = useState([
    "voter_name",
    "ec_office_address",
    "rolling_booth",
  ]);
  const [newTag, setNewTag] = useState("");

  const [formData, setFormData] = useState({
    messageTitle: "Voter ID Card Notification",
    rcsTemplate: "Election Card Reminder",
    senderName: "EC Tamil Nadu",
    messageContent:
      "Dear voter, Please ensure you have your Voter ID card ready for the upcoming election on 19-Mar-2025. If you have not received your card or need a replacement, please visit our nearest office at office address before 15-Mar-2025.",
    language: "",
    pollStatus: [] as string[],
    pollingStation: "",
    age: "",
    gender: "",
    voterCategory: "",
    customList: "",
  });

  const steps = [
    { title: "Compose", description: "Compose your message" },
    { title: "Filters", description: "Recipient filters" },
    { title: "Confirm", description: "Review and confirm" },
    { title: "Send", description: "Send message" },
  ];

  const handleChange = (key:string, value:any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addVariableTag = () => {
    if (newTag && !variableTags.includes(newTag)) {
      setVariableTags([...variableTags, newTag]);
      setNewTag("");
    }
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  return (
    <div className="w-full mx-auto p-6">
      <Title level={2} className="mb-1">
        Create RCS Message
      </Title>
      <Text type="secondary" className="mb-6">
        Step {currentStep + 1}: {steps[currentStep].description}
      </Text>

      <div className="flex justify-between mb-12 relative">
        <div
          className="absolute top-6 left-0 right-0 h-1 bg-gray-200"
          style={{ zIndex: 0 }}
        ></div>
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            style={{ zIndex: 1 }}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                index === currentStep
                  ? "bg-blue-500 text-white"
                  : index < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {index < currentStep ? <CheckOutlined /> : index + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                index === currentStep ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="w-4/5 pr-6">
          {currentStep === 0 && (
            <Card className="mb-6">
              <Title level={4} className="mb-6">
                Message Details
              </Title>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Title
                </label>
                <Input
                  value={formData.messageTitle}
                  onChange={(e) => handleChange("messageTitle", e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RCS Template
                </label>
                <Input
                  value={formData.rcsTemplate}
                  onChange={(e) => handleChange("rcsTemplate", e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sender Name
                </label>
                <Input
                  value={formData.senderName}
                  onChange={(e) => handleChange("senderName", e.target.value)}
                  addonAfter={
                    <Upload>
                      <Button icon={<UploadOutlined />}>Upload Logo</Button>
                    </Upload>
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content
                </label>
                <TextArea
                  rows={6}
                  value={formData.messageContent}
                  onChange={(e) =>
                    handleChange("messageContent", e.target.value)
                  }
                />
                <div className="text-right mt-1 text-gray-500">
                  {formData.messageContent.length}/1000 characters
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rich Card Elements
                </label>
                <div className="flex space-x-2">
                  <Button icon={<PlusOutlined />}>Add Image</Button>
                  <Button icon={<PlusOutlined />}>Add Buttons</Button>
                  <Button icon={<PlusOutlined />}>Add Carousel</Button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variable Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {variableTags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => {
                        setVariableTags(variableTags.filter((t) => t !== tag));
                      }}
                    >
                      {tag.startsWith("(") || tag.startsWith("{")
                        ? tag
                        : `{${tag}}`}
                    </Tag>
                  ))}
                </div>
                <div className="flex">
                  <Input
                    placeholder="Add variable tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onPressEnter={addVariableTag}
                  />
                  <Button
                    type="primary"
                    onClick={addVariableTag}
                    className="ml-2"
                  >
                    + Add more
                  </Button>
                </div>
              </div>

              <Divider />

              <div className="flex justify-end">
                <Button type="primary" onClick={nextStep}>
                  Next: Filters
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <Title level={4} className="mb-2">
                Recipient Filters
              </Title>
              <Text type="secondary" className="mb-6">
                Select filters to target specific recipients
              </Text>

              <div className="mb-6">
                <Title level={5} className="mb-3">
                  Location
                </Title>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poll Status
                  </label>
                  <Checkbox.Group
                    options={[
                      { label: "Voted", value: "voted" },
                      { label: "Not Voted", value: "notVoted" },
                    ]}
                    value={formData.pollStatus || []}
                    onChange={(val) => handleChange("pollStatus", val as string[])}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Polling Station
                  </label>
                  <Select
                    placeholder="Select polling station"
                    className="w-full"
                    options={[
                      { value: "ps1", label: "Polling Station 1" },
                      { value: "ps2", label: "Polling Station 2" },
                      { value: "ps3", label: "Polling Station 3" },
                    ]}
                    value={formData.pollingStation}
                    onChange={(val) => handleChange("pollingStation", val)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <Title level={5} className="mb-3">
                  Demographics
                </Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Range
                    </label>
                    <Select
                      placeholder="Select age range"
                      className="w-full"
                      options={[
                        { value: "18-25", label: "18-25 years" },
                        { value: "26-35", label: "26-35 years" },
                        { value: "36-50", label: "36-50 years" },
                        { value: "51+", label: "51+ years" },
                      ]}
                      value={formData.age}
                      onChange={(val) => handleChange("age", val)}
                    />
                  </Col>
                  <Col span={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <Select
                      placeholder="Select gender"
                      className="w-full"
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      value={formData.gender}
                      onChange={(val) => handleChange("gender", val)}
                    />
                  </Col>
                </Row>
              </div>

              <div className="mb-6">
                <Title level={5} className="mb-3">
                  Additional Filters
                </Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voter Category
                    </label>
                    <Select
                      placeholder="Select voter category"
                      className="w-full"
                      options={[
                        { value: "new", label: "New Voters" },
                        { value: "regular", label: "Regular Voters" },
                        { value: "irregular", label: "Irregular Voters" },
                      ]}
                      value={formData.voterCategory}
                      onChange={(val) => handleChange("voterCategory", val)}
                    />
                  </Col>
                  <Col span={12}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom List
                    </label>
                    <Select
                      placeholder="Select custom list"
                      className="w-full"
                      options={[
                        { value: "list1", label: "Priority Contacts" },
                        { value: "list2", label: "Event Attendees" },
                        { value: "list3", label: "Campaign Supporters" },
                      ]}
                      value={formData.customList}
                      onChange={(val) => handleChange("customList", val)}
                    />
                  </Col>
                </Row>
              </div>

              <Divider />

              <div className="flex justify-between">
                <Button onClick={prevStep} icon={<LeftOutlined />}>
                  Back to Compose
                </Button>
                <Button type="primary" onClick={nextStep}>
                  Next: Confirm
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <Title level={4} className="mb-6">
                Review and Confirm
              </Title>
              <Text type="secondary" className="mb-6">
                Please review all details before sending
              </Text>

              <div className="mb-8">
                <Title level={5} className="mb-4">
                  Message Details
                </Title>
                <Row gutter={16} className="mb-4">
                  <Col span={8}>
                    <Text type="secondary">Title:</Text>
                    <div className="font-medium">
                      {formData.messageTitle || "-"}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Sender Name:</Text>
                    <div className="font-medium">
                      {formData.senderName || "-"}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Language:</Text>
                    <div className="font-medium">
                      {formData.language || "-"}
                    </div>
                  </Col>
                </Row>
                <div>
                  <Text type="secondary">Content:</Text>
                  <div className="font-medium whitespace-pre-line">
                    {formData.messageContent || "-"}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <Title level={5} className="mb-4">
                  Recipient Details
                </Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Polling Station:</Text>
                    <div className="font-medium">
                      {formData.pollingStation || "-"}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Demographics:</Text>
                    <div className="font-medium">
                      {formData.age || "All ages"},{" "}
                      {formData.gender || "All genders"},{" "}
                      {formData.voterCategory || "All categories"}
                    </div>
                  </Col>
                </Row>
                <Row gutter={16} className="mt-4">
                  <Col span={8}>
                    <Text type="secondary">Custom List:</Text>
                    <div className="font-medium">
                      {formData.customList || "None"}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Total Recipients:</Text>
                    <div className="font-medium">4,280 voters</div>
                  </Col>
                </Row>
              </div>

              <div className="mb-8">
                <Title level={5} className="mb-4">
                  Send Schedule
                </Title>
                <div className="flex items-center">
                  <div className="font-medium mr-4">
                    Immediately after confirmation
                  </div>
                  <Button type="link" className="p-0">
                    Change Schedule
                  </Button>
                </div>
              </div>

              <Divider />

              <div className="flex justify-between">
                <Button onClick={prevStep} icon={<LeftOutlined />}>
                  Back
                </Button>
                <Button type="primary" onClick={nextStep}>
                  Send Message
                </Button>
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="text-center py-8">
              <Title level={4} className="mb-2">
                Message Sent Successfully!
              </Title>
              <Text type="secondary">
                Your RCS message has been delivered to recipients.
              </Text>
            </Card>
          )}
        </div>

        <div className="w-1/5">
          <Card title="Message Preview" className="sticky top-4">
            <div className="p-4 border rounded">
              <div className="font-semibold mb-2">{formData.senderName}</div>
              <div className="text-gray-600 whitespace-pre-wrap">
                {formData.messageContent}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRCSMessage;

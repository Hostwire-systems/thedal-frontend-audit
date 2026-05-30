import React, { useState } from "react";
import { Input, Select, Button, Tag, Divider } from "antd";
import { CheckOutlined, LeftOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const RCSSMSCreator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tags, setTags] = useState(["Promotion", "Newsletter"]);
  const [inputTag, setInputTag] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    senderId: "",
    language: "",
    pollingStation: "",
    age: "",
    gender: "",
    voterCategory: "",
    customList: "",
  });

  const steps = [
    { title: "Compose", icon: "📝" },
    { title: "Filters", icon: "👥" },
    { title: "Confirm", icon: "✓" },
    { title: "Send", icon: "📤" },
  ];

  const handleChange = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag("");
    }
  };

  const handleRemoveTag = (removedTag) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    setTags(newTags);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full mx-auto p-6">
      <h1 className="text-3xl font-bold mb-1">Create Bulk SMS</h1>
      <p className="text-gray-500 mb-6">
        Step {currentStep + 1}:{" "}
        {currentStep === 0 ? "Compose your message" : "Recipent filters"}
      </p>
      <div className="flex justify-between mb-12 relative">
        {/* Connection Line */}
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6">Message Details</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Title
                </label>
                <Input
                  placeholder="Message Title"
                  className="mb-4"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />{" "}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Content
                </label>
                <TextArea
                  rows={6}
                  placeholder="Type your message content here..."
                  className="w-full"
                  value={formData.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap mb-2">
                  {tags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => handleRemoveTag(tag)}
                      className="mr-2 mb-2"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
                <div className="flex">
                  <Input
                    placeholder="Add tag"
                    value={inputTag}
                    onChange={(e) => setInputTag(e.target.value)}
                    onPressEnter={handleAddTag}
                    className="w-full"
                  />
                  <Button
                    type="primary"
                    onClick={handleAddTag}
                    className="ml-2"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender ID
                  </label>
                  <Input
                    placeholder="Sender ID"
                    value={formData.senderId}
                    onChange={(e) => handleChange("senderId", e.target.value)}
                  />{" "}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <Select
                    placeholder="Select language"
                    className="w-full"
                    options={[
                      { value: "en", label: "English" },
                      { value: "es", label: "Spanish" },
                      { value: "fr", label: "French" },
                      { value: "de", label: "German" },
                    ]}
                    value={formData.language}
                    onChange={(val) => handleChange("language", val)}
                  />
                </div>
              </div>

              <Divider className="my-6" />

              <div className="flex justify-end">
                <Button type="primary" size="large" onClick={nextStep}>
                  Next: Filters
                </Button>
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">Recipient Filters</h2>
              <p className="text-gray-500 mb-6">
                Select filters to target specific recipients
              </p>

              {/* Location Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Location</h3>
                <div>
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

              {/* Demographics Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Demographics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  </div>
                  <div>
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
                  </div>
                </div>
              </div>

              {/* Additional Filters Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Additional Filters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  </div>
                  <div>
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
                  </div>
                </div>
              </div>

              <Divider className="my-6" />

              <div className="flex justify-between">
                <Button size="large" onClick={prevStep} icon={<LeftOutlined />}>
                  Back to Compose
                </Button>
                <Button type="primary" size="large" onClick={nextStep}>
                  Next: Confirm
                </Button>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6">Review and Confirm</h2>
              <p className="text-gray-500 mb-6">
                Please review all details before sending
              </p>

              {/* Message Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Message Details</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Title:</p>
                    <p className="font-medium">{formData.title || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sender ID:</p>
                    <p className="font-medium">{formData.senderId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Language:</p>
                    <p className="font-medium">{formData.language || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Content:</p>
                  <p className="font-medium whitespace-pre-line">
                    {formData.content || "-"}
                  </p>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Recipient Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Polling Station:</p>
                    <p className="font-medium">
                      {formData.pollingStation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Demographics:</p>
                    <p className="font-medium">
                      {formData.age || "All ages"},{" "}
                      {formData.gender || "All genders"},{" "}
                      {formData.voterCategory || "All categories"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Custom List:</p>
                  <p className="font-medium">{formData.customList || "None"}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Total Recipients:</p>
                  <p className="font-medium">4,280 voters</p>{" "}
                  {/* Replace with dynamic count if needed */}
                </div>
              </div>

              {/* Send Schedule */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Send Schedule</h3>
                <div className="flex items-center">
                  <p className="font-medium mr-4">
                    Immediately after confirmation
                  </p>
                  <Button type="link" className="p-0">
                    Change Schedule
                  </Button>
                </div>
              </div>
              <Divider className="my-6" />

              <div className="flex justify-between">
                <Button size="large" onClick={prevStep} icon={<LeftOutlined />}>
                  Back
                </Button>
                <Button type="primary" size="large" onClick={nextStep}>
                  Send SMS
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="w-1/5">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full"></div>
        </div>
      </div>
    </div>
  );
};

export default RCSSMSCreator;

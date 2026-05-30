import React, { useState } from "react";
import { Input, Select, Button, Tag, Divider, Radio, Checkbox, Tabs, Upload, message, UploadFile } from "antd";
import { CheckOutlined, LeftOutlined, UploadOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const CreateVoiceMessage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [variableTags, setVariableTags] = useState([
    "voice_name",
    "booth_name",
    "booth_address",
  ]);
  const [inputTag, setInputTag] = useState("");
const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [formData, setFormData] = useState({
    title: "Election Day Reminder",
    messageType: "text-to-speech",
    voiceScript:
      "Hello {voice_name}, this is a reminder that Election Day is on March 19th, 2025. Your polling booth is located at {booth_name}, {booth_address}. Polling hours are from 7 AM to 9 PM. Please carry your voter ID card. Thank you.",
    voiceType: "female-tamil",
    voiceSpeed: "normal",
    retryAttempts: 2,
    allowRepeat: true,
    pollStatus: [] as string[],
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

  const handleUploadChange=(info:any)=>{
    let fileList=[...info.fileList];
    fileList.slice(-1);
    const isAudio=fileList[0]?.type?.includes('audio/');
     if (!isAudio && fileList.length > 0) {
       message.error("You can only upload audio files!");
       return;
     }
     setFileList(fileList);
  }

  const handleChange = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleAddTag = () => {
    if (inputTag && !variableTags.includes(inputTag)) {
      setVariableTags([...variableTags, inputTag]);
      setInputTag("");
    }
  };

  const handleRemoveTag = (removedTag) => {
    const newTags = variableTags.filter((tag) => tag !== removedTag);
    setVariableTags(newTags);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full mx-auto p-6">
      <h1 className="text-3xl font-bold mb-1">Create Voice Message</h1>
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
                  ? "bg-[#f9980e] text-white"
                  : index < currentStep
                  ? "bg-[#f9980e] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {index < currentStep ? <CheckOutlined /> : index + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                index === currentStep ? "text-[#f9980e]" : "text-gray-500"
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
                  Voice Message Type
                </label>
                <Tabs
                  activeKey={formData.messageType}
                  onChange={(key) => handleChange("messageType", key)}
                  className="custom-tabs-orange"
                  tabBarStyle={{ fontSize: "16px" }}
                >
                  <Tabs.TabPane tab="Text-to-Speech" key="text-to-speech">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voice Script
                      </label>
                      <TextArea
                        rows={6}
                        placeholder="Type your voice script here..."
                        className="w-full"
                        value={formData.voiceScript}
                        onChange={(e) =>
                          handleChange("voiceScript", e.target.value)
                        }
                      />
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Upload Audio File" key="upload-audio">
                    <Upload
                      accept="audio/*"
                      fileList={fileList}
                      onChange={handleUploadChange}
                      beforeUpload={() => false} // Prevent automatic upload
                      className="mt-4"
                    >
                      <Button icon={<UploadOutlined />}>
                        Select Audio File
                      </Button>
                      <p className="text-gray-500 text-sm mt-2">
                        Supported formats: MP3, WAV, OGG (Max 10MB)
                      </p>
                    </Upload>
                  </Tabs.TabPane>
                </Tabs>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-3">Voice Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voice Type
                    </label>
                    <Select
                      placeholder="Select voice type"
                      className="w-full"
                      options={[
                        { value: "female-tamil", label: "Female (Tamil)" },
                        { value: "male-tamil", label: "Male (Tamil)" },
                        { value: "female-english", label: "Female (English)" },
                        { value: "male-english", label: "Male (English)" },
                      ]}
                      value={formData.voiceType}
                      onChange={(val) => handleChange("voiceType", val)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voice Speed
                    </label>
                    <Select
                      placeholder="Select voice speed"
                      className="w-full"
                      options={[
                        { value: "slow", label: "Slow" },
                        { value: "normal", label: "Normal" },
                        { value: "fast", label: "Fast" },
                      ]}
                      value={formData.voiceSpeed}
                      onChange={(val) => handleChange("voiceSpeed", val)}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Call Options</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry attempts if no answer:
                  </label>
                  <Select
                    className="w-full"
                    value={formData.retryAttempts}
                    onChange={(val) => handleChange("retryAttempts", val)}
                    options={[
                      { value: 0, label: "No retry" },
                      { value: 1, label: "1 time" },
                      { value: 2, label: "2 times" },
                      { value: 3, label: "3 times" },
                    ]}
                  />
                </div>
                <Checkbox
                  checked={formData.allowRepeat}
                  onChange={(e) =>
                    handleChange("allowRepeat", e.target.checked)
                  }
                >
                  Allow recipients to press 1 to repeat message
                </Checkbox>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable Tags
                </label>
                <div className="flex flex-wrap mb-2">
                  {variableTags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => handleRemoveTag(tag)}
                      className="px-3 py-1 border border-[#f9980e] text-[#f9980e] bg-white rounded-full text-sm cursor-pointer hover:bg-[#fff4e6]"
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
                  <Tag
                    onClick={handleAddTag}
                    className="ml-2 px-3 py-1 border bg-white rounded-full text-sm cursor-pointer"
                  >
                    + Add more
                  </Tag>
                </div>
              </div>

              <Divider className="my-6" />

              <div className="flex justify-end">
                <Button
                  className="text-white bg-[#f9980e]"
                  size="large"
                  onClick={nextStep}
                >
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
                <Button
                  className="text-white bg-[#f9980e]"
                  size="large"
                  onClick={nextStep}
                >
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Title:</p>
                    <p className="font-medium">{formData.title || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Message Type:</p>
                    <p className="font-medium">
                      {formData.messageType === "text-to-speech"
                        ? "Text-to-Speech"
                        : "Upload Audio File"}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Voice Settings:</p>
                  <p className="font-medium">
                    {formData.voiceType === "female-tamil"
                      ? "Female (Tamil)"
                      : formData.voiceType === "male-tamil"
                      ? "Male (Tamil)"
                      : formData.voiceType === "female-english"
                      ? "Female (English)"
                      : "Male (English)"}{" "}
                    - {formData.voiceSpeed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Voice Script:</p>
                  <p className="font-medium whitespace-pre-line">
                    {formData.voiceScript || "-"}
                  </p>
                </div>
              </div>

              {/* Call Options */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Call Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Retry Attempts:</p>
                    <p className="font-medium">
                      {formData.retryAttempts || "0"} times
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Repeat Option:</p>
                    <p className="font-medium">
                      {formData.allowRepeat ? "Enabled" : "Disabled"}
                    </p>
                  </div>
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
                <Button
                  className="text-white bg-[#f9980e]"
                  size="large"
                  onClick={nextStep}
                >
                  Send Voice Message
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="w-1/5">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-4">Message Preview</h3>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-[#f9980e] flex items-center justify-center text-white mr-2">
                  EC
                </div>
                <div>
                  <p className="font-medium">Election Commission</p>
                  <p className="text-xs text-gray-500">
                    Incoming voice message
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p>
                  Hello Facebook Source, this is a reminder that Election Day is
                  on March 19th, 2025...
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">doi:10 /102.90</p>
            </div>

            <Divider className="my-4" />

            <h3 className="font-medium mb-2">Voice Message Tips:</h3>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>- Keep messages under 30 seconds</li>
              <li>- State your name at the beginning</li>
              <li>- Speak clearly and at normal pace</li>
              <li>- Include call-to-action at the end</li>
              <li>- Test call before sending in bulk</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVoiceMessage;

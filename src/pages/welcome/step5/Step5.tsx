import React, { useState } from "react";
import { Button, Col, Form, Row, Typography, Select, Input, message } from "antd";
import SmsIcon from "../../../assets/icons/sms.svg";
import ChatIcon from "../../../assets/icons/chat.svg";
import WhatsappIcon from "../../../assets/icons/whatsapp.svg";
import PhoneIcon from "../../../assets/icons/phone.svg";
import SubmitButton from "../SubmitButton";
import { verifyLicenseKeyApi } from "../../../api/profileSettingsApi";

const { Title } = Typography;
const { Option } = Select;

interface Step4Props {
  onFinish: (values: any, isSkipped?: boolean) => void;
  isUpdating: boolean;
}

const Step4: React.FC<Step4Props> = ({ onFinish, isUpdating }) => {
  const [isVerifying, setIsVerifying] = useState({
    sms: false,
    rcs: false,
    whatsapp: false,
    voiceCall: false,
  });
  const [selectedProviders, setSelectedProviders] = useState({
    sms: "TWILIO",
    rcs: "TWILIO",
    whatsapp: "TWILIO",
    voiceCall: "TWILIO",
  });
  const [form] = Form.useForm(); // Initialize form instance to access form values

  const handleLicenseKeyVerification = async (
    serviceType: 'sms' | 'rcs' | 'whatsapp' | 'voiceCall',
    smsMessagingService: string,
    licenseKey: string
  ) => {
    if (!licenseKey) {
      message.error("Please enter a license key to verify");
      return;
    }

    setIsVerifying((prev) => ({ ...prev, [serviceType]: true }));
    try {
      await verifyLicenseKeyApi(
        {
          smsMessagingService,
          smsLicenseKey: licenseKey,
        },
        setIsVerifying
      );
      message.success("Verification Success");
    } catch (error) {
      console.error("Verification failed:", error);
      message.error("Verification failed");
    } finally {
      setIsVerifying((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  const handleFinish = (values: any) => {
    onFinish(values, false);
  };

  const handleProviderChange = (
    serviceType: "sms" | "rcs" | "whatsapp" | "voiceCall",
    provider: string,
    providerField: "smsProvider" | "rcsProvider" | "whatsappProvider" | "voiceCallProvider"
  ) => {
    setSelectedProviders((prev) => ({ ...prev, [serviceType]: provider }));
    form.setFieldsValue({ [providerField]: provider });
  };

  const handleSkip = () => {
    onFinish({}, true);
  };

  return (
    <>
      <Form
        form={form}
        name="profile_form"
        layout="vertical"
        initialValues={{
          remember: true,
          smsProvider: "TWILIO",
          rcsProvider: "TWILIO",
          whatsappProvider: "TWILIO",
          voiceCallProvider: "TWILIO",
        }}
        onFinish={handleFinish}
      >
        <Title className="font-bold text-[31px] text-[#424242]" level={2}>
          Step 4: Campaign Settings
        </Title>
        <p className="text-[#6B7280] mt-1 mb-3 text-[14px]">
          You can skip this now and configure provider/API key anytime from Campaign Manager.
        </p>

        {/* SMS Service - SMSGatewayHub */}
        <Row gutter={[16, 16]} className="mt-3">
          <Title
            className="flex items-center gap-3 text-[#1F29337] font-medium text-[15px] leading-4"
            level={5}
          >
            <img src={SmsIcon} alt="sms" className="w-10 h-10" />
            Choose service for SMS
          </Title>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="smsProvider">
                  <Select
                    defaultValue="TWILIO"
                    placeholder="Select Provider"
                    className="h-[48px] border-[#E5E7EB] text-[#1F2937] text-[14px] font-medium leading-5"
                    onChange={(value) => handleProviderChange("sms", value, "smsProvider")}
                  >
                    <Option value="TWILIO">SMSGATEWAYHUB</Option>
                    <Option value="SUPPORT">SUPPORT</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="smsApiKey"
                >
                  <Input
                    placeholder="Enter license key"
                    type="text"
                    className="input-element w-[78%] no-border-radius"
                    onChange={(e) =>
                      form.setFieldsValue({ smsApiKey: e.target.value })
                    }
                  />
                  <Button
                    onClick={() => {
                      if (selectedProviders.sms === "SUPPORT") {
                        message.info("Please contact support to enable SMS provider integration for your account.");
                        return;
                      }
                      const licenseKey = form.getFieldValue("smsApiKey");
                      handleLicenseKeyVerification("sms", selectedProviders.sms, licenseKey);
                    }}
                    type="default"
                    loading={isVerifying.sms}
                    style={{
                      borderTopRightRadius: "8px",
                      borderTopLeftRadius: "0px",
                      borderBottomRightRadius: "8px",
                      borderBottomLeftRadius: "0px",
                    }}
                    className="verify-btn py-4 px-3 w-[22%] h-[46px] border rounded-r-full text-[15px] font-medium leading-4 border-[#2563EB] bg-[#2563EB] text-white"
                  >
                    Verify
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* RCS Service - Twilio */}
        <Row gutter={[16, 16]}>
          <Title
            className="flex items-center gap-3 text-[#1F2937] font-medium text-[15px] leading-4"
            level={5}
          >
            <img src={ChatIcon} alt="rcs" className="w-10 h-10" />
            Choose service for RCS
          </Title>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="rcsProvider">
                  <Select
                    defaultValue="TWILIO"
                    placeholder="Select Provider"
                    className="h-[48px] border-[#E5E7EB] text-[#1F2937] text-[14px] font-medium leading-5"
                    onChange={(value) => handleProviderChange("rcs", value, "rcsProvider")}
                  >
                    <Option value="TWILIO">TWILIO</Option>
                    <Option value="SUPPORT">SUPPORT</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="rcsApiKey"
                >
                  <Input
                    placeholder="Enter license key"
                    type="text"
                    className="input-element w-[78%] no-border-radius"
                    onChange={(e) =>
                      form.setFieldsValue({ rcsApiKey: e.target.value })
                    }
                  />
                  <Button
                    onClick={() => {
                      if (selectedProviders.rcs === "SUPPORT") {
                        message.info("Please contact support to enable RCS provider integration for your account.");
                        return;
                      }
                      const licenseKey = form.getFieldValue("rcsApiKey");
                      handleLicenseKeyVerification("rcs", selectedProviders.rcs, licenseKey);
                    }}
                    type="default"
                    loading={isVerifying.rcs}
                    style={{
                      borderTopRightRadius: "8px",
                      borderTopLeftRadius: "0px",
                      borderBottomRightRadius: "8px",
                      borderBottomLeftRadius: "0px",
                    }}
                    className="verify-btn px-3 py-4 w-[22%] h-[46px] border rounded-r-full text-[15px] font-medium leading-4 border-[#2563EB] bg-[#2563EB] text-white"
                  >
                    Verify
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* WhatsApp Service - Twilio */}
        <Row gutter={[16, 16]}>
          <Title
            className="flex items-center gap-3 text-[#1F2937] font-medium text-[15px] leading-4"
            level={5}
          >
            <img src={WhatsappIcon} alt="whatsapp" className="w-10 h-10" />
            Choose service for WhatsApp
          </Title>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="whatsappProvider">
                  <Select
                    defaultValue="TWILIO"
                    placeholder="Select Provider"
                    className="h-[48px] border-[#E5E7EB] text-[#1F2937] text-[14px] font-medium leading-5"
                    onChange={(value) => handleProviderChange("whatsapp", value, "whatsappProvider")}
                  >
                    <Option value="TWILIO">TWILIO</Option>
                    <Option value="SUPPORT">SUPPORT</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="whatsappApiKey"
                >
                  <Input
                    placeholder="Enter license key"
                    type="text"
                    className="input-element w-[78%] no-border-radius"
                    onChange={(e) =>
                      form.setFieldsValue({ whatsappApiKey: e.target.value })
                    }
                  />
                  <Button
                    onClick={() => {
                      if (selectedProviders.whatsapp === "SUPPORT") {
                        message.info("Please contact support to enable WhatsApp provider integration for your account.");
                        return;
                      }
                      const licenseKey = form.getFieldValue("whatsappApiKey");
                      handleLicenseKeyVerification(
                        "whatsapp",
                        selectedProviders.whatsapp,
                        licenseKey
                      );
                    }}
                    type="default"
                    loading={isVerifying.whatsapp}
                    style={{
                      borderTopRightRadius: "8px",
                      borderTopLeftRadius: "0px",
                      borderBottomRightRadius: "8px",
                      borderBottomLeftRadius: "0px",
                    }}
                    className="verify-btn py-4 px-3 w-[22%] h-[46px] border rounded-r-full text-[15px] font-medium leading-4 border-[#2563EB] bg-[#2563EB] text-white"
                  >
                    Verify
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Voice Call Service - Twilio */}
        <Row gutter={[16, 16]}>
          <Title
            className="flex items-center gap-3 text-[#1F2937] font-medium text-[15px] leading-4"
            level={5}
          >
            <img src={PhoneIcon} alt="voice-call" className="w-10 h-10" />
            Choose service for Voice Call
          </Title>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item name="voiceCallProvider">
                  <Select
                    defaultValue="TWILIO"
                    placeholder="Select Provider"
                    className="h-[48px] border-[#E5E7EB] text-[#1F2937] text-[14px] font-medium leading-5"
                    onChange={(value) => handleProviderChange("voiceCall", value, "voiceCallProvider")}
                  >
                    <Option value="TWILIO">TWILIO</Option>
                    <Option value="SUPPORT">SUPPORT</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="voiceCallApiKey"
                >
                  <Input
                    placeholder="Enter license key"
                    type="text"
                    className="input-element w-[78%] no-border-radius"
                    onChange={(e) =>
                      form.setFieldsValue({ voiceCallApiKey: e.target.value })
                    }
                  />
                  <Button
                    onClick={() => {
                      if (selectedProviders.voiceCall === "SUPPORT") {
                        message.info("Please contact support to enable Voice Call provider integration for your account.");
                        return;
                      }
                      const licenseKey = form.getFieldValue("voiceCallApiKey");
                      handleLicenseKeyVerification(
                        "voiceCall",
                        selectedProviders.voiceCall,
                        licenseKey
                      );
                    }}
                    type="default"
                    loading={isVerifying.voiceCall}
                    style={{
                      borderTopRightRadius: "8px",
                      borderTopLeftRadius: "0px",
                      borderBottomRightRadius: "8px",
                      borderBottomLeftRadius: "0px",
                    }}
                    className="verify-btn py-4 px-3 w-[22%] h-[46px] border rounded-r-full text-[15px] font-medium leading-4 border-[#2563EB] bg-[#2563EB] text-white"
                  >
                    Verify
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        <Form.Item>
          <SubmitButton
            step="step5"
            loading={isUpdating || Object.values(isVerifying).some((v) => v)}
            onSkip={handleSkip}
          />
        </Form.Item>
      </Form>
    </>
  );
};

export default Step4;

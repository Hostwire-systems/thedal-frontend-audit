import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Typography, message } from "antd";
import {
  fetchCampaignSettings,
  updateCampaignSettings,
  verifyLicenseKeyApi,
} from "../../api/profileSettingsApi";

const { Option } = Select;
const { Text } = Typography;

interface CampaignSettingsPanelProps {
  showHeader?: boolean;
}

const CampaignSettingsPanel: React.FC<CampaignSettingsPanelProps> = ({
  showHeader = true,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        setIsLoading(true);
        const saved = await fetchCampaignSettings();
        form.setFieldsValue({
          smsProvider: saved?.smsMessagingService || "TWILIO",
          smsApiKey: saved?.smsLicenseKey || "",
        });
      } catch (error) {
        form.setFieldsValue({
          smsProvider: "TWILIO",
          smsApiKey: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSettings();
  }, [form]);

  const getPayload = () => {
    const provider = form.getFieldValue("smsProvider") || "TWILIO";
    const enteredKey = form.getFieldValue("smsApiKey");

    return {
      smsMessagingService: provider,
      smsLicenseKey:
        provider === "SUPPORT"
          ? enteredKey || "SUPPORT_REQUESTED"
          : enteredKey,
    };
  };

  const handleVerify = async () => {
    const payload = getPayload();

    if (!payload.smsLicenseKey) {
      message.error("Please enter an API key to verify.");
      return;
    }

    if (payload.smsMessagingService === "SUPPORT") {
      message.info(
        "Support provider selected. Save this setting and our team can assist with provider setup."
      );
      return;
    }

    try {
      await verifyLicenseKeyApi(payload, setIsVerifying);
      message.success("SMS API key verified and saved.");
    } catch (error) {
      message.error("Verification failed. Please check provider and API key.");
    }
  };

  const handleSave = async () => {
    const payload = getPayload();

    if (!payload.smsLicenseKey) {
      message.error("Please enter an API key.");
      return;
    }

    try {
      await updateCampaignSettings(payload, setIsSaving);
      message.success("Campaign settings updated.");
    } catch (error) {
      message.error("Failed to update campaign settings.");
    }
  };

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-[18px] leading-6">SMS Provider Settings</h3>
          <Text type="secondary">Set once, then run campaigns normally</Text>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          smsProvider: "TWILIO",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Form.Item label="Provider" name="smsProvider" className="mb-0">
            <Select placeholder="Select provider">
              <Option value="TWILIO">SMSGATEWAYHUB</Option>
              <Option value="SUPPORT">SUPPORT</Option>
            </Select>
          </Form.Item>

          <Form.Item label="API Key" name="smsApiKey" className="mb-0 md:col-span-2">
            <Input placeholder="Paste SMS provider API key" />
          </Form.Item>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            type="default"
            loading={isVerifying}
            onClick={handleVerify}
            disabled={isSaving || isLoading}
          >
            Verify
          </Button>
          <Button
            type="primary"
            loading={isSaving}
            onClick={handleSave}
            disabled={isVerifying || isLoading}
          >
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CampaignSettingsPanel;

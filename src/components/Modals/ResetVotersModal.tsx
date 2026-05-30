import React, { useState } from "react";
import { Modal, Input, Button, Typography, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { requestResetVotersOtpApi, verifyResetVotersOtpApi } from "../../api/voterApi";

const { Text } = Typography;

interface ResetVotersModalProps {
  visible: boolean;
  onCancel: () => void;
  electionId: number;
  onSuccess: () => void;
}

const ResetVotersModal: React.FC<ResetVotersModalProps> = ({
  visible,
  onCancel,
  electionId,
  onSuccess,
}) => {
  const [step, setStep] = useState<"CONFIRM" | "OTP">("CONFIRM");
  const [confirmationText, setConfirmationText] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep("CONFIRM");
    setConfirmationText("");
    setOtp(Array(6).fill(""));
    setLoading(false);
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const handleConfirmReset = async () => {
    if (confirmationText !== "RESET") {
      message.error('Please type "RESET" exactly to confirm');
      return;
    }

    setLoading(true);
    try {
      await requestResetVotersOtpApi(electionId);
      setStep("OTP");
    } catch (error: any) {
      console.error("Error requesting reset OTP:", error);
      message.error(error?.message || "Failed to request reset OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        (document.getElementById(`reset-otp-input-${index + 1}`) as HTMLInputElement)?.focus();
      }
    }
  };

  const handleOtpKeydown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index]) {
      if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        (document.getElementById(`reset-otp-input-${index - 1}`) as HTMLInputElement)?.focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyResetVotersOtpApi(electionId, otpValue);
      if (response.status === "success" || response.code === 200 || response.code === 20303) {
        message.success(response.message || "Voters reset successfully");
        onSuccess();
        handleCancel();
      } else {
        message.error(response.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Error verifying reset OTP:", error);
      message.error(error?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Step 1: Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>Reset All Voters</span>
          </div>
        }
        open={visible && step === "CONFIRM"}
        onOk={handleConfirmReset}
        onCancel={handleCancel}
        okText="Confirm Reset"
        okButtonProps={{ danger: true, loading }}
        width={400}
      >
        <div style={{ padding: "12px 0" }}>
          <Text type="secondary" style={{ display: "block", marginBottom: "16px" }}>
            This will reset all voted voters to non-voted status for this election. This action cannot be undone.
          </Text>
          <Text strong style={{ display: "block", marginBottom: "8px" }}>
            Type "RESET" to confirm:
          </Text>
          <Input
            placeholder='Type "RESET"'
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            onPressEnter={handleConfirmReset}
            disabled={loading}
          />
        </div>
      </Modal>

      {/* Step 2: OTP Modal */}
      <Modal
        title="Enter OTP to Confirm Reset"
        open={visible && step === "OTP"}
        footer={null}
        onCancel={handleCancel}
        width={400}
        centered
      >
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            A 6-digit OTP has been sent to your registered mobile number. Please enter it to complete the reset process.
          </Text>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px" }}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`reset-otp-input-${index}`}
                style={{
                  width: "45px",
                  height: "50px",
                  fontSize: "20px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1.5px solid #d9d9d9",
                }}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e, index)}
                onKeyDown={(e) => handleOtpKeydown(e, index)}
                disabled={loading}
              />
            ))}
          </div>

          <Button
            type="primary"
            danger
            size="large"
            block
            loading={loading}
            onClick={handleVerifyOtp}
            style={{ borderRadius: "8px", height: "45px", fontWeight: 600 }}
          >
            Verify & Reset Voters
          </Button>
          
          <Button
            type="link"
            style={{ marginTop: "16px" }}
            onClick={() => requestResetVotersOtpApi(electionId)}
            disabled={loading}
          >
            Resend OTP
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ResetVotersModal;

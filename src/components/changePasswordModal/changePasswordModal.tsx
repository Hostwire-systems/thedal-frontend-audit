import React, { useState, useEffect } from "react";
import { Modal, Button, Input, message } from "antd";
import { BASE_URL } from "../../config";
import {
  sendLoginOtp,
  verifyMobileOtp,
  loginWithPassword,
} from "../../api/authApi";
import axios from "axios";

interface ChangePasswordModalProps {
  mobile: string;
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  mobile,
  visible,
  onClose,
}) => {
  const [step, setStep] = useState<"sendOTP" | "verifyOTP" | "changePassword">(
    "sendOTP"
  );
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(mobile);
  const userId = localStorage.getItem("userId");

  const handleSendOTP = async () => {
    setIsLoading(true);
    // Here you would typically make an API call to send the OTP
    try {
      await sendLoginOtp(mobileNumber, setIsLoading);
      //  message.success('OTP sent successfully');
      setStep("verifyOTP");
    } catch (error) {
      console.error("Error sending OTP:", error);
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Here you would typically make an API call to verify the OTP
    setIsLoading(true);
    try {
      await verifyMobileOtp(mobileNumber, otp, setIsLoading);
      setOtp("");
      setStep("changePassword");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      console.log("userId: ", userId);
      console.log("password: ", newPassword);
      const response = await axios.post(
        `${BASE_URL}/auth/reset-password`,
        {
          userId: userId,
          password: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      console.log("Password changed:", response.data);
      let accessToken=response.data?.data?.accessToken;
      console.log("access token",accessToken);
      localStorage.setItem("jwtToken",accessToken);
      message.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
      setMobileNumber("");
      setStep("sendOTP");
      onClose(); // Close the modal after changing the password
    } catch (error: any) {
      console.error("Error changing password:", error);
      message.error(
        error.response?.data?.message || "Error Changing Password!"
      );
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "sendOTP":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-start", // Align input and text to the left
            }}
          >
            <p>
              An OTP will be sent to your registered mobile number{" "}
              <span className="text-blue-400">{mobileNumber}</span>. Please
              confirm to proceed.
            </p>
            <br />
            <Button
              onClick={handleSendOTP}
              loading={isLoading}
              style={{
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "#fff",
                alignSelf: "flex-end",
              }}
            >
              Send OTP
            </Button>
          </div>
        );
      case "verifyOTP":
        return (
          <div>
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mb-4"
            />
            <Button
              style={{
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "#fff",
              }}
              onClick={handleVerifyOTP}
              loading={isLoading}
            >
              Verify OTP
            </Button>
          </div>
        );
      case "changePassword":
        return (
          <div>
            <Input.Password
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-4"
            />
            <Input.Password
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mb-4"
            />
            <Button
              style={{
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "#fff",
              }}
              onClick={handleChangePassword}
              loading={isLoading}
            >
              Change Password
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Change Password"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      {renderContent()}
    </Modal>
  );
};

export default ChangePasswordModal;

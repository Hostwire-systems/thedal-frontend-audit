// OTPVerification.tsx
import { Button, Form, Input, message, Spin } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUserData } from "../../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { verifyVolunteer } from "../../../api/authApi";
import {
  verifyElectionOtpAndEnable2FA,
  verifyUsersOtpAndEnable2FA,
} from "../../../api/profileSettingsApi";
import { verifyCadreOtpAndEnable2FA } from "../../../api/volunteerOtpApi";

export enum OTPVerificationType {
  VOLUNTEER_LOGIN = "volunteer_login",
  VOLUNTEER_2FA = "volunteer_2fa",
  USER_2FA = "user_2fa",
  ELECTION_2FA = "election_2fa",
}

interface Props {
  userId: number;
  type: OTPVerificationType;
  onVerificationComplete?: () => void; // Optional callback for non-login flows
}

export default function OTPVerificationModal({
  userId,
  type,
  onVerificationComplete,
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        (
          document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement
        )?.focus();
      }
    }
  };

  const handleKeydown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index]) {
      if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        (
          document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement
        )?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      if (type === OTPVerificationType.VOLUNTEER_LOGIN) {
        const response = await verifyVolunteer({
          volunteerUserId: userId,
          otp: otpValue,
        });

        if (response.success) {
          localStorage.setItem("jwtToken", response.data.refreshToken);
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("onBoardStatus", response.data.onBoardStatus);
          dispatch(updateUserData(response.data));
          navigate("/elections");
        } else {
          message.error(response.message || "OTP verification failed.");
        }
      } else {
        // Handle other verification types
        let verificationResponse;
        switch (type) {
          case OTPVerificationType.VOLUNTEER_2FA:
            verificationResponse = await verifyCadreOtpAndEnable2FA(
              userId,
              otpValue
            );
            break;
          case OTPVerificationType.USER_2FA:
            verificationResponse = await verifyUsersOtpAndEnable2FA(
              userId,
              otpValue
            );
            break;
          case OTPVerificationType.ELECTION_2FA:
            verificationResponse = await verifyElectionOtpAndEnable2FA(
              userId,
              otpValue
            );
            break;
          default:
            throw new Error("Invalid OTP verification type");
        }

        if (verificationResponse.success) {
          message.success(
            verificationResponse.message || "OTP verified successfully"
          );
          if (onVerificationComplete) {
            onVerificationComplete();
          }
        } else {
          message.error(
            verificationResponse.message || "OTP verification failed."
          );
        }
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      message.error("An error occurred during OTP verification");
    } finally {
      setLoading(false);
    }
  };

  // Mock API functions - replace with actual implementations
  const verifyVolunteerLogin = async (userId: number, otp: string) => {
    // Implement actual API call
    return { success: true, message: "Login successful", data: {} };
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-lg">Enter OTP sent to your phone</h2>
      <Form name="otp_form" onFinish={handleSubmit}>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              id={`otp-input-${index}`}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeydown(e, index)}
              maxLength={1}
              className="otp-input text-center h-[62px] bg-[#F3F4F6]"
              autoComplete="off"
              inputMode="numeric"
              pattern="\d*"
            />
          ))}
        </div>

        <Form.Item className="mt-4">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full h-[55px] font-bold text-[16px]"
            loading={loading}
          >
            Verify OTP
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

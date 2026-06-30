import React from 'react'
import { Button, Divider, Form, Input, message, Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import EyeIcon from "../../../assets/icons/eye.svg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  verifyOtpLogin,
  sendLoginOtp,
} from "../../../api/authApi";
import { useDispatch,useSelector } from 'react-redux';
import { BASE_URL } from '../../../config';

interface Props {
  setIsLoginPressed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ForgotPassword ({setIsLoginPressed,setIsForgotPassword}:Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // Step 1: Send OTP, Step 2: Verify OTP, Step 3: Change Password
  const [mobileNumber, setMobileNumber] = useState<string>(
    useSelector((state: any) => state.auth.user?.mobileNumber || "")
  );
  const [timer, setTimer] = useState<number>(30); // Timer state
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); // To disable resend OTP
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const navigate = useNavigate();

  const dispatch = useDispatch(); // To dispatch Redux actions
  const mobile = useSelector((state: any) => state.auth.user?.mobileNumber);
  console.log("mobile", mobile);
  const { Text } = Typography;

  // Function to send OTP
  const handleSendOtp = async (values: { mobileNumber: string }) => {
    try {
      setMobileNumber(values.mobileNumber);
      await sendLoginOtp(values.mobileNumber, setIsLoading);
      setStep(2); // Proceed to OTP form
    } catch (error) {
      console.error("Error sending OTP", error);
    }
  };

  // OTP input handler
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
        ).focus();
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
         ).focus();
       }
     }
   };

  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  // Function to verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyOtpLogin(
        mobileNumber,
        otpValue,
        setIsVerifying
      );
      if (response.success) {
        setUserId(response.data.userId);
        console.log("Response.data: ", response.data);
        setAccessToken(response.data.accessToken);
        // Set userId for password reset
        setStep(3); // Proceed to Change Password form
      } else {
        message.error(response.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("Error during OTP verification", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendDisabled(true); // Disable resend button after click
      setTimer(30); // Reset the timer
      await sendLoginOtp(mobileNumber, setIsResending); // Pass the loading state handler to the API call
      //message.success("OTP resent successfully!");
    } catch (error) {
      message.error("Failed to resend OTP.");
      console.error("Error during OTP resend", error);
    }
  };

  // Function to change the password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }
    console.log(userId);
    setIsLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/auth/reset-password`,
        {
          userId,
          password: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      message.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setIsForgotPassword(false);
      setIsLoginPressed(false);
    } catch (error) {
      console.error("Error changing password:", error);
      message.error("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resendDisabled) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setResendDisabled(false); // Enable resend after timer ends
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
  }, [resendDisabled]);
  return (
    <div className="w-full flex flex-col gap-3">
      <h2 className="font-bold text-[28px] leading-8">Welcome Back!</h2>

      {/* Step 1: Mobile Number Form */}
      {step === 1 && (
        <Form onFinish={handleSendOtp} name="password_reset_form">
          <p className="text-[16px] font-normal leading-5 my-6">
            Enter your Mobile number
          </p>
          <Form.Item
            name="mobileNumber"
            rules={[
              { required: true, message: "Please input your Mobile Number!" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Mobile Number must be 10 digits!",
              },
            ]}
          >
            <Input
              placeholder="Mobile Number"
              onChange={(e) => setMobileNumber(e.target.value)}
              value={mobileNumber}
              prefix={<span className="mr-2">+91</span>}
              className="input-element "
              maxLength={10}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-2 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spin indicator={<LoadingOutlined spin />} />
            ) : (
              "Verify and Reset"
            )}
          </Button>
        </Form>
      )}

      {/* Step 2: OTP Form */}
      {step === 2 && (
        <div>
          <p className="text-[16px] font-normal leading-5 my-6">
            A text with One Time Password (OTP) has been sent to your mobile
            number +91-{mobileNumber}.
          </p>
          <div className="flex justify-center gap-2 mb-4">
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
          <Button
            type="primary"
            onClick={handleVerifyOtp}
            className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-2 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <Spin indicator={<LoadingOutlined spin />} />
            ) : (
              "Verify OTP"
            )}
          </Button>
          <p
            className={`mt-7 text-[14px] text-[#425466] text-center font-medium leading-5 cursor-pointer ${
              resendDisabled ? "text-gray-400" : ""
            }`}
            onClick={!resendDisabled ? handleResendOtp : undefined}
            style={{ pointerEvents: resendDisabled ? "none" : "auto" }}
          >
            {resendDisabled ? `Resend OTP in ${timer}s` : "Resend OTP"}
          </p>
        </div>
      )}

      {/* Step 3: Change Password Form */}
      {step === 3 && (
        <Form onFinish={handleChangePassword}>
          <p className="text-[16px] font-normal leading-5 my-6">
            Create a New Password
          </p>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Please input your new password!" },
            ]}
          >
            <Input.Password
              // type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              className="input-element"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              suffix={
                <Button type="link" onClick={handleToggleNewPasswordVisibility}>
                  <img
                    src={EyeIcon}
                    alt="Toggle password visibility"
                    style={{ width: "16px", height: "16px" }}
                  />
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your new password!" },
            ]}
          >
            <Input.Password
              // type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="input-element"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              suffix={
                <Button
                  type="link"
                  onClick={handleToggleConfirmPasswordVisibility}
                >
                  <img
                    src={EyeIcon}
                    alt="Toggle password visibility"
                    style={{ width: "16px", height: "16px" }}
                  />
                </Button>
              }
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-2 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spin indicator={<LoadingOutlined spin />} />
            ) : (
              "Change Password"
            )}
          </Button>
        </Form>
      )}
      <Text
        onClick={() => {
          setIsForgotPassword(false);
          setIsLoginPressed(false);
        }}
        className="mt-4 cursor-pointer text-[#2F3538] hover:underline text-center"
      >
        Back to Login
      </Text>
    </div>
  );
}

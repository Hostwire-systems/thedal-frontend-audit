import { Button, Form, Input, Spin } from "antd";
import { useState, useEffect } from "react";
import {Link} from "react-router-dom";
import SuccessIcon from "../../../assets/icons/thunder.svg";
import { IoIosArrowForward } from "react-icons/io";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { resendOtp, verifyMobileOtp } from "../../../api/authApi";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  handleOTPVerification: (values: { otp: string }) => void;
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OtpVerification({
  handleOTPVerification,
  setIsOTPSent
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false); // For spinner during OTP verification
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); // To disable resend OTP
  const [timer, setTimer] = useState<number>(30); // Timer state

  const userData = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate(); // Use navigate to redirect

  useEffect(() => {
    console.log("userData", userData);
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

  const handleSubmit = async () => {
    const otpValue = otp.join(""); // Join the OTP digits
    try {
      if (!userData) {
        console.error("User data not found");
        return;
      }
      await verifyMobileOtp(userData.mobile, otpValue, setIsVerifying); // Verify OTP
      setIsOtpVerified(true);
    } catch (error) {
      console.error("OTP verification failed", error);
    }
  };

  const handleResendOtp = async () => {
    if (!userData) {
      console.error("User data not found");
      return;
    }
    setResendDisabled(true);
    setTimer(30); // Reset the timer
    await resendOtp(userData.mobile); // Call resend OTP API
  };

  return (
    <div className="text-center flex flex-col gap-3 items-center">
      {isOtpVerified && <img src={SuccessIcon} alt="Success" />}
      <h2 className="font-bold text-[20px] leading-8">
        {!isOtpVerified ? (
          <>Verify mobile number</>
        ) : (
          <>OTP verified successfully</>
        )}
      </h2>
      <p className="text-[16px] font-normal leading-5">
        {!isOtpVerified ? (
          <>
            A text with One Time Password (OTP) has been sent to your mobile
            number +91-{userData?.mobile}.
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => setIsOTPSent(false)}
            >
              Change
            </span>
          </>
        ) : (
          <>
            Your account has been successfully created. Contact the admin for
            activation.{" "}
            <a className="text-blue-500 cursor-pointer" href="www.thedal.co.in">
              www.thedal.co.in
            </a>
          </>
        )}
      </p>
      {!isOtpVerified ? (
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
          <Form.Item className="!mb-0 mt-14">
            <p
              onClick={handleResendOtp}
              className={`text-[14px] font-medium leading-5 cursor-pointer ${
                resendDisabled ? "text-gray-400" : "text-blue-400"
              }`}
              style={{ pointerEvents: resendDisabled ? "none" : "auto" }}
            >
              {resendDisabled ? `Resend OTP in ${timer}s` : "Resend OTP"}
            </p>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-2"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <Spin indicator={<LoadingOutlined spin />} size="large" />
              ) : (
                "Verify"
              )}
              <IoIosArrowForward />
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Button
          onClick={() => navigate("/login")}
          type="primary"
          htmlType="submit"
          className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-2"
        >
          Continue setup <IoIosArrowForward />
        </Button>
      )}
    </div>
  );
}

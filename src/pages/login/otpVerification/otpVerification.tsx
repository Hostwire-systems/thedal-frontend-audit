import { Button, Divider, Form, Input, message, Spin } from "antd";
import { useState, useEffect } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../../../redux/slices/userSlice";
import EyeIcon from "../../../assets/icons/eye.svg";
import { useDispatch, useSelector } from "react-redux"; // To update Redux state
import { updateUserData } from "../../../redux/slices/authSlice"; // Redux action to store userData
import {
  verifyOtpLogin,
  loginWithPassword,
  sendLoginOtp,
} from "../../../api/authApi"; // Import the new API functions
import {
  LoadingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import ReCAPTCHA from "react-google-recaptcha";
import OTPVerificationModal, {
  OTPVerificationType,
} from "./OTPVerificationModal";

interface Props {
  handleOTPVerification: (values: { otp: string }) => void;
  isForgotPassword: boolean;
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoginPressed: React.Dispatch<React.SetStateAction<boolean>>;
  isLoginWithPass: boolean; // Indicates if using password
  setLoginWithPass: React.Dispatch<React.SetStateAction<boolean>>; // Function to set login method
}

const SECRET_KEY = "6LcNeOUqAAAAAKG2ssz53DYZBxXyEXv8gadm1QAW";
const SITE_KEY = "6LcNeOUqAAAAAA-cdqTrToUgwJ8dCXFwl_CZKg7J";

export default function OtpVerification({
  handleOTPVerification,
  setIsLoginPressed,
  isLoginWithPass,
  setLoginWithPass,
  isForgotPassword,
  setIsForgotPassword,
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 inputs
  const [password, setPassword] = useState<string>(""); // Store the password
  const [otpStageData, setOtpStageData] = useState<null | {
    volunteerUserId: number;
  }>(null);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoginWithPassword, setIsLoginWithPassword] =
    useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false); // For spinner during OTP verification
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); // To disable resend OTP
  const [timer, setTimer] = useState<number>(30); // Timer state
  const [isResending, setIsResending] = useState<boolean>(false); // For spinner during OTP resend
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // For navigation
  const dispatch = useDispatch(); // To dispatch Redux actions

  const getPostLoginRoute = (role?: string | null) => {
    const normalizedRole = (role || "").toString().toUpperCase();
    const isDashboardAllowed =
      normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";
    return isDashboardAllowed ? "/static-dashboard" : "/cadre-info";
  };

  // Fetch the mobileNumber from Redux store
  const mobileNumber = useSelector(
    (state: any) => state.auth.user?.mobileNumber
  );

  const validateRecaptcha = async (token: string) => {
    const proxyUrl = "https://cors-anywhere.herokuapp.com/"; // Temporary proxy
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    try {
      const response = await fetch(
        // proxyUrl +
        verifyUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: SECRET_KEY, // WARNING: Exposes your secret key on the client!
            response: token,
          }).toString(),
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("reCAPTCHA verification result:", data);
      if (data.success) {
        return true;
      } else {
        //message.error("reCAPTCHA verification failed. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      //message.error("Error verifying reCAPTCHA. Please try again.");
      return false;
    }
  };

  const handleWithOTP = async () => {
    setLoginWithPass(false);
    // Call API to send OTP
    try {
      await sendLoginOtp(mobileNumber, setIsLoading);
    } catch (error) {
      console.error("Error while login via OTP", error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    console.log("inside handleforgotpassword");
    setIsForgotPassword(true);
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value); // Update the password field
  };

  const handleSubmit = async () => {
    if (!recaptchaToken) {
      message.warning("Please complete the CAPTCHA before logging in.");
      return;
    }
    if (isLoginWithPass) {
      // Handle login with password
      try {
        setIsVerifying(true);
        const response = await loginWithPassword(
          mobileNumber,
          password,
          setIsVerifying
        );
        console.log("Response from login with password", response);
        if (response.data?.volunteerUserId) {
          setOtpStageData({ volunteerUserId: response.data.volunteerUserId });
          return;
        }

        if (response.success) {
          // Store JWT in localStorage
          localStorage.setItem("jwtToken", response.data.accessToken);
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("role", response.data.role);
          const onBoardStatus = response.data.onBoardStatus;
          localStorage.setItem("onBoardStatus", String(response.data.onBoardStatus));
          // Dispatch userData to Redux
          console.log("Logged in user", response.data);
          dispatch(updateUserData(response.data));
          console.log("onBoardStatus: ", onBoardStatus);
          navigate(getPostLoginRoute(response.data.role));
          dispatch(fetchProfile());
        } else {
          console.error("Login failed:", response);
          message.error(response.message || "Login failed");
        }
      } catch (error) {
        console.error("Error during login with password", error);
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Handle OTP login

      const otpValue = otp.join(""); // Join the OTP digits
      if (otpValue.length !== 6) {
        message.error("Please enter the 6-digit OTP.");
        return;
      }

      try {
        setIsVerifying(true);
        // Call the OTP verification API from authApi.ts
        const response = await verifyOtpLogin(
          mobileNumber,
          otpValue,
          setIsVerifying
        );

        console.log("Response from login with otp", response);
        if (response.data?.volunteerUserId) {
          setOtpStageData({ volunteerUserId: response.data.volunteerUserId });
          return;
        }

        if (response.success) {
          //message.success("OTP verified successfully!");

          // Store JWT in localStorage
          console.log(response.data);
          localStorage.setItem("jwtToken", response.data.refreshToken);
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("role", response.data.role);
          const onBoardStatus = response.data.onBoardStatus;
          localStorage.setItem("onBoardStatus", String(response.data.onBoardStatus));

          // Dispatch userData to Redux
          dispatch(updateUserData(response.data));
          console.log("onBoardStatus: ", onBoardStatus);
          navigate(getPostLoginRoute(response.data.role));
        } else {
          message.error(response.message || "OTP verification failed");
        }
      } catch (error) {
        console.error("Error during OTP verification", error);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  // Handle Resend OTP
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

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-bold text-[32px] leading-8">Welcome Back!</h2>
      <p className="text-[16px] font-normal leading-5">
        {!isLoginWithPass ? (
          <>
            A text with One Time Password (OTP) has been sent to your mobile
            number +91-{mobileNumber}.{" "}
            <span
              className="text-blue-400 font-semibold text-sm cursor-pointer"
              onClick={() => navigate("/")}
            >
              Change
            </span>
          </>
        ) : (
          <>
            <p
              className="text-blue-400 font-semibold text-xs cursor-pointer mt-2"
              onClick={() => setIsLoginPressed(false)}
            >
              Not +91-{mobileNumber}? Change Mobile Number
            </p>
            Please enter the password{" "}
          </>
        )}
      </p>

      {otpStageData ? (
        <OTPVerificationModal
          userId={otpStageData.volunteerUserId}
          type={OTPVerificationType.VOLUNTEER_LOGIN}
          onVerificationComplete={() => {}}
        />
      ) : (
        <Form name="otp_form" onFinish={handleSubmit}>
          {!isLoginWithPass ? (
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
          ) : (
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                className="input-element"
                value={password}
                onChange={handlePasswordChange}
                suffix={
                  <Button type="link" onClick={handleTogglePasswordVisibility}>
                    <img
                      src={EyeIcon}
                      alt="Toggle visibility"
                      width="16"
                      height="16"
                    />
                  </Button>
                }
              />
            </Form.Item>
          )}

          {/* Recaptcha and submit */}
          <div className="flex justify-center my-4">
            <ReCAPTCHA
              sitekey={SITE_KEY}
              onChange={(token) => {
                setRecaptchaToken(token);
                validateRecaptcha(token);
              }}
              onExpired={() => {
                setRecaptchaVerified(false);
                setRecaptchaToken(null);
              }}
            />
          </div>

          <Form.Item className="!mb-0">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-[#2F3538] h-[55px]"
              disabled={isVerifying || isResending}
            >
              {isVerifying ? (
                <Spin indicator={<LoadingOutlined spin />} size="large" />
              ) : isLoginWithPassword ? (
                "Login"
              ) : (
                "Verify"
              )}
              <IoIosArrowForward />
            </Button>
          </Form.Item>
        </Form>
      )}

      {!otpStageData && isLoginWithPass && (
        <>
          <p
            className="text-[14px] text-[#425466] text-center font-medium leading-5 cursor-pointer mt-1"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </p>

          <Divider orientation="center" className="!font-normal !text-[12px]">
            Or login via
          </Divider>

          <Button
            onClick={handleWithOTP}
            type="default"
            className="w-full px-10 my-[15px] h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
          >
            Login via OTP
          </Button>
        </>
      )}
    </div>
  );
}

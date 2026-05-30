import { Button, Form, Input, Spin, message } from "antd";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../redux/store";
import { resendOtp, verifyOtpLogin } from "../../../api/authApi";
import { useNavigate } from "react-router-dom";
import { updateUserData } from "../../../redux/slices/authSlice";
import { fetchProfile } from "../../../redux/slices/userSlice";
import { 
  LoadingOutlined, 
  ArrowRightOutlined
} from "@ant-design/icons";

interface Props {
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
  handleOTPVerification: (values: { otp: string }) => void;
  setIsAccountInactive: React.Dispatch<React.SetStateAction<boolean>>;
  onLoginSuccess: (route: string) => void;
}

export default function OtpVerification({
  setIsOTPSent,
  setIsAccountInactive,
  onLoginSuccess
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false); 
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); 
  const [timer, setTimer] = useState<number>(30); 

  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth.user);
  const mobileNumber = userData?.mobileNumber;
  const navigate = useNavigate(); 

  const getPostLoginRoute = (role?: string | null) => {
    const normalizedRole = (role || "").toString().toUpperCase();
    return (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN") 
      ? "/static-dashboard" 
      : "/cadre-info";
  };

  useEffect(() => {
    if (resendDisabled) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setResendDisabled(false); 
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
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
  const otpValue = otp.join("");

  if (otpValue.length < 6) {
    message.error("Please enter the 6-digit OTP.");
    return;
  }

  try {
    if (!mobileNumber) {
      message.error("Mobile number not found");
      return;
    }

    setIsVerifying(true);

    const response = await verifyOtpLogin(
      mobileNumber,
      otpValue,
      setIsVerifying
    );

    // IMPORTANT FIX
    if (
      response?.message &&
      response.message.toLowerCase().includes("inactive")
    ) {
      setIsAccountInactive(true);
      return;
    }

    if (response.success) {
      localStorage.setItem("jwtToken", response.data.accessToken);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem(
        "onBoardStatus",
        String(response.data.onBoardStatus)
      );

      dispatch(updateUserData(response.data));
      dispatch(fetchProfile());

      onLoginSuccess(getPostLoginRoute(response.data.role));
    } else {
      message.error(response.message || "OTP verification failed");
    }
  } catch (error) {
    console.error("OTP verification failed", error);
  } finally {
    setIsVerifying(false);
  }
};

  const handleResendOtp = async () => {
    if (!mobileNumber) return;
    setResendDisabled(true);
    setTimer(30); 
    await resendOtp(mobileNumber); 
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-verification-section">
      <div className="otp-description-row">
        <p className="otp-description-left">
          Enter OTP
        </p>

        <p className="otp-description-right">
          OTP sent to{" "}
          <span className="otp-mobile-num">
            +91 XXXXX {mobileNumber?.slice(-5)}
          </span>
        </p>
      </div>

      <Form name="otp_form" onFinish={handleSubmit}>
        <div className="otp-inputs-container">
          {otp.map((digit, index) => (
            <Input
              key={index}
              id={`otp-input-${index}`}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeydown(e, index)}
              maxLength={1}
              className={`otp-box ${digit ? 'otp-box-active' : ''}`}
              autoComplete="off"
              inputMode="numeric"
              pattern="\d*"
            />
          ))}
        </div>

        {/* Error message placeholder if needed */}
        {/* <div className="otp-error-msg">
          <CloseCircleFilled style={{ marginRight: 4 }} /> Invalid OTP
        </div> */}

        <div className="resend-section">
          <span className="resend-hint">Didn't receive code?</span>
          {resendDisabled ? (
            <div className="resend-action-group">
              <span className="resend-label">Resend OTP in</span>
              <span className="timer-badge">{formatTime(timer)}</span>
            </div>
          ) : (
            <span className="resend-link" onClick={handleResendOtp}>
              Resend OTP
            </span>
          )}
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="cta-btn otp-verify-button"
            disabled={isVerifying || otp.join("").length < 6}
          >
            {isVerifying ? (
              <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
            ) : (
              <>Verify OTP →</>
            )}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

import { Button, Form, Input, Spin } from "antd";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { resendOtp, verifyMobileOtp } from "../../../api/authApi";
import { useNavigate } from "react-router-dom";
import { 
  LoadingOutlined, 
  CheckCircleFilled, 
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
  MailOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";

interface Props {
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOtpVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OtpVerification({
  setIsOTPSent,
  setIsOtpVerified
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false); 
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); 
  const [timer, setTimer] = useState<number>(30); 

  const userData = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate(); 

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
    if (otpValue.length < 6) return;
    
    try {
      if (!userData) {
        console.error("User data not found");
        return;
      }
      setIsVerifying(true);
      await verifyMobileOtp(userData.mobile, otpValue, setIsVerifying); 
      setIsOtpVerified(true);
    } catch (error) {
      console.error("OTP verification failed", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userData) {
      console.error("User data not found");
      return;
    }
    setResendDisabled(true);
    setTimer(30); 
    await resendOtp(userData.mobile); 
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-wrapper">
      <h2 className="otp-h2">Verify mobile number</h2>
      <p className="otp-p">
        A text with One Time Password (OTP) has been sent to your mobile number{" "}
        <span className="otp-mobile-num">+91-{userData?.mobile}</span>
        <span className="otp-change-link" onClick={() => setIsOTPSent(false)}>
          Change
        </span>
      </p>

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

        <div className="resend-container">
          <span>Didn't receive code?</span>
          {resendDisabled ? (
            <>
              <span className="resend-link">Resend OTP in</span>
              <span className="timer-badge">{formatTime(timer)}</span>
            </>
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
            className="cta-btn otp-btn"
            disabled={isVerifying || otp.join("").length < 6}
          >
            {isVerifying ? (
              <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
            ) : (
              <>Verify OTP <ArrowRightOutlined /></>
            )}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

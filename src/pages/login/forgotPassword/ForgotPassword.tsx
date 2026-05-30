import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message, Spin } from "antd";
import { 
  LoadingOutlined, 
  LockOutlined, 
  ArrowRightOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  CaretDownOutlined
} from "@ant-design/icons";
import axios from "axios";
import {
  verifyOtpLogin,
  sendLoginOtp,
} from "../../../api/authApi";
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../config';
import LoginOtpPhone from "../../../assets/icons/Login-otp-phone.svg";

interface Props {
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ForgotPassword ({ setIsForgotPassword }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // Step 1: Send OTP, Step 2: Verify OTP, Step 3: Change Password, Step 4: Success
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [timer, setTimer] = useState<number>(30); 
  const [resendDisabled, setResendDisabled] = useState<boolean>(true); 
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  
  const mobile = useSelector((state: any) => state.auth.user?.mobileNumber);

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    return strength;
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#e5e7eb", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const currentStrength = getPasswordStrength(newPassword);

  useEffect(() => {
    if (mobile) setMobileNumber(mobile);
  }, [mobile]);

  const handleSendOtp = async (values: { mobileNumber: string }) => {
    try {
      setMobileNumber(values.mobileNumber);
      await sendLoginOtp(values.mobileNumber, setIsLoading);
      setStep(2);
      setResendDisabled(true);
      setTimer(30);
    } catch (error) {
      console.error("Error sending OTP", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        (document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement).focus();
      }
    }
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index]) {
      if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        (document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement).focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    // DEBUG: Bypassing OTP verification for UI testing
    // To restore, uncomment the API call below and remove setStep(3)
    setUserId("debug-user-id");
    setAccessToken("debug-access-token");
    setStep(3);
    return;

    /* Original Verification Logic
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyOtpLogin(mobileNumber, otpValue, setIsVerifying);
      if (response.success) {
        setUserId(response.data.userId);
        setAccessToken(response.data.accessToken);
        setStep(3);
      } else {
        message.error(response.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("Error during OTP verification", error);
    } finally {
      setIsVerifying(false);
    }
    */
  };

  const handleResendOtp = async () => {
    try {
      setResendDisabled(true);
      setTimer(30);
      await sendLoginOtp(mobileNumber, setIsLoading);
    } catch (error) {
      message.error("Failed to resend OTP.");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/auth/reset-password`,
        { userId, password: newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setStep(4);
    } catch (error) {
      console.error("Error changing password:", error);
      message.error("Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setStep(1);
    setOtp(Array(6).fill(""));
    setNewPassword("");
    setConfirmPassword("");
    setIsForgotPassword(false);
  };

  useEffect(() => {
    if (resendDisabled && step === 2) {
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
  }, [resendDisabled, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-form-wrapper">
      {step < 3 ? (
        <>
          {/* MOBILE INPUT - ALWAYS VISIBLE IN STEPS 1 & 2 */}
          <div className="mobile-input-section">
            <h2 className="login-h2">Forgot <span>Password</span></h2>
            <p className="login-password-change">Reset your password using OTP verification.</p>
            
            <Form onFinish={handleSendOtp}   name="otp_form"
  layout="vertical"
 initialValues={{ mobileNumber }} requiredMark={false}>
              <Form.Item
                name="mobileNumber"
                label="Mobile Number"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{10}$/, message: "10 digits required" }
                ]}
              >
                <Input
                  className="otp-mobile-input"
                  disabled={step > 1}
                  prefix={
                    <>
                      <img src={LoginOtpPhone} alt="" className="login-input-icon" />
                      <span className="country-code-section">
                        +91 <CaretDownOutlined style={{ fontSize: 10, color: '#6b7280' }} />
                      </span>
                    </>
                  }
                  placeholder="Enter Mobile Number"
                />
              </Form.Item>

              {step === 1 && (
                <Button type="primary" htmlType="submit" className="cta-btn" disabled={isLoading}>
                  {isLoading ? (
                    <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
                  ) : (
                    <>Send OTP <ArrowRightOutlined /></>
                  )}
                </Button>
              )}
            </Form>
          </div>

          {/* OTP SECTION - ONLY VISIBLE IN STEP 2 */}
          {step === 2 && (
            <>
              <div className="otp-divider">
                <span>and continue with</span>
              </div>

<div className="otp-verification-section">               <div className="otp-description-row">
                  <p className="otp-description-left">Enter OTP</p>
                  <p className="otp-description-right">
                    OTP sent to <span className="otp-mobile-num">+91 XXXXX {mobileNumber?.slice(-5)}</span>
                  </p>
                </div>

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

                <div className="resend-section">
                  <span className="resend-hint">Didn't receive code?</span>
                  {resendDisabled ? (
                    <div className="resend-action-group">
                      <span className="resend-label">Resend OTP in</span>
                      <span className="timer-badge">{formatTime(timer)}</span>
                    </div>
                  ) : (
                    <span className="resend-link" onClick={handleResendOtp}>Resend OTP</span>
                  )}
                </div>

                <Form.Item style={{ marginBottom: 0 }}>
  <Button
    type="primary"
    onClick={handleVerifyOtp}
    className="cta-btn otp-verify-button"
    disabled={isVerifying || otp.join("").length < 6}
  >
    {isVerifying ? (
      <Spin indicator={<LoadingOutlined spin style={{ color: "#fff" }} />} />
    ) : (
      <>Verify OTP →</>
    )}
  </Button>
</Form.Item>
              </div>
            </>
          )}

          {/* SINGLE NAVIGATION LINK */}
 <div className="forgot-password-bottom-links">
  <span
    className="forgot-password-back-link"
    onClick={() => setIsForgotPassword(false)}
  >
    ← Back to Login
  </span>

  <div className="forgot-password-bottom-divider" />

  <span
    className="forgot-password-login-link"
    onClick={() => setIsForgotPassword(false)}
  >
    Login with Password
  </span>
</div>
        </>
      ) : step === 3 ? (
        <div className="password-reset-section">
          <h2 className="login-h2">Create New <span>Password</span></h2>
          <p className="login-p" style={{ marginBottom: '24px' }}>Set a strong password to secure your account</p>
          
          <Form layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
            <Form.Item
              label="Create password"
              name="newPassword"
              style={{ marginBottom: '8px' }}
              rules={[
                { required: true, message: "Required" },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: "Invalid Password Format",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                placeholder="Enter password"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Item>
            
            <div className="password-strength-wrapper">
              <span className="strength-requirement">
                Minimum 8 characters with a mix of letters, numbers & symbols
              </span>
              <div className="strength-meter-row">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((bar) => (
                    <div 
                      key={bar} 
                      className="strength-bar"
                      style={{ 
                        backgroundColor: bar <= currentStrength ? strengthColors[currentStrength] : "#e5e7eb" 
                      }}
                    />
                  ))}
                </div>
                <span 
                  className="strength-text" 
                  style={{ color: strengthColors[currentStrength] }}
                >
                  {strengthLabels[currentStrength]}
                </span>
              </div>
            </div>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              rules={[
                { required: true, message: "Required" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                placeholder="Confirm password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" className="cta-btn" disabled={isLoading}>
              {isLoading ? (
                <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
              ) : (
                <>Reset Password <ArrowRightOutlined /></>
              )}
            </Button>
          </Form>

          <div className="signup-hint" style={{ marginTop: 24, textAlign: 'left', display: 'flex', justifyContent: 'flex-start' }}>
            <span className="forgot-link" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsForgotPassword(false)}>← Back to Login</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-5 animate-authFadeInUp">
          <div className="mb-8 relative">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center relative">
              <div className="absolute w-24 h-24 bg-green-500 bg-opacity-10 rounded-full -z-10"></div>
              <CheckCircleFilled className="text-4xl text-green-500" />
            </div>
          </div>
          
          <h2 className="text-[30px] font-bold text-[rgb(var(--auth-text-primary)/1)] text-center leading-tight mb-3">
            Password <span className="text-[rgb(var(--auth-interactive-link)/1)]">Updated Successfully</span>
          </h2>
          
          <p className="text-[15px] text-[rgb(var(--auth-text-secondary)/1)] text-center leading-relaxed mb-8">
            Your password has been reset securely.<br />
            You can now login using your new password.
          </p>

          <div className="w-full bg-[rgb(var(--auth-surface-muted)/1)] border border-[rgb(var(--auth-border-default)/1)] rounded-[14px] p-4 flex items-center gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-[rgb(var(--auth-surface-elevated)/1)] flex items-center justify-center text-[rgb(var(--auth-interactive-link)/1)] text-[20px] border border-[rgb(var(--auth-border-default)/1)] flex-shrink-0">
              <SafetyCertificateOutlined />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[rgb(var(--auth-text-primary)/1)] mb-0.5">For security reasons,</span>
              <span className="text-[13px] text-[rgb(var(--auth-text-secondary)/1)]">Please login again with your new password.</span>
            </div>
          </div>

          <Button 
            type="primary" 
            className="h-[52px] bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold w-full shadow-lg shadow-blue-600/25 border-none mt-2" 
            onClick={handleGoToLogin}
          >
            Go to Login <ArrowRightOutlined />
          </Button>
        </div>
      )}
    </div>
  );
}

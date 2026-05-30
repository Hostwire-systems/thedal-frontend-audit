import "./Login.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/icons/Thedal-logo.svg";
import LoginForm from "./loginForm/LoginForm";
import ForgotPassword from "./forgotPassword/ForgotPassword";
import OtpVerification from "./otpVerification/otpVerification";
import ThemeSwitcher from "../../components/auth/ThemeSwitcher";
import LeftBrandingPanel from "../../components/auth/LeftBrandingPanel";
import LoginEarphone from "../../assets/icons/Login-earphone.svg";
import RegisterSuccessCelebration from "../../assets/icons/Register-check-celebration.svg";
import ReCAPTCHA from "react-google-recaptcha";
import { 
  LockOutlined,
  MobileOutlined,
} from "@ant-design/icons";

const SITE_KEY = "6LcNeOUqAAAAAA-cdqTrToUgwJ8dCXFwl_CZKg7J";

const LoginSuccessScreen: React.FC<{ redirectRoute: string }> = ({ redirectRoute }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const interval = 20; // 20ms update
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    const redirectTimer = setTimeout(() => {
      navigate(redirectRoute);
    }, duration + 500); // Small buffer after progress hits 100%

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, redirectRoute]);

  return (
    <div className="success-screen-centered">
      <div className="success-container">
        <div className="success-icon-wrapper">
          <img
            src={RegisterSuccessCelebration}
            alt="Success"
            className="success-celebration-icon"
          />
        </div>
        
        <h2 className="success-h2">
          Login <span>Successful!</span>
        </h2>
        <p className="success-p" style={{ color: '#718096', fontSize: '18px', marginBottom: '40px' }}>
          Redirecting you to your dashboard...
        </p>

        <div className="login-progress-wrapper">
          <div 
            className="login-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const InactiveAccountState: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 animate-authFadeInUp">
      <div className="relative mb-8">
        <div className="absolute -top-3 -right-3 w-3 h-3 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-10 -left-8 w-2.5 h-2.5 bg-red-400 rounded-full opacity-30 animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute -bottom-2 right-10 w-2 h-2 bg-yellow-400 rounded-full opacity-30"></div>
        
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center relative shadow-sm">
          <div className="absolute inset-0 bg-red-500/10 rounded-full scale-110 opacity-20 animate-ping" style={{ animationDuration: '4s' }}></div>
          <LockOutlined className="text-[40px] text-red-500" />
        </div>
      </div>

      <h2 className="text-[32px] md:text-[36px] font-bold text-[rgb(var(--auth-text-primary)/1)] text-center leading-tight mb-3">
        Your account is <span className="text-red-500">inactive</span>
      </h2>

      <p className="text-[16px] text-[rgb(var(--auth-text-secondary)/1)] text-center leading-relaxed mb-12 max-w-[340px]">
        Your account is currently inactive. <br />
        Contact admin for more information.
      </p>

      <button 
        onClick={onBack}
        className="text-[rgb(var(--auth-interactive-link)/1)] font-semibold text-base hover:opacity-90 transition-all duration-200 flex items-center gap-2 group"
      >
        <span className="text-xl transform group-hover:-translate-x-1 transition-transform">←</span> Back to Login
      </button>
    </div>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [isAccountInactive, setIsAccountInactive] = useState<boolean>(false);
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState<boolean>(false);
  const [redirectRoute, setRedirectRoute] = useState<string>("");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleLoginSuccess = (route: string) => {
    setRedirectRoute(route);
    setIsLoginSuccessful(true);
  };

  const handleOTPVerification = async (values: { otp: string }) => {
    console.log("OTP Verified:", values.otp);
  };

  return (
    <div className="login-page-wrapper">
      <LeftBrandingPanel />

      {/* RIGHT FORM PANEL */}
      <div className="login-right-panel">
        {isLoginSuccessful ? (
          <LoginSuccessScreen redirectRoute={redirectRoute} />
        ) : (
          <div className="form-container">
            <div className="login-content-block">
              <div className="top-logo">
                <img src={logo} alt="Thedal Logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }} />
              </div>

              {isAccountInactive ? (
                <InactiveAccountState onBack={() => setIsAccountInactive(false)} />
              ) : isForgotPassword ? (
                <ForgotPassword setIsForgotPassword={setIsForgotPassword} />
              ) : (
                <>
                  <div className="auth-tabs-wrapper">
                    <div className="auth-tabs">
                      <div 
                        className={`auth-tab ${loginMode === "password" ? "active" : ""}`}
                        onClick={() => {
                          setLoginMode("password");
                          setIsOTPSent(false);
                        }}
                      >
                        <LockOutlined className="auth-tab-icon" />
                        Password Login
                      </div>
                      <div 
                        className={`auth-tab ${loginMode === "otp" ? "active" : ""}`}
                        onClick={() => {
                          setLoginMode("otp");
                          setIsOTPSent(false);
                        }}
                      >
                        <MobileOutlined className="auth-tab-icon" />
                        Login with OTP
                      </div>
                    </div>
                  </div>

                  <h2 className="login-h2">
                    Welcome <span>Back!</span>
                  </h2>
                 <p className={`login-p ${loginMode === "otp" ? "otp-login-p" : ""}`}>
                    {loginMode === "otp"
                      ? <>Signin to continue to <span>Thedal App</span></>
                      : <>Login to continue to <span>Thedal App</span></>
                    }
                  </p>

                  <div className="auth-main-content-wrapper">
                    {loginMode === "password" && (
                      <LoginForm
                        mode="password"
                        isOTPSent={false}
                        setIsOTPSent={setIsOTPSent}
                        setIsForgotPassword={setIsForgotPassword}
                        setIsAccountInactive={setIsAccountInactive}
                        recaptchaToken={recaptchaToken}
                        onLoginSuccess={handleLoginSuccess}
                      />
                    )}

                    {loginMode === "otp" && (
                      <>
                        <div className="mobile-input-section">
                          <h3 className="mobile-section-h2">
                            Enter your Mobile Number
                          </h3>

                          <p className="mobile-section-p">
                            We will send you a one-time password (OTP) to verify your identity.
                          </p>

                          <LoginForm
                            mode="otp"
                            isOTPSent={isOTPSent}
                            setIsOTPSent={setIsOTPSent}
                            setIsForgotPassword={setIsForgotPassword}
                            setIsAccountInactive={setIsAccountInactive}
                            recaptchaToken={null}
                            onLoginSuccess={handleLoginSuccess}
                          />
                        </div>

                        {isOTPSent && (
                          <>
                            <div className="otp-divider">
                              <span>and continue with</span>
                            </div>

                            <OtpVerification
                              setIsOTPSent={setIsOTPSent}
                              setIsAccountInactive={setIsAccountInactive}
                              handleOTPVerification={handleOTPVerification}
                              onLoginSuccess={handleLoginSuccess}
                            />
                          </>
                        )}
                      </>
                    )}

                    {loginMode === "password" && (
                      <div className="login-captcha-container">
                        <ReCAPTCHA
                          sitekey={SITE_KEY}
                          onChange={(token) => setRecaptchaToken(token)}
                          onExpired={() => setRecaptchaToken(null)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="login-footer-section">
                    <div className="signup-hint">
                      Don't have an account? <Link to="/register">Sign up</Link>
                    </div>

                    {loginMode === "password" && (
                      <div className="help-card">
                        <div className="help-icon">
                          <img src={LoginEarphone} alt="" className="help-earphone-icon" />
                        </div>
                        <div className="help-content">
                          <span className="help-title">Need help?</span>
                          <span className="help-subtitle">
                            For any support write to{" "}
                            <a href="mailto:contact@thedal.co.in">contact@thedal.co.in</a>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mobile-footer-text">
                      © Thedal App India Limited. All Rights Reserved.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="fixed-footer">
          © Thedal App India Limited. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;

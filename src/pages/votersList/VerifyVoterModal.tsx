import { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Space,
  message,
  Progress,
  Input,
  Form,
  Alert,
  Steps,
  Result,
  Tooltip
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  LockOutlined,
  WarningOutlined,
  MobileOutlined
} from "@ant-design/icons";
import axios from "axios";
import { checkMemberByEpicNumber } from "../../api/memberApi"; // Membership verification API
import {
  updateVoterApi,
  invokeMobileOtpApi,
  verifyMobileOtpApi,
  saveAadhaarDataApi
} from "../../api/voterApi"; // Updated voter API functions

// Updated API endpoints for Aadhaar verification using your backend
const AADHAAR_API = {
  sendOtpUrl: "https://aadhaar-cashfree-node-production.up.railway.app/send-otp",
  verifyUrl: "https://aadhaar-cashfree-node-production.up.railway.app/verify"
};

interface VerifyVoterModalProps {
  visible: boolean;
  onClose: () => void;
  voter?: {
    id?: number;
    electionId?: number;
    epic_number?: string;
    aadhaarNumber?: string;
    mobileNo?: string;
    first_name?: string;
    last_name?: string;
    membershipNumber?: string;
    partyRegistrationNumber?: string;
    aadhaarVerified?: boolean;
    mobileVerified?: boolean;
    memberVerified?: boolean;
    voterFnameEn?: string;
    voterLnameEn?: string;
    // ... other voter fields ...
    age?: any;
    panNumber?: string;
    email?: string;
    photo_url?: string;
    booth_number?: number;
    sub_caste?: string;
  };
  selectedElectionId?: number;
}

// Verification status types
type VerificationStatus = "success" | "warning" | "error" | "pending" | null;

const VerifyVoterModal = ({
  visible,
  onClose,
  voter,
  selectedElectionId
}: VerifyVoterModalProps) => {
  // State for each verification type
  const [aadhaarStatus, setAadhaarStatus] = useState<VerificationStatus>(null);
  const [membershipStatus, setMembershipStatus] = useState<VerificationStatus>(null);
  const [mobileStatus, setMobileStatus] = useState<VerificationStatus>(null);

  // Loading states
  const [aadhaarLoading, setAadhaarLoading] = useState<boolean>(false);
  const [membershipLoading, setMembershipLoading] = useState<boolean>(false);
  const [mobileLoading, setMobileLoading] = useState<boolean>(false);

  // Overall verification progress
  const [verificationProgress, setVerificationProgress] = useState<number>(0);

  // Aadhaar verification states
  const [aadhaarVerifyModalVisible, setAadhaarVerifyModalVisible] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [refId, setRefId] = useState<string>("");
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(voter?.aadhaarNumber || "");
  const [otp, setOtp] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [isLeavingPage, setIsLeavingPage] = useState<boolean>(false);

  // Mobile OTP states
  const [mobileOtpModalVisible, setMobileOtpModalVisible] = useState<boolean>(false);
  const [mobileOtp, setMobileOtp] = useState<string>("");
  const [mobileOtpSent, setMobileOtpSent] = useState<boolean>(false);
  const [mobileOtpError, setMobileOtpError] = useState<string>("");
  const [mobileCurrentStep, setMobileCurrentStep] = useState<number>(0);
  const [mobileVerificationSuccess, setMobileVerificationSuccess] = useState<boolean>(false);

  // Form references
  const [form] = Form.useForm();
  const [mobileForm] = Form.useForm();
  const otpInputRef = useRef<Input>(null);
  const mobileOtpInputRef = useRef<Input>(null);

  // When modal opens, initialize verification statuses and Aadhaar number
  useEffect(() => {
    if (visible && voter) {
      setAadhaarStatus(voter?.aadhaarVerified === true ? "success" : null);
      setMobileStatus(voter?.mobileVerified === true ? "success" : null);
      setMembershipStatus(voter?.memberVerified === true ? "success" : null);
      setAadhaarNumber(voter?.aadhaarNumber || "");
      console.log("Modal opened with:", {
        voter,
        selectedElectionId,
        aadhaarVerified: voter?.aadhaarVerified,
        mobileVerified: voter?.mobileVerified,
        memberVerified: voter?.memberVerified
      });
    }
  }, [visible, voter, selectedElectionId]);

  // Update overall verification progress
  useEffect(() => {
    if (!visible) return;
    let progress = 0;
    let totalItems = 0;
    totalItems++; // Aadhaar
    if (aadhaarStatus === "success") progress++;
    totalItems++; // Membership
    if (membershipStatus === "success") progress++;
    if (voter?.mobileNo) {
      totalItems++; // Mobile (if available)
      if (mobileStatus === "success") progress++;
    }
    const percentage = totalItems > 0 ? Math.round((progress / totalItems) * 100) : 0;
    setVerificationProgress(percentage);
  }, [aadhaarStatus, membershipStatus, mobileStatus, visible, voter]);

  // Reset Aadhaar verification when modal closes
  useEffect(() => {
    if (!aadhaarVerifyModalVisible) {
      resetAadhaarVerification();
    }
  }, [aadhaarVerifyModalVisible]);

  // Reset Mobile verification when modal closes
  useEffect(() => {
    if (!mobileOtpModalVisible) {
      resetMobileVerification();
    }
  }, [mobileOtpModalVisible]);

  // Focus OTP input after Aadhaar OTP is sent
  useEffect(() => {
    if (isOtpSent && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [isOtpSent]);

  // Focus Mobile OTP input after Mobile OTP is sent
  useEffect(() => {
    if (mobileOtpSent && mobileOtpInputRef.current) {
      setTimeout(() => {
        mobileOtpInputRef.current?.focus();
      }, 100);
    }
  }, [mobileOtpSent]);

  // Reset Aadhaar verification state
  const resetAadhaarVerification = () => {
    setIsOtpSent(false);
    setOtp("");
    setRefId("");
    setCurrentStep(0);
    setIsVerifying(false);
    setVerificationError("");
    setVerificationSuccess(false);
    setVerificationData(null);
    form.resetFields();
  };

  // Reset Mobile verification state
  const resetMobileVerification = () => {
    setMobileOtp("");
    setMobileOtpSent(false);
    setMobileCurrentStep(0);
    setMobileOtpError("");
    setMobileVerificationSuccess(false);
    mobileForm.resetFields();
  };

  // Show Aadhaar verification modal
  const handleAadhaarVerify = () => {
    if (!voter?.aadhaarNumber) {
      message.error("Aadhaar number not available in voter data");
      return;
    }
    setAadhaarVerifyModalVisible(true);
    setAadhaarNumber(voter.aadhaarNumber || "");
  };

  // Request OTP for Aadhaar verification using your backend API
  const handleRequestOtp = async () => {
    try {
      setIsVerifying(true);
      setVerificationError("");
      const response = await axios.post(
        AADHAAR_API.sendOtpUrl,
        { aadhaar_number: aadhaarNumber }
      );
      if (response.data.status === "SUCCESS") {
        setIsOtpSent(true);
        setRefId(response.data.ref_id);
        setCurrentStep(1);
        message.success("OTP sent successfully");
      } else {
        setVerificationError(response.data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("OTP request error:", error);
      setVerificationError(
        error.response?.data?.message || "Failed to request OTP. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify Aadhaar OTP using your backend API
  const handleVerifyOtp = async () => {
    try {
      setIsVerifying(true);
      setVerificationError("");
      const response = await axios.post(
        AADHAAR_API.verifyUrl,
        { otp, ref_id: refId }
      );
      if (response.data.status === "VALID") {
        setVerificationSuccess(true);
        setCurrentStep(2);
        console.log("Verified info data",response.data);
        setVerificationData(response.data);
        setAadhaarStatus("success");
        message.success("Aadhaar verification successful");
      } else {
        setVerificationError(response.data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setVerificationError(
        error.response?.data?.message || "OTP verification failed. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

    // Updated Aadhaar verification continue function
const handleContinueVerification = async () => {
  try {
    if (!voter || !voter.epic_number) {
      message.error("Voter information is incomplete");
      return;
    }

    // Get the election ID from props or voter data
    const electionId = selectedElectionId || voter?.electionId;
    if (!electionId) {
      message.error("Election ID not available");
      return;
    }
    let data ={aadhaarNumber,...verificationData};
    
    // First, save the Aadhaar verification data to the backend
    try {
      await saveAadhaarDataApi(electionId, data);
      console.log("Aadhaar verification data saved successfully");
    } catch (aadhaarSaveError) {
      console.error("Error saving Aadhaar verification data:", aadhaarSaveError);
      message.warning("Aadhaar verification was successful, but we couldn't save the verification data");
    }
    
    // Prepare voter data for update
    const sanitizedData = { ...voter };
    if (sanitizedData.age && isNaN(parseInt(sanitizedData.age))) {
      sanitizedData.age = 0;
    }
    
    const updateData = {
      ...sanitizedData,
      aadhaarVerified: true
    };
    console.log("updateData inside save aadhaar",updateData);
    
    // Update the voter record with aadhaarVerified=true
    await updateVoterApi(
      voter.epic_number,
      electionId,
      updateData
    );
    
    setAadhaarStatus("success");
    setAadhaarVerifyModalVisible(false);
    message.success("Aadhaar verification information has been saved");
  } catch (error) {
    console.error("Error saving Aadhaar verification status:", error);
    message.error("Failed to save Aadhaar verification status");
  }
};

  // ----- Mobile OTP Flow -----
  // Invoke mobile OTP API using the voter API function
  const handleMobileVerify = async () => {
    if (!voter?.mobileNo) {
      message.error("Mobile number not available");
      return;
    }
    
    // Open the modal first
    setMobileOtpModalVisible(true);
    setMobileCurrentStep(0);
    setMobileOtpSent(false);
  };

// Request OTP for mobile verification
const handleRequestMobileOtp = async () => {
  if (!voter?.mobileNo) {
    setMobileOtpError("Mobile number not available");
    return;
  }

  setMobileLoading(true);
  setMobileOtpError("");
  
  try {
    const electionId = selectedElectionId || voter?.electionId;
    if (!electionId) {
      throw new Error("Election ID not available");
    }
    
    console.log("Requesting OTP for mobile:", voter.mobileNo, "Election ID:", electionId);
    
    const response = await invokeMobileOtpApi(voter.mobileNo, electionId);
    console.log("Mobile OTP response:", response);

    // Check the structure of the response - it directly contains success field
    if (response.success) {
      setMobileOtp("");
      setMobileOtpSent(true);
      setMobileCurrentStep(1);
      setTimeout(() => {
        if (mobileOtpInputRef.current) {
          mobileOtpInputRef.current.focus();
        }
      }, 100);
      message.success("OTP sent to mobile number");
    } else {
      setMobileOtpError(response.message || "Failed to send OTP");
    }
  } catch (error: any) {
    console.error("Error invoking mobile OTP:", error);
    setMobileOtpError(error.message || "Failed to send OTP");
  } finally {
    setMobileLoading(false);
  }
};
   
    // Fixed Mobile OTP verification function with data sanitization
const handleVerifyMobileOtp = async () => {
  if (!mobileOtp) {
    setMobileOtpError("Please enter the OTP");
    return;
  }
  
  setMobileLoading(true);
  setMobileOtpError("");
  
  try {
    const electionId = selectedElectionId || voter?.electionId;
    if (!electionId) {
      throw new Error("Election ID not available");
    }
    
    console.log("Verifying OTP:", mobileOtp, "for mobile:", voter?.mobileNo, "Election ID:", electionId);
    
    const response = await verifyMobileOtpApi(voter.mobileNo, mobileOtp, electionId);
    console.log("Verification response:", response);
    
    // Use response.success instead of response.status
    if (response.success === true) {
      // Update the success state
      setMobileVerificationSuccess(true);
      setMobileCurrentStep(2);
      
      try {
        // Create a sanitized copy of the voter object
        const sanitizedVoter = { ...voter };
        
        // Sanitize numeric fields - convert "No Data" strings to appropriate number values (0 or null)
        // These are common fields that might contain the "No Data" string
        const numericFields = [
          'age', 'booth_number', 'partNo', 'sectionNo', 'serialNo', 'urbanNo', 'urbanWardNo',
          'rurDistrictUnionNo', 'rurDistrictUnionWardNo', 'panUnionNo', 'panUnionWardNo',
          'villPanNo', 'villPanWardNo'
        ];
        
        // Replace "No Data" with 0 for all numeric fields
        numericFields.forEach(field => {
          if (sanitizedVoter[field] === "No Data" || sanitizedVoter[field] === "No data") {
            sanitizedVoter[field] = 0;
          } else if (typeof sanitizedVoter[field] === 'string' && sanitizedVoter[field] && !isNaN(parseInt(sanitizedVoter[field]))) {
            // If it's a numeric string, convert it to number
            sanitizedVoter[field] = parseInt(sanitizedVoter[field]);
          }
        });
        
        // IMPORTANT FIX: Pass the electionId as the second parameter to updateVoterApi
        await updateVoterApi(
          voter.epic_number,
          electionId,
          { ...sanitizedVoter, mobileVerified: true }
        );
        
        // Update the main modal status
        setMobileStatus("success");
        message.success("Mobile number verified successfully");
      } catch (updateError) {
        console.error("Error updating voter verified status:", updateError);
        message.warning(
          "OTP verification was successful, but we couldn't update your profile. Please try again."
        );
      }
    } else {
      setMobileOtpError(response.message || "OTP verification failed");
    }
  } catch (error: any) {
    console.error("Error verifying mobile OTP:", error);
    setMobileOtpError(error.message || "OTP verification failed");
  } finally {
    setMobileLoading(false);
  }
};    

  // Complete mobile verification and close the modal
  const handleMobileVerificationComplete = () => {
    setMobileOtpModalVisible(false);
  };

  // Fixed Membership verification function
const handleMembershipVerify = async () => {
  console.log("Membership Verify clicked");
  if (!voter?.epic_number) {
    message.error("Epic Number not available for verification");
    return;
  }
  setMembershipLoading(true);
  try {
    const electionId = selectedElectionId || voter?.electionId;
    if (!electionId) throw new Error("Election ID not available");
    
    const response = await checkMemberByEpicNumber(electionId, voter.epic_number);
    if (response?.data?.status === "success" && response.data.data) {
      try {
        const membershipData = response.data.data;
        const updateData = { 
          ...voter, 
          memberVerified: true,
          membershipNumber: membershipData.membershipNo || membershipData.partyRegistrationNumber || "",
          partyRegistrationNumber: membershipData.membershipNo || membershipData.partyRegistrationNumber || voter?.partyRegistrationNumber || ""
        };
        if (updateData.age && (isNaN(parseInt(updateData.age)) || typeof updateData.age === 'string')) {
          updateData.age = 0;
        }
        
        // IMPORTANT FIX: Pass electionId as the second parameter
        await updateVoterApi(
          voter.epic_number,
          electionId,  // Add this parameter to match the API signature
          updateData
        );
        
        setMembershipStatus("success");
        message.success("Membership verified successfully!");
      } catch (updateError) {
        console.error("Error updating membership:", updateError);
        message.error("Failed to update membership status");
      }
    } else {
      message.error("Not a member. Membership verification failed.");
      setMembershipStatus("error");
    }
  } catch (error) {
    console.error("Membership verification error:", error);
    setMembershipStatus("error");
    message.error("Membership verification failed. Please try again.");
  } finally {
    setMembershipLoading(false);
  }
};

  // ----- Helper for Button Text -----
  const getButtonText = (status: VerificationStatus, loading: boolean) => {
    if (loading) return "Verifying...";
    switch (status) {
      case "success":
        return "Verified";
      case "warning":
        return "Pending";
      case "error":
        return "Verify Again";
      default:
        return "Verify";
    }
  };

  // Confirm close for Aadhaar modal during in-progress verification
  const handleCloseAadhaarModal = () => {
    if (isOtpSent && !verificationSuccess) {
      setIsLeavingPage(true);
    } else {
      setAadhaarVerifyModalVisible(false);
    }
  };

  // Confirm close for Mobile OTP modal during in-progress verification
  const handleCloseMobileModal = () => {
    if (mobileOtpSent && !mobileVerificationSuccess) {
      // Show confirmation dialog or proceed directly
      setMobileOtpModalVisible(false);
    } else {
      setMobileOtpModalVisible(false);
    }
  };

  // Handlers for confirmation modal when leaving mid-verification
  const handleConfirmLeave = () => {
    setIsLeavingPage(false);
    setAadhaarVerifyModalVisible(false);
  };
  const handleCancelLeave = () => {
    setIsLeavingPage(false);
  };

  // ----- Render Functions -----
  // Render Aadhaar form
  const renderAadhaarForm = () => {
    return (
      <Form form={form} layout="vertical" onFinish={handleRequestOtp}>
        <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-100">
          <div className="font-medium text-blue-800 mb-1">Aadhaar Verification</div>
          <div className="text-blue-700">
            We'll send an OTP to the mobile number linked with your Aadhaar 
            <span className="font-medium"> {aadhaarNumber ? `${aadhaarNumber.substring(0, 4)}...${aadhaarNumber.substring(8)}` : ""}</span>
          </div>
        </div>
        {verificationError && !isOtpSent && (
          <Alert message={verificationError} type="error" className="mb-4" />
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isVerifying} disabled={isOtpSent} block>
            Request OTP
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // Render Aadhaar OTP verification form
  const renderOtpForm = () => {
    return (
      <Form layout="vertical" onFinish={handleVerifyOtp}>
        <div className="mb-4">
          <Alert type="info" message={`OTP has been sent to the mobile number linked to Aadhaar ${aadhaarNumber ? `${aadhaarNumber.substring(0, 4)}...${aadhaarNumber.substring(8)}` : ""}`} />
        </div>
        <Form.Item label="Enter OTP" name="otp" rules={[{ required: true, message: "Please enter the OTP" }]}>
          <Input
            ref={otpInputRef}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            prefix={<LockOutlined />}
          />
        </Form.Item>
        {verificationError && (
          <Alert message={verificationError} type="error" className="mb-4" />
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isVerifying} block>
            Verify OTP
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // Render Aadhaar verification success screen with a "Continue" button
  const renderVerificationSuccess = () => {
    if (!verificationData) return null;
    return (
      <Result
        status="success"
        title="Aadhaar Verification Successful"
        subTitle={`Verified ${verificationData.name} with Aadhaar ending in ${aadhaarNumber ? aadhaarNumber.substring(8) : ""}`}
        extra={[
          <Button type="primary" onClick={handleContinueVerification} key="continue">
            Continue
          </Button>
        ]}
      >
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
          <h4 className="font-medium mb-2">Verified Information</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-500">Name</div>
              <div>{verificationData.name}</div>
            </div>
            <div>
              <div className="text-gray-500">Gender</div>
              <div>{verificationData.gender === "M" ? "Male" : "Female"}</div>
            </div>
            <div>
              <div className="text-gray-500">Date of Birth</div>
              <div>{verificationData.dob}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">Address</div>
              <div>{verificationData.address}</div>
            </div>
          </div>
        </div>
      </Result>
    );
  };

  // Render mobile OTP request form
  const renderMobileOtpRequestForm = () => {
    return (
      <Form form={mobileForm} layout="vertical" onFinish={handleRequestMobileOtp}>
        <div className="bg-green-50 p-3 rounded mb-4 border border-green-100">
          <div className="font-medium text-green-800 mb-1">Mobile Verification</div>
          <div className="text-green-700">
            We'll send an OTP to your mobile number
            <span className="font-medium"> {voter?.mobileNo ? `${voter.mobileNo.substring(0, 2)}***${voter.mobileNo.substring(voter.mobileNo.length - 2)}` : ""}</span>
          </div>
        </div>
        
        {/* Message to show after OTP is sent */}
        {mobileOtpSent && (
          <Alert 
            message="OTP sent successfully to voter." 
            type="success" 
            className="mb-4" 
            showIcon
          />
        )}
        
        {mobileOtpError && (
          <Alert message={mobileOtpError} type="error" className="mb-4" />
        )}
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={mobileLoading} 
            block
          >
            {mobileOtpSent ? "Resend OTP" : "Request OTP"}
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // Render mobile OTP verification form
  const renderMobileOtpVerificationForm = () => {
    return (
      <Form layout="vertical" onFinish={handleVerifyMobileOtp}>
        <div className="mb-4">
          <Alert type="info" message={`OTP has been sent to your mobile number ${voter?.mobileNo ? `${voter.mobileNo.substring(0, 2)}***${voter.mobileNo.substring(voter.mobileNo.length - 2)}` : ""}`} />
        </div>
        <Form.Item label="Enter OTP" name="mobileotp" rules={[{ required: true, message: "Please enter the OTP" }]}>
          <Input
            ref={mobileOtpInputRef}
            placeholder="Enter OTP"
            maxLength={6}
            value={mobileOtp}
            onChange={(e) => setMobileOtp(e.target.value)}
            prefix={<LockOutlined />}
          />
        </Form.Item>
        {mobileOtpError && (
          <Alert message={mobileOtpError} type="error" className="mb-4" />
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mobileLoading} block>
            Verify OTP
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // Render mobile verification success screen
  const renderMobileVerificationSuccess = () => {
    return (
      <Result
        status="success"
        title="Mobile Verification Successful"
        subTitle={`Verified mobile number ending in ${voter?.mobileNo ? voter.mobileNo.substring(voter.mobileNo.length - 4) : ""}`}
        extra={[
          <Button type="primary" onClick={handleMobileVerificationComplete} key="continue">
            Continue
          </Button>
        ]}
      />
    );
  };

  // Render verification steps for Aadhaar flow
  const renderSteps = () => {
    return (
      <Steps
        current={currentStep}
        className="mb-6"
        items={[
          { title: "Enter Aadhaar", description: "Provide your number" },
          { title: "Verify OTP", description: "Enter the OTP sent" },
          { title: "Complete", description: "Verification complete" }
        ]}
      />
    );
  };

  // Render verification steps for Mobile flow
  const renderMobileSteps = () => {
    return (
      <Steps
        current={mobileCurrentStep}
        className="mb-6"
        items={[
          { title: "Request OTP", description: "Send OTP to your mobile" },
          { title: "Verify OTP", description: "Enter the OTP received" },
          { title: "Complete", description: "Verification complete" }
        ]}
      />
    );
  };

  // Render active Aadhaar step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderAadhaarForm();
      case 1:
        return renderOtpForm();
      case 2:
        return renderVerificationSuccess();
      default:
        return null;
    }
  };

  // Render active Mobile step content
  const renderMobileStepContent = () => {
    switch (mobileCurrentStep) {
      case 0:
        return renderMobileOtpRequestForm();
      case 1:
        return renderMobileOtpVerificationForm();
      case 2:
        return renderMobileVerificationSuccess();
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center">
            <UserOutlined className="mr-2" />
            <span>Verify Voter: {voter?.voterFnameEn || ""} {voter?.voterLnameEn || ""}</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={500}
        footer={[<Button key="cancel" onClick={onClose}>Close</Button>]}
        closeIcon={<span className="text-xl">×</span>}
      >
        <div className="mb-6">
          <div className="text-gray-500 mb-1">Verification Progress</div>
          <Progress percent={verificationProgress} status={verificationProgress === 100 ? "success" : "active"} strokeColor="#4CAF50" trailColor="#E0E0E0" />
        </div>
        <div className="mb-4 ml-1 text-gray-600 font-medium">Identity Documents</div>
        <Space direction="vertical" className="w-full" size="middle">
          {/* Aadhaar Verification Section */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-md mr-3">
                <span className="text-sm font-medium">A#</span>
              </div>
              <div>
                <div className="font-medium">Aadhaar Number</div>
                <div className="text-gray-500">
                  {voter?.aadhaarNumber ? `${voter.aadhaarNumber.substring(0, 4)}...${voter.aadhaarNumber.substring(8)}` : "Not Available"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aadhaarStatus === "success" && <CheckCircleOutlined style={{ color: "#4CAF50" }} />}
              {voter?.aadhaarNumber ? (
                <Button
                  type={aadhaarStatus === "success" ? "default" : "primary"}
                  onClick={handleAadhaarVerify}
                  disabled={aadhaarLoading || aadhaarStatus === "success"}
                  loading={aadhaarLoading}
                  className="min-w-20"
                >
                  {getButtonText(aadhaarStatus, aadhaarLoading)}
                </Button>
              ) : (
                <Tooltip title="Update Aadhaar number in voter data to enable verification">
                  <Button type="default" disabled className="min-w-20">Not Available</Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Membership Verification Section */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-md mr-3">
                <UserOutlined />
              </div>
              <div>
                <div className="font-medium">Membership Number</div>
                <div className="text-gray-500">
                  {voter?.partyRegistrationNumber || voter?.membershipNumber || "N/A"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {membershipStatus === "success" ? (
                <CheckCircleOutlined style={{ color: "#4CAF50" }} />
              ) : membershipStatus === "error" ? (
                <span className="text-red-500 text-xs mr-1">Not a Member</span>
              ) : null}
              {voter?.epic_number ? (
                <Button
                  type={membershipStatus === "success" ? "default" : "primary"}
                  onClick={() => {
                    console.log("Membership Verify clicked");
                    handleMembershipVerify();
                  }}
                  disabled={membershipLoading || membershipStatus === "success"}
                  loading={membershipLoading}
                  className="min-w-20"
                  danger={membershipStatus === "error"}
                >
                  {getButtonText(membershipStatus, membershipLoading)}
                </Button>
              ) : (
                <Tooltip title="Epic Number required for membership verification">
                  <Button type="default" disabled className="min-w-20">Not Available</Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Mobile Verification Section */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-md mr-3">
                <MobileOutlined />
              </div>
              <div>
                <div className="font-medium">Mobile Number</div>
                <div className="text-gray-500">
                  {voter?.mobileNo ? `${voter.mobileNo.substring(0, 2)}***${voter.mobileNo.substring(voter.mobileNo.length - 2)}` : "N/A"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mobileStatus === "success" && <CheckCircleOutlined style={{ color: "#4CAF50" }} />}
              <Button
                type={mobileStatus === "success" ? "default" : "primary"}
                onClick={handleMobileVerify}
                disabled={!voter?.mobileNo || mobileLoading || mobileStatus === "success"}
                loading={mobileLoading}
                className="min-w-20"
              >
                {getButtonText(mobileStatus, mobileLoading)}
              </Button>
            </div>
          </div>
        </Space>

        {verificationProgress === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
            <CheckCircleOutlined className="mr-2" />
            All verifications complete! This voter's identity has been fully verified.
          </div>
        )}
      </Modal>

      {/* Aadhaar Verification Modal */}
      <Modal
        title="Aadhaar Verification"
        visible={aadhaarVerifyModalVisible}
        onCancel={handleCloseAadhaarModal}
        footer={null}
        width={600}
        maskClosable={false}
        className={isOtpSent && !verificationSuccess ? "verification-in-progress" : ""}
        closeIcon={<span className="text-xl">×</span>}
      >
        {renderSteps()}
        {renderStepContent()}
      </Modal>

      {/* Mobile OTP Modal */}
      <Modal
        title="Mobile Verification"
        visible={mobileOtpModalVisible}
        onCancel={handleCloseMobileModal}
        footer={null}
        width={600}
        maskClosable={false}
        closeIcon={<span className="text-xl">×</span>}
      >
        {renderMobileSteps()}
        {renderMobileStepContent()}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center text-orange-500">
            <WarningOutlined className="mr-2" />
            <span>Verification in Progress</span>
          </div>
        }
        visible={isLeavingPage}
        onCancel={handleCancelLeave}
        footer={[
          <Button key="back" onClick={handleCancelLeave}>
            Continue Verification
          </Button>,
          <Button key="submit" danger onClick={handleConfirmLeave}>
            Leave Anyway
          </Button>
        ]}
      >
        <p>You have a verification process in progress. If you leave now, you'll need to start over.</p>
        <p>Are you sure you want to leave?</p>
      </Modal>
    </>
  );
};

export default VerifyVoterModal;
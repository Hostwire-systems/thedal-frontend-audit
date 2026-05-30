// FamilyMappingOtpVerification.tsx
import React, { useState } from 'react';
import { Modal, Input, Button, Form, message, Typography } from 'antd';

const { Text } = Typography;

interface FamilyMappingOtpVerificationProps {
  visible: boolean;
  onCancel: () => void;
  onVerify: (otp: string) => Promise<void>;
  mobileNumber: string;
  loading: boolean;
}

const FamilyMappingOtpVerification: React.FC<FamilyMappingOtpVerificationProps> = ({
  visible,
  onCancel,
  onVerify,
  mobileNumber,
  loading,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      message.error('Please enter a valid 6-digit OTP.');
      return;
    }

    await onVerify(otpValue);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedData)) {
      const otpArray = pastedData.split('').slice(0, 6);
      setOtp(otpArray);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Verify OTP</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
      closable={true}
      maskClosable={false}
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text>
            Enter the 6-digit OTP sent to your mobile number ending with {mobileNumber.slice(-4)}
          </Text>
        </div>

        <Form onFinish={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-input-${index}`}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength={1}
                style={{
                  width: '40px',
                  height: '40px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
                autoComplete="off"
                inputMode="numeric"
                pattern="\d*"
              />
            ))}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: '#1D4ED8',
              borderColor: '#1D4ED8',
            }}
          >
            Verify OTP
          </Button>
        </Form>
      </div>
    </Modal>
  );
};

export default FamilyMappingOtpVerification;
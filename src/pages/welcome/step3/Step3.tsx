import React, { useEffect } from "react";
import { Form, Input, Select } from "antd";
import SubmitButton from "../SubmitButton";

const { TextArea } = Input;
const { Option } = Select;

interface Step3Props {
  onFinish: (values: any, isSkipped?: boolean) => void;
  isUpdating: boolean;
}

export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Assam",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Delhi",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort();
const Step3: React.FC<Step3Props> = ({ onFinish, isUpdating }) => {
  const [form] = Form.useForm();
  useEffect(() => {
    const storedUserProfile = localStorage.getItem('userProfile');
    if (storedUserProfile) {
      const parsedUserProfile = JSON.parse(storedUserProfile);
      form.setFieldsValue({
        billingAddress: parsedUserProfile.billingAddress,
        country: 'IN', // Set India as default
        state: parsedUserProfile.state,
        pincode: parsedUserProfile.pincode,
        gst: parsedUserProfile.gst,
        subscription: 'Free for 30 days', // Set Free as default
      });
    } else {
      // If no stored data, still set defaults
      form.setFieldsValue({
        country: "IN",
        subscription: "Free for 30 days",
      });
    }
  }, [form]);

  const handleFinish = (values: any) => {
    onFinish(values, false);
  };

  const handleSkip = () => {
    onFinish({}, true);
  };

  return (
    <div>
      <h2 className="font-bold text-[31px] leading-8">
        Step 2: Billing Information
      </h2>
      <Form
        form={form}

        name="billing_form"
        layout="vertical"
        onFinish={handleFinish}
        className="mt-8"
      >
        {/* Billing Address */}
        <Form.Item
          label="Billing Address"
          name="billingAddress"
          rules={[
            { required: true, message: "Please input your Billing Address!" },
          ]}
        >
          <TextArea
            placeholder="Billing Address"
            className="input-element"
            rows={3}
          />
        </Form.Item>

        {/* Country Dropdown */}
        <Form.Item
          label="Country"
          name="country"
          rules={[{ required: true, message: "Please select your Country!" }]}
        >
          <Select placeholder="Select Country" className="input-element" disabled>
            <Option value="IN">India</Option>
          </Select>
        </Form.Item>

        {/* State Dropdown */}
        <Form.Item
          label="State"
          name="state"
          rules={[{ required: true, message: "Please select your State!" }]}
        >
          <Select showSearch placeholder="Select State" className="input-element custom-select cursor-pointer">
            {
              indianStates.map((state)=>{
                return (<Option value={state} key={state} >{state}</Option>)
              })
            }
            {/* Add more states as needed */}
          </Select>
        </Form.Item>

        {/* Pincode */}
        <Form.Item
          label="Pincode"
          name="pincode"
          rules={[
            { required: true, message: "Please input your Pincode!" },
            { pattern: /^[0-9]{6}$/, message: "Pincode must be exactly 6 digits!" },
          ]}
        >
          <Input
            placeholder="Pincode"
            inputMode="numeric"
            maxLength={6}
            className="input-element"
            pattern="\d*"
          />
        </Form.Item>

        {/* GST (Optional) */}
        <Form.Item
          label="GST (Optional)"
          name="gst"
          rules={[
            { pattern: /^[A-Za-z0-9]+$/, message: "GST should not contain symbols!" },
          ]}
        >
          <Input
            placeholder="GST Number (Optional)"
            className="input-element"
          />
        </Form.Item>

        {/* Subscription Dropdown */}
        <Form.Item
          label="Subscription Plan"
          name="subscription"
          rules={[
            { required: true, message: "Please select your Subscription Plan!" },
          ]}
        >
          <Select placeholder="Select Subscription" className="input-element" disabled>
            <Option value="FREE">Free</Option>
          </Select>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <SubmitButton
          step="step3"
            loading={isUpdating}
            onSkip={handleSkip}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default Step3;

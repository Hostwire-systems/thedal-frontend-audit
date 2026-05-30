import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { indianStates } from "../welcome/step3/Step3";
import { useSelector } from "react-redux";

const { TextArea } = Input;
const { Option } = Select;

const BillingInformation = ({ form, handleFinish,isLoading,setIsLoading }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const handleButtonClick = async () => {
    if (isEditMode) {
      setIsLoading(true);
      try {
        await form.validateFields();
        form.submit();
        setIsEditMode(false); // Disable editing after submission
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    } else {
      setIsEditMode(true); //Enable editing
    }
  };

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await handleFinish(values, 2); // Pass form data to handleFinish
      setIsEditMode(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating billing information", error);
      setIsLoading(false);
    } finally {
    }
  };

  useEffect(() => {
    const storedUserProfile = localStorage.getItem("userProfile");
    if (storedUserProfile) {
      const parsedUserProfile = JSON.parse(storedUserProfile);
      form.setFieldsValue({
        billingAddress: parsedUserProfile.billingAddress,
        country: "IN", // Set India as default
        state: parsedUserProfile.state,
        pincode: parsedUserProfile.pincode,
        gst: parsedUserProfile.gst,
        subscription: "Free for 30 days", // Set Free as default
      });
    } else {
      // If no stored data, still set defaults
      form.setFieldsValue({
        country: "IN",
        subscription: "Free for 30 days",
      });
    }
  }, [form]);

  return (
    <div>
      <h2 className="font-bold text-[20px] leading-8">Billing Information</h2>
      <Button
        onClick={handleButtonClick}
        className={`absolute top-6 right-4 py-2 px-4 rounded-lg
    !bg-[#1D4ED8] !hover:bg-[#1E40AF] hover:opacity-70 !text-white z-10
     disabled:cursor-not-allowed`}
        loading={isLoading}
        disabled={
          isLoading ||
          (!isSuperAdminOrAdmin && !hasUpdatePermission("userProfile"))
        }
      >
        {isEditMode || isLoading ? "Submit" : "Edit"}
      </Button>

      <div className="relative mt-8">
        <Form
          form={form}
          name="billing_form"
          layout="vertical"
          onFinish={onFinish}
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
              style={{ width: "100%", maxWidth: "20rem" }}
              rows={3}
              cols={12}
              disabled={!isEditMode}
            />
          </Form.Item>

          {/* Country Dropdown */}
          <Form.Item
            label="Country"
            name="country"
            rules={[{ required: true, message: "Please select your Country!" }]}
          >
            <Select
              placeholder="Select Country"
              className="w-full max-w-xs"
              disabled
            >
              <Option value="IN">India</Option>
            </Select>
          </Form.Item>

          {/* State Dropdown */}
          <Form.Item
            label="State"
            name="state"
            rules={[{ required: true, message: "Please select your State!" }]}
          >
            <Select
              showSearch
              placeholder="Select State"
              disabled={!isEditMode}
              className="w-full max-w-xs cursor-pointer"
            >
              {indianStates.map((state) => {
                return (
                  <Option value={state} key={state}>
                    {state}
                  </Option>
                );
              })}
              {/* Add more states as needed */}
            </Select>
          </Form.Item>

          {/* Pincode */}
          <Form.Item
            label="Pincode"
            name="pincode"
            rules={[
              { required: true, message: "Please input your Pincode!" },
              {
                pattern: /^[0-9]{6}$/,
                message: "Pincode must be exactly 6 digits!",
              },
            ]}
          >
            <Input
              placeholder="Pincode"
              inputMode="numeric"
              maxLength={6}
              className="w-full max-w-xs"
              disabled={!isEditMode}
              pattern="\d*"
            />
          </Form.Item>

          {/* GST (Optional) */}
          <Form.Item
            label="GST (Optional)"
            name="gst"
            rules={[
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: "GST should not contain symbols!",
              },
            ]}
          >
            <Input
              placeholder="GST Number (Optional)"
              className="w-full max-w-xs"
              disabled={!isEditMode}
            />
          </Form.Item>

          {/* Subscription Dropdown */}
          <Form.Item
            label="Subscription Plan"
            name="subscription"
            rules={[
              {
                required: true,
                message: "Please select your Subscription Plan!",
              },
            ]}
          >
            <Select
              placeholder="Select Subscription"
              className="w-full max-w-xs"
              disabled
            >
              <Option value="FREE">Free</Option>
            </Select>
          </Form.Item>

          {/* Submit Button */}
        </Form>
      </div>
    </div>
  );
};

export default BillingInformation;

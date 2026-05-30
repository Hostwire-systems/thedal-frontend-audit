import { Modal, Form, Input, message, Button, AutoComplete } from "antd";
import { addFeedbackApi } from "../../api/feedbackApi";
import { useState } from "react";

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedbackAdded: (feedbackId: number) => void;
  selectedElectionId: number | string;
}

const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({
  isOpen,
  onClose,
  onFeedbackAdded,
  selectedElectionId,
}:AddFeedbackModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddFeedback = async (values: any) => {
    const payload = {
      issueName: values.issueName,
    };
    setLoading(true);

    try {
      const response = await addFeedbackApi(
        payload,
        parseInt(selectedElectionId)
      );
      console.log("Feedback added", response.data);

      message.success("Feedback issue added successfully");
      onFeedbackAdded(response.data?.id);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error adding feedback:", error);
      message.error("An error occurred while adding feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add Feedback Issue"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => handleAddFeedback(values))
          .catch((errorInfo) => {
            console.error("Validation Failed:", errorInfo);
          });
      }}
      okButtonProps={{
        style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        loading: loading,
        disabled: loading,
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Issue Name"
          name="issueName"
          rules={[{ required: true, message: "Please enter the issue name" }]}
        >
          <Input placeholder="Enter Issue name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddFeedbackModal;

import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Switch,
  Row,
  Col,
  Spin,
  message,
  Tag,
  Upload,
} from "antd";
import {
  TemplateData,
  updateTemplateDetailsApi,
  updateTemplateImageApi,
} from "../../api/electionApi";
import { TemplateCard } from "./TemplateCard";
import { UploadChangeParam } from "antd/es/upload";

interface EditTemplateModalProps {
  visible: boolean;
  onCancel: () => void;
  template: TemplateData | null;
  handleImageChange: (info: UploadChangeParam) => void;
  uploadedFile: File | null;
  electionId: string;
  onSuccess: () => void;
  previewImageUrl: string | null;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  visible,
  onCancel,
  uploadedFile,
  handleImageChange,
  previewImageUrl,
  template,
  electionId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(template?.isActive || true);
  const [isImageActive, setIsImageActive] = useState<boolean>(
    template?.imageStatus || true
  );

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        templateName: template.templateName,
        voterSlipHeader: template.voterSlipHeader,
        candidateInfoImageFooter: template.candidateInfoImageFooter,
        isActive: template.isActive,
        imageStatus: template.imageStatus,
      });
      setIsActive(template.isActive);
      setIsImageActive(template.imageStatus);
    }
  }, [template, form]);

  const handleSubmit = async (values: any) => {
    if (!template) return;

    try {
      setIsLoading(true);
      let payload = {
        templateName: values.templateName,
        voterSlipHeader: values.voterSlipHeader,
        candidateInfoImageFooter: values.candidateInfoImageFooter,
      };
      const response = await updateTemplateDetailsApi(
        electionId,
        template.templateName,
        payload
      );
      console.log("Response after updating details of template", response);
      if (uploadedFile) {
        await updateTemplateImageApi(
          electionId,
          values.templateName,
          uploadedFile
        );
      }
      message.success("Template updated successfully");
      onSuccess();
      onCancel();
    } catch (err) {
      console.error("Error updating template:", err);
      message.error("Failed to update template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Voter Slip"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            templateName: template?.templateName,
            voterSlipHeader: template?.voterSlipHeader,
            candidateInfoImageFooter: template?.candidateInfoImageFooter,
            isActive: template?.isActive,
            imageStatus: template?.imageStatus,
          }}
        >
          <Row gutter={24}>
            <Col span={14}>
              <Form.Item label="Voter Slip Header" name="voterSlipHeader">
                <Input placeholder="Enter voter slip header" />
              </Form.Item>

              <Form.Item
                label="Voter Slip Name"
                name="templateName"
                rules={[
                  { required: true, message: "Voter slip name is required" },
                ]}
              >
                <Input placeholder="Enter voter slip name" />
              </Form.Item>

              <Row>
                <Col span={12}>
                  <Form.Item label="Print Status">
                    <Tag color={isActive ? "green" : "red"}>
                      {isActive ? "Active" : "Inactive"}
                    </Tag>{" "}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Candidate Info Status">
                    <Tag color={isImageActive ? "green" : "red"}>
                      {isImageActive ? "Active" : "Inactive"}
                    </Tag>{" "}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Candidate Info Image Footer"
                name="candidateInfoImageFooter"
              >
                <Input placeholder="Enter candidate info image footer" />
              </Form.Item>
              <Form.Item
                colon={false}
                label={
                  <div style={{ textAlign: "left" }}>
                    <div className="font-semibold">
                      Upload Candidate Promo Image
                    </div>
                    <div className="mb-8">
                      (Dimension 2 inch width, Size less than 1MB)
                    </div>
                  </div>
                }
                wrapperCol={{ span: 24 }}
                style={{ display: "block", width: "100%" }}
              >
                <Upload
                  listType="picture-card"
                  fileList={
                    uploadedFile
                      ? [{ uid: "-1", name: uploadedFile.name, status: "done" }]
                      : []
                  }
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/jpg"
                >
                  {!uploadedFile && "+ Select File"}
                </Upload>
              </Form.Item>
            </Col>

            <Col span={10}>
              {template?.imageUrl && (
                <Col
                  span={24}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <TemplateCard
                    templateVariant={template.templateId}
                    candidateImage={previewImageUrl}
                  />
                </Col>
              )}
            </Col>
          </Row>

          <div style={{ textAlign: "right", marginTop: "16px" }}>
            <Button style={{ marginRight: "8px" }} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Update
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditTemplateModal;

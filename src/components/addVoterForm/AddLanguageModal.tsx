import { Modal, Form, Input, message, Button, AutoComplete } from "antd";
import { addLanguageApi, getCpanelLanguagesApi } from "../../api/languageApi";
import { useEffect, useState } from "react";

interface AddLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageAdded: (languageId: number) => void;
  selectedElectionId: number | string;
}

const AddLanguageModal: React.FC<AddLanguageModalProps> = ({
  isOpen,
  onClose,
  onLanguageAdded,
  selectedElectionId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [cpanelLanguages, setCpanelLanguages] = useState([]);
  const [options, setOptions] = useState([]);

  const fetchCpanelLanguages = async () => {
    setLoading(true);
    try {
      const response = await getCpanelLanguagesApi();
      const languageData = response.data.map((lang: any) => ({
        key: lang.id.toString(),
        id: lang.id,
        languageName: lang.languageName,
      }));
      setCpanelLanguages(languageData);
      console.log("languageData", languageData);
    } catch (error) {
      //message.error('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = async (values: any) => {
    const payload = {
      languageName: values.languageName,
    };
    setLoading(true);

    try {
      const response = await addLanguageApi(payload, selectedElectionId);
      console.log("Language added", response.data);
      onLanguageAdded(response.data?.id);
      if (response?.status === "success") {
        message.success(response?.message || "Language added successfully");
        onLanguageAdded(response.data?.id); // Callback to refresh language list or update state
        form.resetFields();
        onClose();
      } else {
        message.error(response?.message || "Failed to add language");
      }
    } catch (error) {
      console.error("Error adding language:", error);
      message.error("An error occurred while adding language.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsSearch = (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    // Filter languages based on the languageName property
    const filteredOptions = cpanelLanguages
      .filter((lang) =>
        lang?.languageName.toLowerCase().includes(value.toLowerCase())
      )
      .map((lang) => ({ value: lang?.languageName }));

    if (
      !cpanelLanguages.some(
        (lang) => lang?.languageName.toLowerCase() === value.toLowerCase()
      )
    ) {
      filteredOptions.push({
        value,
        label: (
          <span>
            Create new language:{" "}
            <span style={{ color: "#1D4ED8" }}>{value}</span>
          </span>
        ),
      });
    }

    setOptions(filteredOptions);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCpanelLanguages();
    }
  }, [isOpen]);

  return (
    <Modal
      title="Add Language"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => handleAddLanguage(values))
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
          label="Language Name"
          name="languageName"
          rules={[
            { required: true, message: "Please enter the language name" },
          ]}
        >
          <AutoComplete
            options={options}
            onSearch={handleOptionsSearch}
            placeholder="Enter Language name"
            filterOption={false} // Prevents default filtering, allowing us to control the behavior
          >
            <Input placeholder="Enter Language name" />
          </AutoComplete>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLanguageModal;

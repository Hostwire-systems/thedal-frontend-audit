import { Modal, Form, Input, message, Button, AutoComplete } from "antd";
import {
  addCasteCategory,
  getCpanelCasteCategoriesApi,
} from "../../api/casteCategoryApi";
import { useEffect, useState } from "react";

interface AddCasteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCasteCategoryAdded: (casteCategoryId: number) => void;
  selectedElectionId: number | string;
}
interface CasteCategoryType {
  id: number;
  casteCategoryId: number;
  key: string;
  casteCategoryName: string;
  orderIndex?: number;
}

const AddCasteCategoryModal: React.FC<AddCasteCategoryModalProps> = ({
  isOpen,
  onClose,
  onCasteCategoryAdded,
  selectedElectionId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [cpanelCasteCategories, setCpanelCasteCategories] = useState<
    CasteCategoryType[]
  >([]);
  const [options, setOptions] = useState([]);

//   const fetchCpanelCasteCategories = async () => {
//     // setLoading(true);
//     try {
//       const response = await getCpanelCasteCategoriesApi();
//       const casteCategoryData = response.data.map((casteCat: any) => ({
//         key: casteCat.casteCategoryId.toString(),
//         id: casteCat.casteCategoryId,
//         casteCategoryName: casteCat.casteCategoryName,
//       }));
//       setCpanelCasteCategories(casteCategoryData);
//       console.log("casteCategoryData", casteCategoryData);
//     } catch (error) {
//       //message.error('Failed to fetch caste categories');
//     } finally {
//     //   setLoading(false);
//     }
//   };

  const handleAddCasteCategory = async (values: any) => {
    const payload = {
      casteCategoryName: values.casteCategoryName,
    };
    setLoading(true);

    try {
      const response = await addCasteCategory(
        payload.casteCategoryName,
        selectedElectionId
      );
      console.log("Caste category added", response?.data?.data);
      onCasteCategoryAdded(response?.data?.data?.id);
      if (response?.data?.status === "success") {
        // message.success("Caste category added successfully");
        onCasteCategoryAdded(response.data?.data?.id); // Callback to refresh caste category list or update state
        form.resetFields();
        onClose();
      } else {
        message.error(response?.data?.message || "Failed to add caste category");
      }
    } catch (error) {
      console.error("Error adding caste category:", error);
      message.error("An error occurred while adding caste category.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsSearch = (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    // Filter caste categories based on the casteCategoryName property
    const filteredOptions = cpanelCasteCategories
      .filter((casteCat) =>
        casteCat?.casteCategoryName.toLowerCase().includes(value.toLowerCase())
      )
      .map((casteCat) => ({ value: casteCat?.casteCategoryName }));

    if (
      !cpanelCasteCategories.some(
        (casteCat) =>
          casteCat?.casteCategoryName.toLowerCase() === value.toLowerCase()
      )
    ) {
      filteredOptions.push({
        value,
        label: (
          <span>
            Create new caste category:{" "}
            <span style={{ color: "#1D4ED8" }}>{value}</span>
          </span>
        ),
      });
    }

    setOptions(filteredOptions);
  };

//   useEffect(() => {
//     if (isOpen) {
//       fetchCpanelCasteCategories();
//     }
//   }, [isOpen]);

  return (
    <Modal
      title="Add Caste Category"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => handleAddCasteCategory(values))
          .catch((errorInfo) => {
            console.error("Validation Failed:", errorInfo);
          });
      }}
      okButtonProps={{
        style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8",color:"#fff" },
        loading: loading,
        disabled: loading,
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Caste Category Name"
          name="casteCategoryName"
          rules={[
            { required: true, message: "Please enter the caste category name" },
          ]}
        >
          {/* <AutoComplete
            options={options}
            onSearch={handleOptionsSearch}
            placeholder="Enter Caste category name"
            filterOption={false}
          > */}
            <Input placeholder="Enter Caste category name" />
          {/* </AutoComplete> */}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCasteCategoryModal;

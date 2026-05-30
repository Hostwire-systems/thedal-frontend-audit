import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Popconfirm,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  fetchElectionTypes,
  addElectionType,
  deleteElectionType,
  editElectionType,
} from "../../api/electionTypeApi";

const { Option } = Select;

interface ElectionType {
  key: string;
  // electionName: string;
  electionType: string;
  // electionSubType: string;
}

const ElectionType: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [electionTypes, setElectionTypes] = useState<ElectionType[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();
  const inputRef = useRef(null);

  // Show the modal
  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Clear form values when opening the modal
  };

  // Handle adding an election type
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      console.log(values);
      const response = await addElectionType(values.electionType);
      console.log("Added election",response.data)
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding election type: ", error);
    }
  };

  // Handle deleting an election type
  const handleDelete = async (key: string) => {
    try {
      await deleteElectionType(Number(key));
      setElectionTypes(electionTypes.filter((type) => type.key !== key));
    } catch (error) {
      console.error("Error deleting election type: ", error);
    }
  };

  // Handle editing an election type
  const handleEdit = (record: ElectionType) => {
    setEditingKey(record.key);
    showModal();
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      if (editingKey) {
        await editElectionType(values.electionType,Number(editingKey));
        fetchData();
        setEditingKey(null);
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error editing election type: ", error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetchElectionTypes();
      const fetchedElectionTypes =
        response?.data?.data?.map((type: any) => ({
          key: type.id,
          // electionName: type.electionName,
          electionType: type.electionType,
          // electionSubType: type.electionSubType,
        })) || [];
      setElectionTypes(fetchedElectionTypes);
    } catch (error) {
      console.error("Error fetching election types: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isModalVisible && inputRef?.current) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 0);
    }

    if (isModalVisible && editingKey !== null) {
      const type = electionTypes.find((t) => t.key === editingKey);
      if (type) {
        form.setFieldsValue({
          // electionName: type.electionName,
          electionType: type.electionType,
          // electionSubType: type.electionSubType,
        });
      }
    }
  }, [isModalVisible, editingKey, electionTypes, form]);

  const columns: ColumnsType<ElectionType> = [
    // {
    //   title: "ELECTION NAME",
    //   dataIndex: "electionName",
    //   key: "electionName",
    // },
    {
      title: "ELECTION TYPE",
      dataIndex: "electionType",
      key: "electionType",
    },
    // {
    //   title: "ELECTION SUB TYPE",
    //   dataIndex: "electionSubType",
    //   key: "electionSubType",
    // },
    {
      title: "ACTION",
      key: "edit",
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          <EditOutlined />
        </Button>
      ),
    },
    {
      title: "ACTION",
      key: "delete",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this election type?"
          onConfirm={() => handleDelete(record.key)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" danger>
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Election Type</h2>
        <Button
          type="primary"
          className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
          onClick={showModal}
        >
          Add Election Type
        </Button>
      </div>
      <Table
        className="my-4"
        pagination={{
          position: ["bottomCenter"],
          defaultPageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        dataSource={electionTypes}
        columns={columns}
        rowKey="key"
      />

      <Modal
        title={editingKey ? "Edit Election Type" : "Add Election Type"}
        visible={isModalVisible}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingKey(null);
          form.resetFields();
        }}
        onOk={editingKey ? handleSaveEdit : handleAdd}
        okText={editingKey ? "Save" : "Add"}
      >
        <Form form={form} layout="vertical">
          {/* <Form.Item
            label="Election Name"
            name="electionName"
            rules={[
              { required: true, message: "Please enter the election name" },
            ]}
          >
            <Input placeholder="Enter election name" ref={inputRef} />
          </Form.Item> */}
          <Form.Item
            label="Election Type"
            name="electionType"
            rules={[{ required: true, message: "Please input election type" }]}
          >
            <Input placeholder="Enter election type" ref={inputRef} />
          </Form.Item>
          {/* <Form.Item
            label="Election Sub Type"
            name="electionSubType"
            rules={[
              {
                required: true,
                message: "Please select the election sub type",
              },
            ]}
          >
            <Select placeholder="Select election sub type">
              <Option value="Presidential">Presidential</Option>
              <Option value="Parliamentary">Parliamentary</Option>
              <Option value="Local">Local</Option>
            </Select>
          </Form.Item> */}
        </Form>
      </Modal>
    </div>
  );
};

export default ElectionType;

import { Dropdown, Menu, message } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { deleteVoterApi } from "../../api/voterApi";

const handleView = (record) => {
  console.log("View:", record);
};

const handleDelete = async (record) => {
  const response = await deleteVoterApi(record.voterId);
  if(response.status === "success"){
    message.success(response.message);
  }
};

export const columns = [
  {
    title: "S.No",
    dataIndex: "sno",
    key: "sno",
  },
  {
    title: "Voter Name",
    dataIndex: "voterName",
    key: "voterName",
  },
  {
    title: "Voter ID",
    dataIndex: "voterId",
    key: "voterId",
  },
  {
    title: "Father Name",
    dataIndex: "fatherName",
    render: () => "N/A",
    key: "fatherName",
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
  },
  {
    title: "Relationship Type",
    dataIndex: "relationshipType",
    render: () => "N/A",
    key: "relationshipType",
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, record) => (
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item key="view" onClick={() => handleView(record)}>
              View
            </Menu.Item>
            <Menu.Item key="delete" onClick={() => handleDelete(record)}>
              Delete
            </Menu.Item>
          </Menu>
        }
        trigger={["click"]}
      >
        <EllipsisOutlined style={{ cursor: "pointer" }} />
      </Dropdown>
    ),
  },
];

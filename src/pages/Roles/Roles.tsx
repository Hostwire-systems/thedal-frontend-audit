import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Table,
  Checkbox,
  Popconfirm,
  message,
  Dropdown,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useLoading } from "../../context/LoadingContext";
import {
  addRoleApi,
  fetchRolesApi,
  deleteRoleApi,
  updateRoleApi,
} from "../../api/roleApi";

interface Role {
  key: string;
  roleName: string;
  description: string;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentRoleName, setCurrentRoleName] = useState<string>("");
  const [form] = Form.useForm();
  const { isLoading: pageLoading, setLoading: setPageLoading } = useLoading();

  const getRoleDescription = (permissions: string[]) => {
    const allPermissions = [
      "BOOTH_MANAGEMENT",
      "CADRE_MANAGEMENT",
      "POLLING_MANAGEMENT",
      "VOTER_MANAGEMENT",
    ];

    if (permissions.length === allPermissions.length) {
      return "Highest level of access";
    }
    if (
      permissions.includes("BOOTH_MANAGEMENT") &&
      permissions.includes("CADRE_MANAGEMENT") &&
      permissions.length === 2
    ) {
      return "Full Constituency access";
    }
    if (permissions.includes("BOOTH_MANAGEMENT") && permissions.length === 1) {
      return "Manager with booth-level access";
    }
    return "Multiple booth Access";
  };

  const allPermissions = [
    {
      value: "BOOTH_MANAGEMENT",
      label: "Booth Management",
      description: "Manage booths and resources at the booth level.",
    },
    {
      value: "CADRE_MANAGEMENT",
      label: "Cadre Management",
      description: "Manage political cadres and team members.",
    },
    {
      value: "POLLING_MANAGEMENT",
      label: "Polling Management",
      description: "Manage polling data and operations.",
    },
    {
      value: "VOTER_MANAGEMENT",
      label: "Voter Management",
      description: "Manage voter data and registration.",
    },
  ];

  // Fetch roles from the API
  const fetchRolesData = async () => {
    try {
      setPageLoading(true);
      const response = await fetchRolesApi();
      const fetchedRoles =
        response?.data?.map((role: any) => ({
          key: role.id,
          roleName: role.roleName,
          description: role.description,
        })) || [];
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Error fetching roles: ", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddRole = async (values: any) => {
    try {
      setLoading(true);
    const payload = {
        roleName: values.roleName.toUpperCase(),
        permission: values.permission,
        description: getRoleDescription(values.permission),
      };
      console.log("payload", payload);
      if (editingRole) {
        await updateRoleApi(parseInt(editingRole.key), payload);
      } else {
        await addRoleApi(payload);
        message.success("Role added successfully!");
      }
      fetchRolesData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving role:", error);
      message.error("Failed to save role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (key: string) => {
    try {
      await deleteRoleApi(parseInt(key));
      setRoles((prevRoles) => prevRoles.filter((role) => role.key !== key));
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsModalVisible(true);
    setCurrentRoleName(role.roleName);
    form.setFieldsValue({
      roleName: role.roleName,
      permission: [],
    });
  };

  // Check if the role is a captain role (cannot edit permissions)
  const isCaptainRole = (roleName: string | undefined) => {
    if (!roleName) return false;
    const upperRoleName = roleName.toUpperCase();
    return (
      upperRoleName.includes('BOOTH') && upperRoleName.includes('CAPTAIN') ||
      upperRoleName.includes('FAMILY') && upperRoleName.includes('CAPTAIN') ||
      upperRoleName.includes('POLL') && upperRoleName.includes('CAPTAIN')
    );
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingRole(null);
    setCurrentRoleName("");
    form.resetFields();
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "roleName",
      key: "roleName",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Role) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => handleEditRole(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this role?"
                    onConfirm={() => handleDeleteRole(record.key)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      style: {
                        backgroundColor: "#1D4ED8",
                        borderColor: "white",
                      },
                    }}
                  >
                    <span>Delete</span>
                  </Popconfirm>
                ),
                danger: true,
              },
            ],
          }}
          trigger={["click"]}
        >
          <EllipsisOutlined style={{ cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ];

  useEffect(() => {
    fetchRolesData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Roles</h2>
        <Button
          type="primary"
          className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                 hover:!bg-[#1D4ED8] hover:text-[#fff]
                 hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
          onClick={() => setIsModalVisible(true)}
        >
          Add Role
        </Button>
      </div>
      <Table
        className="my-4 default-list-table"
        columns={columns}
        dataSource={roles}
        loading={pageLoading}
        style={{ backgroundColor: "#1D4ED85C" }}
        pagination={{
          position: ["bottomCenter"],
          defaultPageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        rowKey="key"
      />
      <Modal
        title={editingRole ? "Edit Role" : "Add Role"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okButtonProps={{
          loading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRole}>
          <Form.Item
            name="roleName"
            label="Role Name"
            rules={[{ required: true, message: "Role name is required" }]}
          >
            <Input 
              placeholder="Enter role name"
              onChange={(e) => setCurrentRoleName(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="permission"
            label="Permissions"
            rules={[
              { required: true, message: "Select at least one permission" },
            ]}
          >
            <Checkbox.Group disabled={isCaptainRole(currentRoleName)}>
              {allPermissions.map((perm) => (
                <div key={perm.value} style={{ marginBottom: "15px" }}>
                  <Checkbox
                    className="custom-checkbox"
                    value={perm.value}
                    style={{ marginBottom: "5px" }}
                  >
                    {perm.label}
                  </Checkbox>
                  <div
                    style={{
                      color: "#666",
                      fontSize: "13px",
                      marginLeft: "24px",
                    }}
                  >
                    {perm.description}
                  </div>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;

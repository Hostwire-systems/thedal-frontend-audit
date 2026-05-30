import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Input,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Space,
  Menu,
  message,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  AlertOutlined,
  AuditOutlined,
  AppstoreOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import {
  fetchRolesApi,
  addRoleApi,
  deleteRoleApi,
  updateRoleApi,
} from "../../api/roleApi";
const { TextArea } = Input;

// Role Dialog Component
const RoleDialog = ({
  open,
  onClose,
  role = null,
  isCloning = false,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: isCloning ? `${role?.name || ""} (Copy)` : role?.name || "",
    description: role?.description || "",
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      message.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      message.success(
        `Role successfully ${
          isCloning ? "cloned" : role ? "updated" : "created"
        }`
      );
      setFormData({ name: "", description: "" }); // Clear form fields
    } catch (error) {
      message.error("Failed to save role");
    } finally {
      setLoading(false);
      handleClose();
    }
  };
  const handleClose = () => {
    setFormData({ name: "", description: "" }); // Clear form fields
    onClose();
  };

  return (
    <Modal
      title={isCloning ? "Clone Role" : role ? "Edit Role" : "Add New Role"}
      open={open}
      onCancel={handleClose}
      onClose={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          style={{
            backgroundColor: "#1D4ED8",
            borderColor: "white",
          }}
          onClick={handleSubmit}
        >
          {isCloning ? "Clone Role" : role ? "Update Role" : "Create Role"}
        </Button>,
      ]}
    >
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Role Name<span className="text-red-500 pl-1">*</span>
          </label>
          <Input
            placeholder="Enter role name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Description<span className="text-red-500 pl-1">*</span>
          </label>
          <TextArea
            rows={3}
            placeholder="Enter role description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>
    </Modal>
  );
};

// Main Component
const RolesPermissionsManager = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState({});
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogState, setDialogState] = useState({
    open: false,
    role: null,
    isCloning: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    role: null,
  });

  const modules = [
    {
      name: "Dashboard",
      icon: <DashboardOutlined />,
      subModules: [
        { key: "election-dashboard", name: "Elections Dashboard" },
        { key: "cadre-dashboard", name: "Cadres Dashboard" },
        { key: "pollday-dashboard", name: "Poll Day Dashboard" },
      ],
    },
    {
      name: "Elections",
      icon: <AlertOutlined />,
      subModules: [
        { key: "electionsList", name: "Election" },
        { key: "availability", name: "Category" },
        { key: "appsBanner", name: "Apps Banner" },
        { key: "benefitScheme", name: "Benefit Scheme" },
        { key: "boothSlip", name: "Voter Slip" },
        { key: "language", name: "Language" },
        { key: "party", name: "Party" },
        { key: "religion", name: "Religion" },
        { key: "caste", name: "Caste" },
        { key: "subCaste", name: "Sub-Caste" },
        { key: "history", name: "Voting History" },
        { key: "feedback", name: "Feedback" },
      ],
    },
    {
      name: "Part Manager",
      icon: <AuditOutlined />,
      subModules: [
        { key: "boothType", name: "Vulnerability" },
        { key: "partList", name: "Part List" },
        { key: "partMap", name: "Part Map" },
        { key: "sectionList", name: "Section List" },
      ],
    },
    {
      name: "Poll Day Manager",
      icon: <AuditOutlined />,
      subModules: [{ key: "vote", name: "Vote" }],
    },
    {
      name: "Voter Data",
      icon: <TeamOutlined />,
      subModules: [
        { key: "votersList", name: "Voters List" },
        { key: "votersMap", name: "Voters Map" },
        { key: "duplicate-voters", name: "Double Entry Voters" },
        { key: "new-voters", name: "New Voters" }, //only view
        { key: "aadhaar-verified", name: "Aadhaar Verified" },
      ],
    },
    {
      name: "Family Data",
      icon: <TeamOutlined />,
      subModules: [
        { key: "family", name: "Family" }, //edit and view
        { key: "family-poll-status", name: "Family Poll Status" }, //all
      ],
    },
    {
      name: "Cadre",
      icon: <UserOutlined />,
      subModules: [
        { key: "cadreList", name: "Cadre List" },
        { key: "cadreMap", name: "Cadre Map" },
        { key: "cadreTrackingList", name: "Cadre Tracking List" },
      ],
    },
    {
      name: "Campaign Manager",
      icon: <FileTextOutlined />,
      subModules: [
        { key: "news", name: "News" },
        { key: "communication", name: "Communication Manager" },
      ],
    },
    {
      name: "Survey Manager",
      icon: <AppstoreOutlined />,
      subModules: [{ key: "surveyForm", name: "Survey Forms" }],
    },
    {
      name: "Member Manager",
      icon: <AppstoreOutlined />,
      subModules: [{ key: "membersList", name: "Members List" }],
    },
    {
      name: "Mobile Home Page",
      icon: <MobileOutlined />,
      subModules: [
        { key: "transgender", name: "Transgender" },
        { key: "fatherless", name: "Fatherless" },
        { key: "guardian", name: "Guardian" },
        { key: "overseas", name: "Overseas" },
        { key: "birthday", name: "Birthday" },
        { key: "star", name: "Star" },
        { key: "mobile", name: "Mobile" },
        { key: "80-above", name: "85 Above" },


      ],
    },
    {
      name: "Settings",
      icon: <SettingOutlined />,
      subModules: [
        { key: "userProfile", name: "User Profile" },
        { key: "authentication", name: "Authentication" },
        { key: "roles", name: "Roles" },
        { key: "slip-box", name: "Slip Box" },
        { key: "dynamic-field", name: "Dynamic Fields" }, //all
        { key: "field-order", name: "Fields Order" }, // view and update
        { key: "download", name: "Downloads" },
        { key: "catalogue", name: "Catalogue" },
        { key: "static-dashboard", name: "Static Dashboard" }, //view and update
        // { key: "bulkSms", name: "Bulk SMS" },
      ],
    },
  ];

  const handleSavePermissions = async () => {
    setIsUpdating(true);
    try {
      const role = roles.find((r) => r.id === selectedRole);
      const payload = {
        roleName: role.name,
        description: role.description,
        rolePermission: selectedRolePermissions,
        permission: [],
      };
      await updateRoleApi(selectedRole, payload);
      const updatedRoles = roles.map((r) =>
        r.id === selectedRole
          ? { ...r, permissions: selectedRolePermissions }
          : r
      );
      setRoles(updatedRoles);
      message.success("Permissions updated successfully");
    } catch (error) {
      message.error("Failed to save permissions");
    } finally {
      setIsUpdating(false);
    }
  };

  // Role operations
  const handleAddRole = async (formData) => {
    try {
      const payload = {
        roleName: formData.name,
        description: formData.description,
        rolePermission: {},
        permission: [],
      };
      const newRole = await addRoleApi(payload);
      console.log("newRole", newRole);
      await fetchRoles();
      if (leftPanelRef && rightPanelRef) {
        leftPanelRef?.current.scrollTo({ top: 0, behavior: "smooth" });
        rightPanelRef?.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      message.error("Failed to add role");
    }
  };

  const handleEditRole = async (formData) => {
    try {
      const existingRole = roles.find((r) => r.id === dialogState.role.id);
      const payload = {
        roleName: formData.name,
        description: formData.description,
        rolePermission: existingRole.permissions,
        permission: [],
      };
      await updateRoleApi(dialogState.role.id, payload);
      const updatedRoles = roles.map((role) =>
        role.id === dialogState.role.id
          ? { ...role, name: formData.name, description: formData.description }
          : role
      );
      setRoles(updatedRoles);
    } catch (error) {
      message.error("Failed to update role");
    }
  };

  const handleCloneRole = async (formData) => {
    try {
      const originalRole = dialogState.role;
      const payload = {
        roleName: formData.name,
        description: formData.description,
        rolePermission: originalRole.permissions,
        permission: [],
      };
      const newRole = await addRoleApi(payload);
      // setRoles([
      //   ...roles,
      //   {
      //     id: newRole.id,
      //     name: newRole.roleName,
      //     description: newRole.description,
      //     permissions: newRole.rolePermission,
      //   },
      // ]);
      await fetchRoles();
    } catch (error) {
      message.error("Failed to clone role");
    }
  };

  const handleDeleteRole = async () => {
    try {
      setLoading(true);
      await deleteRoleApi(deleteModal.role.id);
      const updatedRoles = roles.filter((r) => r.id !== deleteModal.role.id);
      setRoles(updatedRoles);
      if (selectedRole === deleteModal.role.id) {
        setSelectedRole(updatedRoles[0]?.id || null);
      }
      message.success("Role deleted successfully!");
    } catch (error) {
      message.error("Failed to delete role");
    } finally {
      setDeleteModal({ open: false, role: null });
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMenuItems = (role) => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () => setDialogState({ open: true, role, isCloning: false }),
    },
    {
      key: "clone",
      icon: <CopyOutlined />,
      label: "Clone",
      onClick: () => setDialogState({ open: true, role, isCloning: true }),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: () => setDeleteModal({ open: true, role }),
    },
  ];

  // Function to map backend permission names to frontend names
const mapBackendToFrontendPermissions = (backendPermissions:any) => {
  const mappedPermissions = { ...backendPermissions };
  
  // Map specific backend names to frontend names
  if (mappedPermissions.newVoter !== undefined) {
    mappedPermissions['new-voters'] = mappedPermissions.newVoter;
  }
  
  if (mappedPermissions.voterList !== undefined) {
    mappedPermissions['votersList'] = mappedPermissions.voterList;
  }
  
  if (mappedPermissions.voterMap !== undefined) {
    mappedPermissions['votersMap'] = mappedPermissions.voterMap;
  }
  
  if (mappedPermissions.familyPollStatus !== undefined) {
    mappedPermissions['family-poll-status'] = mappedPermissions.familyPollStatus;
  }
  
  if (mappedPermissions.polldayVote !== undefined) {
    mappedPermissions['vote'] = mappedPermissions.polldayVote;
  }
  
  return mappedPermissions;
};

  const fetchRoles = async () => {
    try {
      const response = await fetchRolesApi();
      const mappedRoles = response.data
        .filter((role) => role.roleName !== "SUPER_ADMIN")
        .map((role) => ({
          id: role.id,
          name: role.roleName,
          description: role.description,
          permissions: mapBackendToFrontendPermissions(role.rolePermission),
        }));
      console.log("Roles", mappedRoles);
      setRoles(mappedRoles);
    } catch (error) {
      message.error("Failed to fetch roles");
    }
  };
  useEffect(() => {
    fetchRoles();
  }, []);
  useEffect(() => {
    if (selectedRole) {
      const role = roles.find((r) => r.id === selectedRole);
      setSelectedRolePermissions(role?.permissions || {});
    }
  }, [selectedRole, roles]);

  // Check if the selected role is a captain role
  const isCaptainRole = () => {
    if (!selectedRole) return false;
    const role = roles.find((r) => r.id === selectedRole);
    if (!role) return false;
    const upperRoleName = role.name.toUpperCase();
    return (
      (upperRoleName.includes('BOOTH') && upperRoleName.includes('CAPTAIN')) ||
      (upperRoleName.includes('FAMILY') && upperRoleName.includes('CAPTAIN')) ||
      (upperRoleName.includes('POLL') && upperRoleName.includes('CAPTAIN'))
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex gap-6">
        {/* Left Panel - Roles */}
        <div
          className="w-72"
          ref={leftPanelRef}
          style={{
            height: "calc(100vh - 130px)",
            overflowY: "auto",
            // scrollbarWidth: "none", // For Firefox
            msOverflowStyle: "none",
          }}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Roles</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="text-white  bg-[#1D4ED8] border-[#1D4ED8]  
              hover:!bg-[#1D4ED8] hover:text-[#fff]"
                onClick={() =>
                  setDialogState({ open: true, role: null, isCloning: false })
                }
              >
                Add Role
              </Button>
            </div>

            <Input
              placeholder="Search roles"
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-3">
              {filteredRoles.map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer ${
                    selectedRole === role.id ? "border-blue-400" : ""
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                  size="small"
                  extra={
                    <Dropdown
                      menu={{ items: getMenuItems(role) }}
                      trigger={["click"]}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  }
                >
                  <div className="flex items-center gap-3">
                    <UserOutlined className="text-gray-400" />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Permissions */}
        <div
          className="flex-1"
          ref={rightPanelRef}
          style={{
            height: "calc(100vh - 130px)", // Adjust height as needed
            overflowY: "auto",
            // scrollbarWidth: "none", // For Firefox
            msOverflowStyle: "none",
          }}
        >
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-medium">
                    {roles.find((r) => r.id === selectedRole)?.name} Permissions
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage module-level permissions
                  </p>
                </div>
                <Button
                  loading={isUpdating}
                  type="primary"
                  disabled={isCaptainRole()}
                  className="text-white  bg-[#1D4ED8] border-[#1D4ED8]  
              hover:!bg-[#1D4ED8] hover:text-[#fff]"
                  onClick={handleSavePermissions}
                >
                  Save Changes
                </Button>
              </div>

              <div className="space-y-6">
                {modules.map((module) => {
                  // Get selected role to check if it's admin or super admin
                  const selectedRoleData = roles.find((r) => r.id === selectedRole);
                  const roleName = selectedRoleData?.name?.toUpperCase() || '';
                  const isAdminRole = roleName.includes('ADMIN');
                  
                  // Hide Mobile Home Page module entirely for admin roles
                  if (module.name === "Mobile Home Page" && isAdminRole) {
                    return null;
                  }
                  
                  // Filter out "roles" from Settings submodules for admin roles
                  const filteredSubModules = module.name === "Settings" && isAdminRole
                    ? module.subModules.filter(sub => sub.key !== "roles")
                    : module.subModules;
                  
                  return (
                  <Card key={module.name} className="w-full">
                    <div>
                      <div className="flex items-center mb-6">
                        {module.icon}
                        <span className="text-lg font-medium ml-2 mr-auto">
                          {module.name}
                        </span>
                        <div className="flex gap-12 mr-3">
                          {["Create", "Read", "Update", "Delete"].map(
                            (label) => (
                              <span key={label} className="w-16 text-center">
                                {label}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {filteredSubModules.map((subModule) => (
                          <div
                            key={subModule.key}
                            className="flex items-center"
                          >
                            <span className="text-sm flex-1 ml-7">
                              {subModule.name}
                            </span>
                            <div className="flex gap-12">
                              {["C", "R", "U", "D"].map((permission) => {
                                const currentPermissions =
                                  selectedRolePermissions[subModule.key] || [];
                                const isChecked =
                                  currentPermissions.includes(permission);

                                // Disable all checkboxes for captain roles
                                const isCaptain = isCaptainRole();
                                
                                // Disable all options except "Update" for "Poll Day Manager"
                                const isDisabled =
                                  isCaptain || // Disable all for captain roles
                                  (module.name === "Poll Day Manager" &&
                                    (permission === "C" ||
                                      permission === "D")) ||
                                  (module.name === "Campaign Manager" &&
                                    subModule.key === "news" &&
                                    permission !== "R") ||
                                  (module.name === "Part Manager" &&
                                    subModule.key === "boothType" &&
                                    (permission === "C" ||
                                      permission === "D")) ||
                                  (module.name === "Part Manager" &&
                                    subModule.key === "partMap" &&
                                    permission !== "R") ||
                                  (module.name === "Voter Data" &&
                                    subModule.key === "votersMap" &&
                                     (permission === "C" ||
                                      permission === "D")) ||
                                  (module.name === "Settings" &&
                                    subModule.key === "bulkSms") ||
                                  (module.name === "Settings" &&
                                    subModule.key === "download" &&
                                    (permission === "U" ||
                                      permission === "C")) ||
                                  (module.name === "Cadre" &&
                                    subModule.key !== "cadreList" &&
                                    permission !== "R") ||
                                  (subModule.key === "catalogue" &&
                                    permission !== "R") || // Read only
                                  (module.name === "Settings" &&
                                    subModule.key === "authentication" &&
                                    (permission === "C" ||
                                      permission === "D")) || // Read and Update only
                                  (module.name === "Voter Data" &&
                                    subModule.key === "family" &&
                                    (permission === "C" ||
                                      permission === "D")) || // Family: Read and Update only
                                  (module.name === "Voter Data" &&
                                    subModule.key === "duplicate-voters" &&
                                    permission !== "R") || // Duplicate Voters: Read only
                                  (module.name === "Voter Data" &&
                                    subModule.key === "aadhaar-verified" &&
                                    (permission === "C" ||
                                      permission === "U")) || // Read and Delete only
                                  ([
                                    "election-dashboard",
                                    "cadre-dashboard",
                                    "pollday-dashboard",
                                  ].includes(subModule.key) &&
                                    (permission === "C" ||
                                      permission === "D")) || // Read and Update only // Dashboards: Read + Update only
                                  // (module.name === "Voter Data" &&
                                  //   subModule.key === "new-voters" &&
                                  //   permission !== "R") || // New Voters: Read only
                                  (module.name === "Family Data" &&
                                    subModule.key === "family" &&
                                    (permission === "C" ||
                                      permission === "D")) || // Family: Read + Update only
                                  (module.name === "Settings" &&
                                    subModule.key === "field-order" &&
                                    (permission === "C" ||
                                      permission === "D")) || // Field Order: Read + Update only
                                  (module.name === "Settings" &&
                                    subModule.key === "static-dashboard" &&
                                    (permission === "C" || permission === "D"));
                                const handleChange = (e) => {
                                  let newPermissions = e.target.checked
                                    ? [
                                        ...new Set([
                                          ...currentPermissions,
                                          permission,
                                        ]),
                                      ]
                                    : currentPermissions.filter(
                                        (p) => p !== permission
                                      );

                                  // Ensure 'R' is selected when selecting C, U, or D
                                  if (
                                    ["C", "U", "D"].includes(permission) &&
                                    e.target.checked
                                  ) {
                                    newPermissions.push("R");
                                  }

                                  // Prevent 'R' from being unchecked if other permissions exist
                                  if (permission === "R" && !e.target.checked) {
                                    if (
                                      newPermissions.some((p) =>
                                        ["C", "U", "D"].includes(p)
                                      )
                                    )
                                      return;
                                  }

                                  setSelectedRolePermissions((prev) => ({
                                    ...prev,
                                    [subModule.key]: [
                                      ...new Set(newPermissions),
                                    ],
                                  }));
                                };

                                return (
                                  <div
                                    key={permission}
                                    className="w-16 flex justify-center"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onChange={handleChange}
                                      disabled={isDisabled}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 mt-20">
              Select a role to manage permissions
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <RoleDialog
        open={dialogState.open}
        onClose={() =>
          setDialogState({ open: false, role: null, isCloning: false })
        }
        role={dialogState.role}
        isCloning={dialogState.isCloning}
        onSave={
          dialogState.isCloning
            ? handleCloneRole
            : dialogState.role
            ? handleEditRole
            : handleAddRole
        }
      />

      <Modal
        title="Delete Role"
        open={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false, role: null })}
        onOk={handleDeleteRole}
        okText="Delete"
        okButtonProps={{ danger: true, loading: loading }}
      >
        <p>
          Are you sure you want to delete the role "{deleteModal.role?.name}"?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default RolesPermissionsManager;

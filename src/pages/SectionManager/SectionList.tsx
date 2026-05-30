import { useEffect, useState } from "react";
import {
  Col,
  Row,
  Spin,
  message,
  Modal,
  Form,
  Button,
  Input,
  Menu,
  Checkbox,
  Dropdown,
  Progress,
} from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";
import SectionTable from "./SectionTable";
import {
  getSectionsApi,
  deleteSectionApi,
  updateSectionApi,
  deleteMultipleSectionsApi,
} from "../../api/sectionApi";
import {
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

interface Section {
  id: number;
  partNo: string;
  sectionNo: string;
  sectionNameEn: string;
  sectionNameL1: string;
}

export default function SectionList(): JSX.Element {
  const [sectionList, setSectionList] = useState<Section[]>([]);
  const [filteredSectionList, setFilteredSectionList] = useState<Section[]>([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [searchQuerySection, setSearchQuerySection] = useState<string>("");
  const [searchQueryPart, setSearchQueryPart] = useState<string>("");

  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>("");
  const [showExportProgress, setShowExportProgress] = useState<boolean>(false);
  const { isLoading, setLoading } = useLoading();
  const [form] = Form.useForm();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {},
  );

  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasReadPermission = (module: string) =>
    rolesPermission?.[module]?.includes("R");
  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const navigate = useNavigate();

  useEffect(() => {
    resetState();
    if (selectedElectionId) {
      fetchSections();
    }
  }, [selectedElectionId]);

  // Whenever sectionList updates, we use it directly for the table.
  // No filtering logic is needed since search has been removed.

  const resetState = () => {
    setSectionList([]);
    setFilteredSectionList([]);
  };

  const handlePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQueryPart(e.target.value);
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuerySection(e.target.value);
  };

  const handleSearch = () => {
    const partQuery = searchQueryPart.trim().toLowerCase();
    const sectionQuery = searchQuerySection.trim().toLowerCase();

    const filteredData = sectionList.filter((sec) => {
      const partNo = (sec.partNo ?? "").toString().toLowerCase();
      const sectionNo = (sec.sectionNo ?? "").toString().toLowerCase();

      const matchPart = partQuery ? partNo.includes(partQuery) : true;
      const matchSection = sectionQuery
        ? sectionNo.includes(sectionQuery)
        : true;

      return matchPart && matchSection;
    });

    setFilteredSectionList(filteredData);
  };

  const fetchSections = async () => {
    if (!selectedElectionId) return;
    try {
      setLoading(true);
      const response = await getSectionsApi(parseInt(selectedElectionId));
      console.log(response);
      const validSections = Array.isArray(response.data?.data)
        ? response.data?.data
        : [];
      setSectionList(validSections);
      setFilteredSectionList(validSections);
      console.log("validSections", validSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSectionList([]);
      setFilteredSectionList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    try {
      await deleteSectionApi(parseInt(selectedElectionId), sectionId);
      message.success("Section deleted successfully");
      fetchSections();
    } catch (error) {
      console.error("Failed to delete section:", error);
      // message.error("Failed to delete section");
    }
  };

  const handleEditSection = (section: Section) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setEditingSection(section);
    form.setFieldsValue(section);
  };

  const handleUpdateSection = async () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    try {
      const values = await form.validateFields();
      if (!editingSection) return;
      setUpdateLoading(true);
      await updateSectionApi(
        parseInt(selectedElectionId),
        editingSection.id,
        values,
      );
      message.success("Section updated successfully");
      setEditingSection(null);
      fetchSections();
    } catch (error) {
      console.error("Error updating section:", error);
      message.error("Failed to update section");
    } finally {
      setUpdateLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all section data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all section
            data.
          </p>
          <Checkbox
            onChange={(e) => {
              const isChecked = e.target.checked;
              // Update the modal's OK button directly
              modal.update({
                okButtonProps: {
                  disabled: !isChecked,
                  className: !isChecked ? "opacity-50 cursor-not-allowed" : "",
                },
              });
              // Store the checkbox state in a custom property for onOk access
              modal._isDeleteConfirmed = isChecked;
            }}
            style={{ marginTop: 16 }}
          >
            I understand that by confirming, all section data will be
            permanently deleted
          </Checkbox>
        </div>
      ),
      okText: "Yes, Delete",
      okType: "danger",
      okButtonProps: {
        disabled: true,
        className: "opacity-50 cursor-not-allowed",
      },
      cancelText: "Cancel",
      async onOk() {
        if (modal._isDeleteConfirmed) {
          await handleDeleteMultipleSections();
        }
      },
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Section[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedSections(selectedRows);
    },
  };

  const handleDeleteMultipleSections = async (sectionManagerIds?: number[]) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    if (!selectedElectionId) return;

    try {
      console.log("sectionManagerIds", sectionManagerIds);
      setDeleteLoading(true);
      // Use the unified API function
      if (sectionManagerIds) {
        await deleteMultipleSectionsApi(parseInt(selectedElectionId));
      } else {
        await deleteMultipleSectionsApi(
          parseInt(selectedElectionId),
          sectionManagerIds,
        );
      }

      const successMessage = sectionManagerIds?.length
        ? `${sectionManagerIds.length} sections deleted successfully`
        : "All sections deleted successfully";

      message.success(successMessage);
      setSelectedRowKeys([]);
      setSelectedSections([]);
      await fetchSections();
    } catch (error) {
      const errorMessage = sectionManagerIds?.length
        ? "Failed to delete selected sections"
        : "Failed to delete all sections";
      console.error(errorMessage, error);
      message.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportAllSections = async () => {
    if (!selectedElectionId) {
      message.warning("Please select an election first");
      return;
    }

    try {
      setExporting(true);
      setShowExportProgress(true);
      setExportProgress(10);
      setExportStatusText("Fetching section data...");

      const response = await getSectionsApi(parseInt(selectedElectionId));
      const sections: Section[] = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      if (!sections.length) {
        setExportProgress(100);
        setExportStatusText("No section data available");
        message.warning("No sections found to export");
        return;
      }

      setExportProgress(30);
      setExportStatusText("Preparing rows...");

      const formattedRows: Array<Record<string, string | number>> = [];
      const totalRecords = sections.length;
      const chunkSize = Math.max(1, Math.floor(totalRecords / 15));

      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        formattedRows.push({
          "S.No": index + 1,
          "Part No": section.partNo || "",
          "Section No": section.sectionNo || "",
          "Section Name English": section.sectionNameEn || "",
          "Section Name L1": section.sectionNameL1 || "",
        });

        if ((index + 1) % chunkSize === 0 || index === sections.length - 1) {
          const progress = 30 + Math.floor(((index + 1) / totalRecords) * 50);
          setExportProgress(progress);
          setExportStatusText(`Preparing rows... ${index + 1}/${totalRecords}`);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      setExportProgress(85);
      setExportStatusText("Generating Excel file...");

      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");

      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const timePart = `${String(now.getHours()).padStart(2, "0")}${String(
        now.getMinutes(),
      ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const fileName = `sections_election_${selectedElectionId}_${datePart}_${timePart}.xlsx`;

      setExportProgress(95);
      setExportStatusText("Downloading file...");

      XLSX.writeFile(workbook, fileName);

      setExportProgress(100);
      setExportStatusText("Export completed");
      message.success(`Exported ${totalRecords} sections successfully`);
    } catch (error) {
      console.error("Error exporting sections:", error);
      setExportStatusText("Export failed");
      message.error("Failed to export sections");
    } finally {
      setExporting(false);
      setTimeout(() => {
        setShowExportProgress(false);
        setExportProgress(0);
        setExportStatusText("");
      }, 800);
    }
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() =>
          handleDeleteMultipleSections(selectedSections.map((part) => part.id))
        }
        disabled={
          isFrozen ||
          selectedSections.length === 0 ||
          deleteLoading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("partList"))
        }
      >
        {deleteLoading
          ? "Deleting..."
          : `Delete Selected (${selectedSections.length})`}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("partList"))
        }
        danger
      >
        Delete All Sections
      </Menu.Item>
      <Menu.Item
        key="export"
        icon={<DownloadOutlined />}
        onClick={handleExportAllSections}
        disabled={
          exporting || (!isSuperAdminOrAdmin && !hasReadPermission("partList"))
        }
      >
        {exporting ? "Exporting..." : "Export All Sections (Excel)"}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="w-full h-full p-10">
      {!selectedElectionId ? (
        <div className="text-center p-4">
          Please select an election to view sections
        </div>
      ) : isLoading ? (
        <div className="text-center p-4">
          <Spin className="custom-spin-dark" size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={24}>
              <h3 className="text-[20px] font-semibold">Section List</h3>
            </Col>
          </Row>
          {isFrozen && (
            <div className="mb-4">
              <FrozenElectionBanner show={isFrozen} variant="inline" />
            </div>
          )}
          <Row gutter={[16, 16]} className="w-full items-end mt-5">
            <Col className="flex flex-row gap-12" span={20}>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  width: "20vw",
                  alignItems: "center",
                }}
              >
                <Input
                  placeholder="Search Part No"
                  className="input-element"
                  value={searchQueryPart}
                  onChange={handlePartChange}
                  onPressEnter={handleSearch}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  width: "20vw",
                  alignItems: "center",
                }}
              >
                <Input
                  placeholder="Search Section No"
                  className="input-element"
                  value={searchQuerySection}
                  onChange={handleSectionChange}
                  onPressEnter={handleSearch}
                />
              </div>

              <Button
                type="primary"
                icon={
                  <SearchOutlined style={{ color: "#fff", fontSize: 20 }} />
                }
                className="bg-[#1D4ED8] border-none"
                style={{ height: 45, width: 45 }}
                onClick={handleSearch}
              />

              <Button
                type="default"
                className="h-[45px] px-4"
                onClick={() => {
                  setSearchQueryPart("");
                  setSearchQuerySection("");
                  setFilteredSectionList(sectionList);
                }}
              >
                Clear
              </Button>
              <Col span={4} className="flex justify-end">
                <Dropdown overlay={actionsMenu} trigger={["click"]}>
                  <Button
                    type="primary"
                    className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                  >
                    Actions <DownOutlined />
                  </Button>
                </Dropdown>
              </Col>
            </Col>
          </Row>
          <Row className="mt-10">
            <Col span={24}>
              <SectionTable
                filteredSectionList={filteredSectionList}
                onDeleteSection={handleDeleteSection}
                onEditSection={handleEditSection}
                loading={isLoading}
                rowSelection={isFrozen ? undefined : rowSelection}
                isFrozen={isFrozen}
              />
            </Col>
          </Row>

          {/* Edit Section Modal */}
          <Modal
            title="Edit Section"
            open={!!editingSection}
            onCancel={() => {
              setEditingSection(null);
              form.resetFields();
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setEditingSection(null);
                  form.resetFields();
                }}
                disabled={updateLoading}
              >
                Cancel
              </Button>,
              <Button
                key="update"
                type="primary"
                onClick={() => handleUpdateSection()}
                disabled={updateLoading || isFrozen}
              >
                {updateLoading ? <Spin size="small" /> : "Update"}
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical" disabled={isFrozen}>
              <Form.Item
                name="partNo"
                label="Part Number"
                rules={[
                  { required: true, message: "Please enter the part number" },
                ]}
              >
                <Input placeholder="Enter part number" />
              </Form.Item>
              <Form.Item
                name="sectionNo"
                label="Section Number"
                rules={[
                  {
                    required: true,
                    message: "Please enter the section number",
                  },
                ]}
              >
                <Input placeholder="Enter section number" />
              </Form.Item>
              <Form.Item
                name="sectionNameEn"
                label="Section Name English"
                rules={[
                  {
                    required: true,
                    message: "Please enter the section name in English",
                  },
                ]}
              >
                <Input placeholder="Enter section name in English" />
              </Form.Item>
              <Form.Item
                name="sectionNameL1"
                label="Section Name L1"
                rules={[
                  {
                    required: true,
                    message: "Please enter the section name in L1",
                  },
                ]}
              >
                <Input placeholder="Enter section name in L1" />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Exporting Sections"
            open={showExportProgress}
            footer={null}
            closable={!exporting}
            maskClosable={false}
            onCancel={() => {
              if (!exporting) {
                setShowExportProgress(false);
              }
            }}
          >
            <div className="py-2">
              <p className="mb-3 text-sm text-gray-600">{exportStatusText}</p>
              <Progress
                percent={exportProgress}
                status={
                  exporting
                    ? "active"
                    : exportProgress === 100
                      ? "success"
                      : "normal"
                }
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Select, message } from "antd";
import { fetchBooths, updateBoothsOrder } from "../../api/boothApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoaderData, useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../config";
import { EditOutlined } from "@ant-design/icons";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import { SortOrder } from "antd/es/table/interface";
import { getPartsVulnerabilityApi } from "../../api/partApi";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";

const { Option } = Select;

const BoothType = () => {
  const location = useLocation();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  const electionId = location.state?.electionId || selectedElectionId;
  const { isLoading, setLoading } = useLoading();
  const [parts, setParts] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(0); // API is 0-indexed
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [form] = Form.useForm();

  const jwtToken = localStorage.getItem("jwtToken");

  const options = [
    {
      value: "critical",
      label: "Critical",
      color: "#FF505080",
    },
    {
      value: "serious",
      label: "Serious",
      color: "#FF936B80",
    },
    {
      value: "caution",
      label: "Caution",
      color: "#EEC75580",
    },
    {
      value: "normal",
      label: "Normal",
      color: "#06932F80",
    },
    {
      value: null,
      label: "Not Assigned",
      color: "default",
    },
  ];

  const getBoothNumbers = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      
      // const response = await fetchBooths(electionId);
      // console.log("Fetched booths:", response?.data?.content);
      // let boothData = response?.data?.content
      //   .map((booth: any) => ({
        //     boothNumber: booth.boothNumber,
        //     boothVulnerability: booth.boothVulnerability,
        //     orderIndex: booth.orderIndex,
        //   }))
        //   .sort((a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex));
        
        const response = await getPartsVulnerabilityApi(electionId, page, size);
        console.log("Parts response:", response.data);
        
        const partsContent = response.data?.data?.content || [];
        const totalElements = response.data?.data?.totalElements || 0;

      const validParts = partsContent.map((part: any) => ({
        ...part,
        partNo: Number(part?.partNo?.trim() ?? 0),
        key: part?.partNo,
      }));

      console.log("validParts", validParts);
      console.log("totalElements", totalElements);
      setParts(validParts || []);
      setTotalItems(totalElements);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setParts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      // Reset pagination when election changes
      setCurrentPage(0);
      setTotalItems(0);
      getBoothNumbers(0, pageSize);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (selectedElectionId) {
      getBoothNumbers(currentPage, pageSize);
    }
  }, [currentPage, pageSize]);
  

  const showModal = (record: any) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setSelectedBooth(record);
    form.setFieldsValue({
      boothVulnerability: record.boothVulnerability ?? null,
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedBooth(null);
    form.resetFields();
  };

  const handleModalOk = async () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setIsSaving(true);

    try {
      const values = await form.validateFields();
      const { boothVulnerability } = values;
      const payload = {
        partNo: selectedBooth.partNo,
        boothVulnerability: boothVulnerability || null,
      };

       await axios.put(
        `${BASE_URL}/elections/partmanager/vulnerability/${electionId}/${selectedBooth.partNo}`,
        payload,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.success("Booth vulnerability updated successfully");

      // Update the booth in the table
      setParts((prevBooths) =>
        prevBooths.map((b) =>
          b.partNo === selectedBooth.partNo
            ? { ...b, boothVulnerability: boothVulnerability }
            : b
        )
      );

      handleModalCancel();
    } catch (error: any) {
      console.error("Error updating booth vulnerability:", error);
      message.error(
        error.response?.data?.message ||
          "An error occurred while updating the booth"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onDragStart = () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedBooths = [...parts];
    const [movedItem] = reorderedBooths.splice(result.source.index, 1);
    reorderedBooths.splice(result.destination.index, 0, movedItem);
    setParts(reorderedBooths);
    const payload = reorderedBooths.map((booth, index) => ({
      partNo: booth.partNo,
      newOrderIndex: index,
    }));
    try {
      await updateBoothsOrder(parseInt(selectedElectionId), payload);
      console.log("Booths order updated successfully!");
      message.success("Booths order updated successfully!");
    } catch (error: any) {
      console.log("Error updating Booths order", error);
    }
  };

  const columns = [
    {
      title: "Booth Number",
      dataIndex: "partNo",
      key: "partNo",
      sorter: (a: any, b: any) => Number(a.partNo) - Number(b.partNo),
      defaultSortOrder: "ascend" as SortOrder,
    },
    {
      title: "Vulnerability",
      dataIndex: "boothVulnerability",
      key: "boothVulnerability",
      render: (vulnerability: string) => {
        if (!vulnerability) return "Not Assigned";
        const option = options.find((opt) => opt.value === vulnerability);
        const style = {
          backgroundColor: option?.color || "#f0f0f0",
          padding: "4px 8px",
          borderRadius: "4px",
          display: "inline-block",
        };
        return <span style={style}>{option?.label || vulnerability}</span>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: any) => (
        <Button
          type="link"
          onClick={() => showModal(record)}
          disabled={isFrozen}
        >
          <EditOutlined />
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 className="font-bold text-[31px] leading-8">Vulnerability</h2>
      {isFrozen && (
        <div className="mb-4">
          <FrozenElectionBanner variant="inline" />
        </div>
      )}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <StrictModeDroppable
          droppableId="droppableBooths"
          direction="vertical"
          type="ROW"
        >
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Table
                className="my-4 default-list-table"
                style={{ backgroundColor: "#1D4ED85C" }}
                dataSource={parts}
                columns={columns}
                rowKey="partNo"
                pagination={
                  isDragging
                    ? false
                    : {
                        current: currentPage + 1,
                        pageSize,
                        total: totalItems,
                        onChange: (page, size) => {
                          setCurrentPage(page - 1); // API expects 0-indexed
                          setPageSize(size);
                        },
                        showSizeChanger: true,
                        showQuickJumper: true,
                        position: ["bottomCenter"],
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }
                }
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = parts.findIndex(
                        (booth) => booth.partNo === key
                      );

                      // If dragging and row is not in the data, render a plain row
                      if (isDragging && index === -1) {
                        return <tr {...props}>{props.children}</tr>;
                      }

                      return (
                        <Draggable
                          key={key}
                          draggableId={String(key)}
                          index={index}
                          isDragDisabled={isFrozen}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...props.style,
                                ...provided.draggableProps.style,
                                cursor: "move",
                                display: "table-row",
                                position: isDragging ? "relative" : "static",
                                top: isDragging ? "" : undefined,
                                left: isDragging ? "" : undefined,
                                background: snapshot.isDragging
                                  ? "#e0f7fa"
                                  : "inherit",
                              }}
                              className={
                                snapshot.isDragging ? "dragging-row" : ""
                              }
                            >
                              {props.children}
                            </tr>
                          )}
                        </Draggable>
                      );
                    },
                  },
                }}
              />
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
      <Modal
        title="Assign Booth Vulnerability"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={isSaving ? "Saving..." : "Save"}
        okButtonProps={{
          type: "primary",
          disabled: isFrozen || isSaving,
          loading: isSaving,
          style: {
            backgroundColor: "#2563EB",
            borderColor: "#2563EB",
            color: "#fff",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="boothVulnerability" label="Vulnerability">
            <Select placeholder="Select an option" disabled={isFrozen || isSaving}>
              {options.map((option) => (
                <Option
                  key={option.value}
                  value={option.value}
                  style={{
                    backgroundColor: option.color,
                    color: "#000",
                    height: "40px",
                    lineHeight: "40px",
                  }}
                >
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BoothType;

import React from "react";
import { Table, Button, Modal } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ColumnType } from "antd/es/table";
import "../PartManager/CreatePart.css"

interface Section {
  id: number;
  partNo: string;
  sectionNo: string;
  sectionNameEn: string;
  sectionNameL1: string;
}

interface SectionTableProps {
  filteredSectionList: Section[];
  onDeleteSection: (id: number) => void;
  onEditSection: (section: Section) => void;
  loading: boolean;
  rowSelection?: any;
  isFrozen: boolean;
}

const SectionTable: React.FC<SectionTableProps> = ({
  filteredSectionList,
  onDeleteSection,
  onEditSection,
  loading,
  rowSelection,
  isFrozen,
}) => {
  const showDeleteConfirm = (section: Section) => {
    Modal.confirm({
      title: "Are you sure you want to delete this section?",
      content: `Part No: ${section.partNo}, Section No: ${section.sectionNo}`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      onOk: () => onDeleteSection(section.id),
    });
  };

  const columns: ColumnType<Section>[] = [
    {
      title: "Part No",
      dataIndex: "partNo",
      key: "partNo",
      defaultSortOrder: "ascend",
      sorter: (a, b) => {
        const partComparison = Number(a.partNo) - Number(b.partNo);
        return partComparison !== 0
          ? partComparison
          : Number(a.sectionNo) - Number(b.sectionNo);
      },
      sortDirections: ["ascend", "descend"],
      fixed: "left",
      width: 60,
    },
    {
      title: "Section No",
      dataIndex: "sectionNo",
      key: "sectionNo",
      width: 60,
    },
    {
      title: "Section Name English",
      dataIndex: "sectionNameEn",
      key: "sectionNameEnglish",
      width: 120,
    },
    {
      title: "Section Name L1",
      dataIndex: "sectionNameL1",
      key: "sectionNameL1",
      width: 120,
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditSection(record)}
            disabled={isFrozen}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
            disabled={isFrozen}
          />
        </div>
      ),
    },
  ];

  return (
    <Table<Section>
      columns={columns}
      rowSelection={rowSelection}
      dataSource={filteredSectionList}
      rowKey="id"
      bordered
      // style={{ backgroundColor: "#1D4ED85C" }}
      className="voters-list-table"
      rowClassName="table-header row-bg-color"
      loading={loading}
      pagination={{
        position: ["bottomCenter"],
        defaultPageSize: 10,
        showSizeChanger: false,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      }}
      scroll={{ x: "max-content" }}
    />
  );
};

export default SectionTable;

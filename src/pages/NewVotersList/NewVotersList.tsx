import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Row,
  Col,
  Avatar,
  Image,
  Spin,
  Button,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import { UserOutlined, CameraOutlined, EyeOutlined } from "@ant-design/icons";
import { RootState } from "../../redux/store";
import { getVotersApi } from "../../api/voterApi";
import moment from "moment";

const { Text } = Typography;

const NewVotersList = () => {
  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Data state variables
  const [votersList, setVotersList] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState({
    voters: false,
  });

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const userId = localStorage.getItem("userId");

  const formatName = (
    firstName: string = "",
    lastName: string = "",
    firstNameL1: string = "",
    lastNameL1: string = ""
  ) => {
    const clean = (name: string) => (name ? name.replace(/-/g, "").trim() : "");
    return [
      clean(firstName),
      clean(lastName),
      clean(firstNameL1),
      clean(lastNameL1),
    ]
      .filter(Boolean)
      .join(" ");
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      render: (_: any, __: any, index: number) =>
        currentPage * pageSize + index + 1,
    },
    {
      title: "Image",
      key: "image",
      render: (record: any) => (
        <div
          style={{
            width: 60,
            height: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {record.photo_url ? (
            <Image
              src={record.photo_url}
              alt="Voter"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              preview={{
                mask: (
                  <CameraOutlined style={{ color: "#fff", fontSize: "16px" }} />
                ),
              }}
            />
          ) : (
            <Avatar
              size={60}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#f0f0f0", color: "#8c8c8c" }}
            />
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: "EPIC Number",
      dataIndex: "epic_number",
      key: "epic_number",
    },
    {
      title: "Name",
      key: "name",
      render: (record: any) =>
        formatName(
          record.voterFnameEn,
          record.voterLnameEn,
          record.voterFnameL1,
          record.voterLnameL1
        ),
    },
    {
      title: "Age",
      key: "age",
      render: (record: any) => record.age || "N/A",
    },
    {
      title: "Relative Name",
      key: "relativeName",
      render: (record: any) =>
        formatName(
          record.rlnFnameEn,
          record.rlnLnameEn,
          record.rlnFnameL1,
          record.rlnLnameL1
        ),
    },
    {
      title: "Gender",
      key: "gender",
      render: (record: any) => {
        if (!record.gender) return "N/A";
        return (
          record.gender.charAt(0).toUpperCase() +
          record.gender.slice(1).toLowerCase()
        );
      },
    },
    {
      title: "Part No",
      dataIndex: "partNo",
      key: "partNo",
    },
    {
      title: "Section No",
      dataIndex: "sectionNo",
      key: "sectionNo",
      render: (sectionNumber: any) => {
        return sectionNumber !== null && sectionNumber !== undefined
          ? sectionNumber.toString()
          : "No data";
      },
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
      key: "serialNo",
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined style={{ color: "white" }} />}
          shape="circle"
          onClick={() => {
            setSelectedVoter(record);
            setIsModalVisible(true);
          }}
        />
      ),
      width: 100,
    },
  ];

  const fetchVoters = useCallback(
    async (page = currentPage, size = pageSize) => {
      if (!selectedElectionId) return;

      try {
        setLoading((prev) => ({ ...prev, voters: true }));

        const params = {
          electionId: selectedElectionId,
          page,
          size,
          accountId: userId,
          boothNumber: [0], // Always pass part 0
        };
        console.log("selected election id", selectedElectionId);
        console.log("Fetching new voters with params:", params);
        const response = await getVotersApi(params);
        const votersData = response.data?.voters?.content;
        console.log("votersData", votersData);

        const total = response.data?.totalElements || 0;

        const mappedData = votersData.map((voter: any, index: number) => ({
          ...voter,
          key: `${page}-${index}`,
          epic_number: `${voter.epic_number || "No data"}`,
          voterName: formatName(
            voter.voterFnameEn,
            voter.voterLnameEn,
            voter.voterFnameL1,
            voter.voterLnameL1
          ),
          age:
            voter.age !== undefined && voter.age !== null
              ? voter.age
              : voter.date_of_birth
              ? moment().diff(moment(voter.date_of_birth), "years")
              : "No Data",
          gender: voter.gender
            ? voter.gender.charAt(0).toUpperCase() +
              voter.gender.slice(1).toLowerCase()
            : "No data",
          relativeName: formatName(
            voter.rlnFnameEn,
            voter.rlnLnameEn,
            voter.rlnFnameL1,
            voter.rlnLnameL1
          ),
          partNumber: voter.partNo ?? "No data",
          sectionNumber:
            voter.sectionNo !== null && voter.sectionNo !== undefined
              ? voter.sectionNo
              : "No data",
          familyCount: voter.familyCount ?? "1",
          friendCount: voter.friendCount ?? "0",
          serialNumber: voter.serialNumber ?? "No data",
          pinCode: `${voter?.partManager?.pincode || "No Data"}`,
        }));

        setVotersList(mappedData);
        setTotalElements(total);
        setCurrentPage(page);
        setPageSize(size);
      } catch (error) {
        console.error("Error fetching new voters:", error);
        setVotersList([]);
        setTotalElements(0);
      } finally {
        setLoading((prev) => ({ ...prev, voters: false }));
      }
    },
    [selectedElectionId, currentPage, pageSize]
  );

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page - 1);
    setPageSize(size);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedVoter(null);
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchVoters();
    }
  }, [selectedElectionId, fetchVoters]);

  return (
    <div className="w-full h-full p-10 pt-5">
      <h3 className="text-2xl font-semibold mb-6">Form-6</h3>

      <Spin spinning={loading.voters}>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={votersList}
            rowClassName="table-header"
            className="voters-list-table"
            pagination={{
              current: currentPage + 1,
              pageSize,
              total: totalElements,
              position: ["bottomCenter"],
              onChange: handlePageChange,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} voters`,
            }}
            loading={loading.voters}
            scroll={{ x: "max-content" }}
            bordered
          />
        </div>
      </Spin>

      <Modal
        title="New Voter Details"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        centered
      >
        {selectedVoter && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="EPIC Number">
              <Text>{selectedVoter.epic_number || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              <Text>
                {formatName(
                  selectedVoter.voterFnameEn,
                  selectedVoter.voterLnameEn,
                  selectedVoter.voterFnameL1,
                  selectedVoter.voterLnameL1
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Age">
              <Text>{selectedVoter.age || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              <Text>
                {selectedVoter.gender
                  ? selectedVoter.gender.charAt(0).toUpperCase() +
                    selectedVoter.gender.slice(1).toLowerCase()
                  : "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Relative Name">
              <Text>
                {formatName(
                  selectedVoter.rlnFnameEn,
                  selectedVoter.rlnLnameEn,
                  selectedVoter.rlnFnameL1,
                  selectedVoter.rlnLnameL1
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Part No">
              <Text>{selectedVoter.partNo || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Section No">
              <Text>
                {selectedVoter.sectionNo !== null &&
                selectedVoter.sectionNo !== undefined
                  ? selectedVoter.sectionNo.toString()
                  : "No data"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Serial No">
              <Text>{selectedVoter.serialNo || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              <Text>{selectedVoter.mobileNo || "N/A"}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default NewVotersList;

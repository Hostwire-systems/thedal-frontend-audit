import { useEffect, useState } from "react";
import {
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import { getFormSubmissions } from "../../api/formApi";
import {
  Table,
  Button,
  Modal,
  Descriptions,
  Typography,
  Space,
  Tag,
  Divider,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const SurveyFormSubmissions = () => {
  const { id: formId } = useParams();
  const { setLoading } = useLoading();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getFileIcon = (fileType: string) => {
    if (fileType === "application/pdf") {
      return <FilePdfOutlined style={{ color: "red", fontSize: "24px" }} />;
    }
    if (fileType.startsWith("image/")) {
      return <FileImageOutlined style={{ color: "green", fontSize: "24px" }} />;
    }
    if (fileType === "text/plain") {
      return <FileTextOutlined style={{ color: "blue", fontSize: "24px" }} />;
    }
    return <FileUnknownOutlined style={{ color: "gray", fontSize: "24px" }} />;
  };

  const fetchSubmissions = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getFormSubmissions(
        parseInt(selectedElectionId),
        formId,
        { page: page - 1, pageSize: pageSize }
      );
      console.log("Fetched submissions:", response.data);
      setSubmissions(response.data.submissions || []);
      setPagination({
        current: response.data.pageNumber + 1,
        pageSize: response.data.pageSize,
        total: response.data.totalElements,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formId && selectedElectionId) {
      fetchSubmissions();
    }
  }, [formId, selectedElectionId]);

  const handleTableChange = (pagination: any) => {
    fetchSubmissions(pagination.current, pagination.pageSize);
  };

  const showSubmissionDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedSubmission(null);
  };

  const columns = [
    {
      title: "Voter ID",
      dataIndex: "submissionData",
      key: "voterId",
      render: (data: any) => data["Your Voter Id"] || "N/A",
    },
    {
      title: "Name",
      dataIndex: "submissionData",
      key: "name",
      render: (data: any) => data["Your Name"] || "N/A",
    },
    {
      title: "City/Village",
      dataIndex: "submissionData",
      key: "city",
      render: (data: any) => data["Your City/Village"] || "N/A",
    },
    {
      title: "Submitted At",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => showSubmissionDetails(record)}
          />
         
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Back to Forms
        </Button> */}

        <Title level={2} style={{ margin: 0 }}>
          Form Submissions
        </Title>
        <Table
          className="my-4 default-list-table"
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          pagination={{
            position: ["bottomCenter"],
            defaultPageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          style={{ backgroundColor: "#1D4ED85C" }}
          scroll={{ x: true }}
        />
      </Space>
      {/* Form Data Modal */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            Form Submission Details
          </Title>
        }
        open={isModalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="close" type="primary" onClick={closeModal}>
            Close
          </Button>,
        ]}
        width={800}
        bodyStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
      >
        {selectedSubmission && (
          <>
            <Descriptions
              column={1}
              bordered
              size="middle"
              labelStyle={{
                fontWeight: 600,
                backgroundColor: "#fafafa",
                width: "240px",
              }}
              contentStyle={{ backgroundColor: "#fff" }}
            >
              {Object.entries(selectedSubmission.submissionData).map(
                ([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {Array.isArray(value) ? (
                      <Space wrap>
                        {value.map((item, index) => (
                          <Tag key={index} color="blue">
                            {item}
                          </Tag>
                        ))}
                      </Space>
                    ) : typeof value === "object" && value !== null ? (
                      <>
                        {value.name ? (
                          <a
                            href={value.uri || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Space>
                              {getFileIcon(value.type)}
                              {value.name}
                            </Space>
                          </a>
                        ) : (
                          JSON.stringify(value)
                        )}
                      </>
                    ) : (
                      <Text>{String(value)}</Text>
                    )}
                  </Descriptions.Item>
                )
              )}

              <Descriptions.Item label="Submitted At">
                <Text type="secondary">
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ marginTop: 24, marginBottom: 0 }} />
          </>
        )}
      </Modal>
    </div>
  );
};

export default SurveyFormSubmissions;

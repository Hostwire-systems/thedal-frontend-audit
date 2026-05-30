import React, { useState } from "react";
import { Button, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { votersBulkUploadApi, getBulkUploadStatus } from "../../api/voterApi";
import { addBulkUpload } from "../../redux/slices/bulkUploadSlice";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import UploadProgressNotification from "./UploadProgressNotification";

const { Dragger } = Upload;

export default function VoterBulkUpload({ onFinish }) {
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const isValid = validTypes.includes(file.type);
      if (!isValid) {
        message.error(`${file.name} is not a valid CSV or Excel file.`);
      }
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("File must be smaller than 50MB!");
      }
      return (isValid && isLt50M) || Upload.LIST_IGNORE;
    },
    onChange: ({ fileList: updatedFileList }) => {
      setFileList(
        updatedFileList.map((file) => ({
          ...file,
          originFileObj: file.originFileObj || file,
        }))
      );
    },
    onRemove: () => {
      setFileList([]);
      setUploadProgress(0);
      setShowProgress(false);
    },
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/templates/voter-template.xlsx";
    link.download = "voter-template.xlsx";
    link.click();
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a CSV or Excel file to upload.");
      return;
    }

    setLoading(true);
    setShowProgress(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj);

    try {
      const response = await votersBulkUploadApi(
        formData,
        parseInt(selectedElectionId),
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      );

      if (response && response.status === "success") {
        const bulkUploadId = response.data.bulkUploadId;
        console.log("bulkUploadId", bulkUploadId);
        setCurrentUploadId(bulkUploadId);

        const statusResponse = await getBulkUploadStatus(
          bulkUploadId,
          parseInt(selectedElectionId)
        );
        dispatch(addBulkUpload(statusResponse));

        message.success("File uploaded successfully. Processing started.");
        setFileList([]);

        if (
          window.location.href.includes("/add-voter") ||
          window.location.href.includes("/elections/create")
        ) {
          navigate("/voterslist", { state: { bulkUploadId: bulkUploadId } });
        }
        // onFinish && onFinish();
      } else {
        message.error(response.message || "Failed to upload file.");
      }
    } catch (error) {
      const errorMessage =
        error.message || "There was an error uploading the file.";
      message.error(errorMessage);
      setUploadProgress(0);
      setShowProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Voter Bulk Upload</h2>
        <p className="text-gray-600 mb-6">
          Upload your CSV or Excel file containing voter records here.
        </p>

        <Dragger
          {...uploadProps}
          className="mb-8"
          style={{
            border: "2px solid #1849D6",
            borderRadius: "8px",
            padding: "20px",
            background: "#E7ECFC",
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: "#1849D6", fontSize: "48px" }} />
          </p>
          <p className="ant-upload-text text-lg">
            Drag your CSV or Excel file to start uploading
          </p>
          <p className="text-gray-500">or</p>
          <Button className="mt-2 text-[14px] font-normal text-[#1849D6] border-2 border-[#1849D6] rounded-lg hover:!bg-[#1849D6] hover:!text-white hover:border-[#1849D6] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]">
            Browse files
          </Button>
        </Dragger>

        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-2">Download Sample File</h4>
          <Button
            type="link"
            onClick={handleDownload}
            className="text-blue-600 hover:text-blue-800 p-0"
          >
            Download Excel Template
          </Button>
        </div>

        <Button
          type="primary"
          onClick={handleUpload}
          loading={loading}
          disabled={fileList.length === 0 || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded
          hover:!bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {showProgress && currentUploadId && (
        <UploadProgressNotification
          uploadId={currentUploadId}
          electionId={selectedElectionId}
          uploadProgress={uploadProgress}
        />
      )}
    </>
  );
}

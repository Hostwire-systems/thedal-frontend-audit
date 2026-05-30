import React, { useState } from "react";
import { Row, Col, Button, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { cadresBulkUploadApi } from "../../api/cadreApi";
import { useLoading } from "../../context/LoadingContext";

const { Dragger } = Upload;

export default function CadreBulkUpload({ onFinish }) {
  const [fileList, setFileList] = useState([]);
  //const [loading, setLoading] = useState(false); // NEW: Loading state for spinner
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      console.log("cadre file before upload", file);
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      ];
      const isValid = validTypes.includes(file.type);
      if (!isValid) {
        message.error(`${file.name} is not a valid CSV/Excel file.`);
      }
      return isValid || Upload.LIST_IGNORE;
    },
    onChange: ({ fileList: updatedFileList }) => {
      setFileList(
        updatedFileList.map((file) => ({
          ...file,
          originFileObj: file.originFileObj || file, // Ensure originFileObj is attached
        }))
      );
    },
    onRemove: (file) => {
      setFileList([]);
    },
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/templates/cadre-template.xlsx"; // File path to be downloaded
    link.download = "cadre-template.xlsx"; // File name for the download
    link.click();
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a CSV file to upload.");
      return;
    }

    setLoading(true); // Start spinner
    const formData = new FormData();
    console.log("fileList[0]", fileList[0]);
    formData.append("file", fileList[0].originFileObj);
    console.log(...formData.entries());
    try {
      console.log("selectedElectionId", selectedElectionId);
      const response = await cadresBulkUploadApi(
        formData,
        parseInt(selectedElectionId)
      );
      if (response && response.status === "success") {
        const { successCount = 0, failedCount = 0, failedRecords = [] } = response.data || {};
        
        // Show success message for uploaded cadres
        if (successCount > 0) {
          message.success(`Successfully uploaded ${successCount} cadre${successCount > 1 ? 's' : ''}!`);
        }
        
        // Show warning message for failed records
        if (failedCount > 0) {
          const failedDetails = failedRecords
            .slice(0, 5) // Show first 5 failures
            .map((record: any) => `Row ${record.rowNumber}: ${record.reason}`)
            .join('\n');
          
          const additionalFailures = failedCount > 5 ? `\n...and ${failedCount - 5} more` : '';
          
          message.warning(
            `${failedCount} record${failedCount > 1 ? 's' : ''} failed to upload:\n${failedDetails}${additionalFailures}`,
            10 // Show for 10 seconds
          );
        }
        
        setFileList([]); // Clear file list
        if (window.location.href.includes("/add-cadre")) {
          navigate("/cadre-list");
        }
        onFinish && onFinish();
      } else {
        console.log("Error response", response);
        message.error(response.message || "Failed to upload file.");
      }
    } catch (error) {
      console.error("Error response", error);
      message.error(error.message || "There was an error uploading the file.");
    } finally {
      setLoading(false); // End spinner
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Cadre Bulk Upload</h2>
      <p className="text-gray-600 mb-6">
        Upload your XLSX file containing cadre records here.
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
        loading={loading} // NEW: Spinner on button
        disabled={fileList.length === 0 || loading} // Disable while loading
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded
        hover:!bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
      >
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}

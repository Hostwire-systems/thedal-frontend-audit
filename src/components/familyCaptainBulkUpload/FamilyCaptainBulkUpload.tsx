import React, { useState } from "react";
import { Row, Col, Button, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
// import { familyCaptainsBulkUploadApi } from "../../api/familyCaptainApi"; // Adjusted API import
import { useLoading } from "../../context/LoadingContext";
import { familyCaptainBulkUploadApi } from "../../api/familyApi";
import { UploadFile } from "antd/es/upload/interface";

const { Dragger } = Upload;

interface FamilyCaptainBulkUploadProps {
  onFinish?: () => void;
}

export default function FamilyCaptainBulkUpload({ onFinish }: FamilyCaptainBulkUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { isLoading, setLoading } = useLoading();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const navigate=useNavigate();

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file: UploadFile) => {
      console.log("family captain file before upload", file);
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      ];
      const isValid = validTypes.includes(file.type || "");
      if (!isValid) {
        message.error(`${file.name} is not a valid CSV/Excel file.`);
      }
      return isValid || Upload.LIST_IGNORE;
    },
    onChange: ({ fileList: updatedFileList }: { fileList: UploadFile[] }) => {
      setFileList(updatedFileList);
    },
    onRemove: (file: UploadFile) => {
      setFileList([]);
    },
  };

  const handleDownloadExcel = () => {
    const link = document.createElement("a");
    link.href = "/family_captain_bulk_upload_sample.xlsx";
    link.download = "family_captain_bulk_upload_sample.xlsx";
    link.click();
  };

  const handleDownloadCSV = () => {
    const link = document.createElement("a");
    link.href = "/family_captain_bulk_upload_sample.csv";
    link.download = "family_captain_bulk_upload_sample.csv";
    link.click();
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a CSV or Excel file to upload.");
      return;
    }

    setLoading(true); // Start spinner
    const formData = new globalThis.FormData();
    console.log("fileList[0]", fileList[0]);
    
    const file = fileList[0].originFileObj;
    if (file) {
      formData.append("file", file);
    } else {
      message.error("File not found. Please select a file again.");
      setLoading(false);
      return;
    }
    
    try {
      console.log("selectedElectionId", selectedElectionId);
      
      if (!selectedElectionId) {
        message.error("Please select an election first.");
        setLoading(false);
        return;
      }
      
      const response = await familyCaptainBulkUploadApi(
        formData as any,
        parseInt(selectedElectionId)
      );
      
      if (response && response.status === "success") {
        // Show success message with upload summary
        const { data } = response;
        const successMessage = `Upload completed! ${data.successful_uploads} family captains uploaded successfully out of ${data.total_rows} records.`;
        
        // Show error details if any failures occurred
        if (data.failed_uploads > 0 && data.error_details) {
          message.warning(`${successMessage} Issues: ${data.error_details}`);
        } else {
          message.success(successMessage);
        }
        
        setFileList([]); // Clear file list
        
        // Always navigate to family captain list after successful upload
        navigate("/family-captain-list");
        onFinish && onFinish();
      } else {
        console.log("Error response", response);
        message.error(response.message || "Failed to upload file.");
      }
    } catch (error: any) {
      console.error("Error response", error);
      message.error(error.message || "There was an error uploading the file.");
    } finally {
      setLoading(false); // End spinner
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Family Captain Bulk Upload</h2>
      <p className="text-gray-600 mb-6">
        Upload your XLSX file containing family captain records here.
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
        <h4 className="text-lg font-semibold mb-2">Download Sample Files</h4>
        <div className="flex gap-4">
          <Button
            type="link"
            onClick={handleDownloadExcel}
            className="text-blue-600 hover:text-blue-800 p-0"
          >
            Download Excel Template
          </Button>
          <Button
            type="link"
            onClick={handleDownloadCSV}
            className="text-blue-600 hover:text-blue-800 p-0"
          >
            Download CSV Template
          </Button>
        </div>
      </div>

      <Button
        type="primary"
        onClick={handleUpload}
        loading={isLoading}
        disabled={fileList.length === 0 || isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded
         hover:text-white hover:border-blue-700 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
      >
        {isLoading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
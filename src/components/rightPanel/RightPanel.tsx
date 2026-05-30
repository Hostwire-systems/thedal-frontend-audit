import React, { useState, useEffect, useCallback } from "react";
import { List, Typography, Badge, Tabs } from "antd";
import { BASE_URL } from "../../config";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../../pages/dashboard/Dashboard.css";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import { getBulkUploadStatus } from "../../api/voterApi";
import BulkUploadDetailsModal from "./BulkUploadDetailsModal";

const { Text } = Typography;
const { TabPane } = Tabs;

/* ================= helpers for status ================= */
export const getStatusDisplay = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "FAILED":
      return "Failed";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return {
        icon: (
          <LoadingOutlined spin style={{ fontSize: 16, color: "#ff4d4f" }} />
        ),
        textColor: "#ff4d4f",
      };
    case "FAILED":
      return {
        icon: (
          <CloseCircleOutlined style={{ fontSize: 16, color: "#f5222d" }} />
        ),
        textColor: "#f5222d",
      };
    case "COMPLETED":
      return {
        icon: (
          <CheckCircleOutlined style={{ fontSize: 16, color: "#52c41a" }} />
        ),
        textColor: "#52c41a",
      };
    default:
      return {
        icon: (
          <CheckCircleOutlined style={{ fontSize: 16, color: "#52c41a" }} />
        ),
        textColor: "#52c41a",
      };
  }
};

/* =============== UTC → IST conversion utilities ================= */
/** IST offset in minutes (5 h 30 m) */
const IST_OFFSET_MINUTES = 330;

/** Converts the UTC startTime string to an IST dayjs instance (+5 h 30 m). */
const toISTStart = (utcString: string) =>
  dayjs(utcString).add(IST_OFFSET_MINUTES, "minute");

/** endTime already comes as IST in API, parse directly. */
const parseIST = (istString: string) => dayjs(istString);

/* ===================== component ===================== */
const UploadNotifications = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<any[]>([]);
  const [clearTime, setClearTime] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  const { loading } = useLoading();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const jwtToken = localStorage.getItem("jwtToken");
  const hasInProgressUploads = uploads.some((u) => u.status === "IN_PROGRESS");

  /* refresh running‑timer each second if any job is in progress */
  useEffect(() => {
    const hasInProgress = uploads.some((u) => u.status === "IN_PROGRESS");
    let timer: any;
    if (hasInProgress) {
      timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    }
    return () => timer && clearInterval(timer);
  }, [uploads]);

  /* open modal with bulk‑upload details */
  const handleNotificationClick = async (bulkUploadId: number) => {
    try {
      const res = await getBulkUploadStatus(bulkUploadId, selectedElectionId);
      setModalData(res);
      setModalVisible(true);
    } catch (err) {
      console.error("Error fetching bulk upload details:", err);
    }
  };

  /* fetch notifications list */
  const fetchUploads = useCallback(async () => {
    if (!selectedElectionId) return;
    try {
      let jwtTokenLatest = localStorage.getItem("jwtToken");
      const res = await axios.get(
        `${BASE_URL}/api/v1/voters/${parseInt(selectedElectionId)}/uploads`,
        {
          params: { page: 0, size: 10, sortBy: "startTime" },
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${jwtTokenLatest}`,
          },
        }
      );
      const data = res.data?.data?.content || [];
      setUploads(data);
      setFilteredUploads(
        clearTime
          ? data.filter((u) => toISTStart(u.startTime).isAfter(clearTime))
          : data
      );
    } catch (err) {
      console.error("Error fetching uploads:", err);
    }
  }, [clearTime, selectedElectionId]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  useEffect(() => {
    if (!selectedElectionId) {
      return;
    }

    const pollingIntervalMs = hasInProgressUploads ? 30000 : 60000;
    const id = setInterval(fetchUploads, pollingIntervalMs);
    return () => clearInterval(id);
  }, [fetchUploads, hasInProgressUploads, selectedElectionId]);

  const clearNotifications = () => {
    setClearTime(dayjs());
    setUploads([]);
    setFilteredUploads([]);
  };

  /* ---------- render helper functions ---------- */
  const getTimeAgo = (startUtc: string) =>
    toISTStart(startUtc).format("HH:mm:ss");

  const formatDate = (startUtc: string) => {
    const d = toISTStart(startUtc);
    return `${d.format("DD")}-${d.format("MMM")}-${d.format("YYYY")}`;
  };

  const getDuration = (
    startUtc: string,
    endIst: string,
    status: string
  ): string => {
    const start = toISTStart(startUtc);
    const endTime = toISTStart(endIst);
    const end =
      status === "COMPLETED" || status === "FAILED"
        ? parseIST(endTime)
        : currentTime;

    const seconds = end.diff(start, "second");
    if (seconds < 0 || Number.isNaN(seconds)) {
      return status === "FAILED" ? "Failed" : "Duration unknown";
    }
    if (seconds < 1) {
      return status === "FAILED"
        ? "Failed after less than a second"
        : "Less than a second";
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const duration =
      mins > 0
        ? `${mins} ${mins === 1 ? "minute" : "minutes"}${
            secs > 0 ? ` ${secs} ${secs === 1 ? "second" : "seconds"}` : ""
          }`
        : `${secs} ${secs === 1 ? "second" : "seconds"}`;

    if (status === "COMPLETED") return `Completed in ${duration}`;
    if (status === "FAILED") return `Failed after ${duration}`;
    return `Running for ${duration}`;
  };

  /* ===================== JSX ===================== */
  return (
    <div className="flex justify-between flex-col h-full">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Text strong className="text-lg">
            Notifications
          </Text>
          <Badge
            count={uploads.length}
            className="ml-2"
            style={{ backgroundColor: "#f5222d" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingLeft: 5 }}>
        <Tabs
          defaultActiveKey="1"
          tabBarStyle={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            gap: 6,
          }}
        >
          <TabPane
            tab={
              <div
                className="items-center justify-center w-full"
                onDoubleClick={clearNotifications}
              >
                <span style={{ color: "#2E3192" }}>
                  {`Notifications (${filteredUploads.length})`}
                </span>
              </div>
            }
            key="1"
          >
            <List
              loading={loading}
              dataSource={filteredUploads}
              renderItem={(item: any) => (
                <List.Item
                  onClick={() => handleNotificationClick(item.bulkUploadId)}
                  className="py-2 px-4 border-b cursor-pointer hover:bg-gray-100"
                  style={{ transition: "background-color 0.3s ease" }}
                >
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusStyles(item.status).icon}
                        <Text strong>{`Upload #${item.bulkUploadId}`}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text className="text-gray-500">
                          {formatDate(item.startTime)}
                        </Text>
                        <Text className="text-gray-500">
                          {getTimeAgo(item.startTime)}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-baseline pl-6">
                      <Text
                        style={{
                          color: getStatusStyles(item.status).textColor,
                          minWidth: 80,
                        }}
                      >
                        {getStatusDisplay(item.status)}
                      </Text>
                      <Text className="text-gray-500">
                        {getDuration(item.startTime, item.endTime, item.status)}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: "No notifications" }}
            />
          </TabPane>

          <TabPane tab="Activity Log" key="2" />
        </Tabs>
      </div>

      <BulkUploadDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={modalData}
      />
    </div>
  );
};

export default UploadNotifications;

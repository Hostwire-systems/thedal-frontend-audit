import React, { useState } from "react";
import { Button, Modal, Input, Typography } from "antd";
import MessagePage from "./MessagePage";

const { Title, Text } = Typography;

const BulkSms: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [currentPage, setCurrentPage] = useState<"initial" | "message">(
    "initial"
  );

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCampaignName("");
  };

  const handleCreateCampaign = () => {
    if (campaignName.trim()) {
      setCurrentPage("message");
      setIsModalVisible(false);
    }
  };

  const handleSendMessage = () => {
    // Reset to initial state after sending message
    setCampaignName("");
    setCurrentPage("initial");
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Heading and Create Campaign Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3} className="font-bold text-[31px]">
          Campaigns
        </Title>
        <Button
          type="primary"
          className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
            hover:!bg-[#1D4ED8] hover:text-[#fff]"
          onClick={handleOpenModal}
        >
          Create Campaign
        </Button>
      </div>

      {/* Dynamic Content */}
      <div style={{ marginTop: "20px" }}>
        {currentPage === "initial" ? (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <p>You have not created any SMS campaigns yet.</p>
            <p>
              Click on "Create Campaign" to start designing your first SMS
              campaign.
            </p>
          </div>
        ) : (
          <MessagePage
            campaignName={campaignName}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal
        title="Create an SMS Campaign"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button
            key="create"
            style={{
              backgroundColor: "#1D4ED8",
              borderColor: "#1D4ED8",
              color: "white",
            }}
            type="primary"
            onClick={handleCreateCampaign}
            disabled={!campaignName.trim()}
          >
            Create Campaign
          </Button>,
        ]}
      >
        <p>Send custom text to all cadres</p>
        <Input
          placeholder="Enter campaign name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          style={{ marginTop: "15px" }}
        />
      </Modal>
    </div>
  );
};

export default BulkSms;

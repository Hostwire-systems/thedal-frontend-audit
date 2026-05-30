// src/pages/pollDayManager/ViewVoterModal.tsx

import React from "react";
import { Modal, Descriptions, Button } from "antd";
import "./ViewVoterModal.css";

const ViewVoterModal = ({ visible, onCancel, voter, onVote }: any) => {

  const showConfirm = () => {
    Modal.confirm({
      title: "Confirm Vote",
      content: "Are you sure you want to mark this voter as voted?",
      onOk: () => {
        onVote(voter.voter_id);
        onCancel();
      },
      okText: "Yes",
      cancelText: "No",
    });
  };
  
  const formatAddress = (address) => {
    if (!address) return 'No Address Available';
    return `${address.street}, ${address.city}, ${address.state}, ${address.postal_code}, ${address.country}`;
  };


  const getFullName = () => {
    const firstName = voter?.voterFnameEn || '';
    const lastName = voter?.voterLnameEn || '';
    return [firstName, lastName].filter(Boolean).join(" ") || "No data";
  };

  return (
    <Modal
      open={visible}
      title="Voter Details"
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
        // !voter.hasVoted && (
        //   <Button
        //     key="vote"
        //     type="primary"
        //     onClick={showConfirm}
        //     className="vote-button-modal"
        //   >
        //     Mark as Voted
        //   </Button>
        // ),
      ]}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Voter ID">
          {voter?.epic_number || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="Name">
          {getFullName()}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">
          {voter?.gender || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="Age">
          {voter?.age || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="House Number">
          {voter?.houseNoEn || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="Part Name">
          {voter?.partNameEn || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="Section Name">
          {voter?.sectionNameEn || "No data"}
        </Descriptions.Item>
        <Descriptions.Item label="Has Voted">
          {voter?.hasVoted ? "Yes" : "No"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default ViewVoterModal;




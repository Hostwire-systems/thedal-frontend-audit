import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Input, List, message, Modal, Pagination, Spin, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  addVoterToFriends,
  deleteFriend,
  getVotersApi,
} from "../../api/voterApi";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const { Title, Text } = Typography;

interface Voter {
  epic_number: string;
  voterFnameEn: string;
  voterLnameEn?: string;
  friendGroupId?: string;
  isSearched?: boolean;
}

interface FriendsModalProps {
  voterData: {
    friendId?: string;
    friendsDetails?: any;
    epic_number: string;
  };
  fetchVoters: () => void;
  onCancel: () => void;
  visible: boolean;
}

const FriendsModal: React.FC<FriendsModalProps> = ({
  voterData,
  fetchVoters,
  onCancel,
  visible,
}) => {
  const selectedElectionId = localStorage.getItem("selectedElectionId") || "";
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  const [friendGroupId, setFriendGroupId] = useState<string | undefined>(
    voterData?.friendId
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEpic, setLoadingEpic] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSearchTerm("");
      setVoters([]);
      setFriendGroupId(voterData?.friendId);

      if (voterData?.friendsDetails?.length > 0) {
        const existingFriends: Voter[] = voterData.friendsDetails.map((f) => ({
          epic_number: f.epicNumber,
          voterFnameEn: f.name,
          isSearched: false,
        }));
        setVoters(existingFriends);
      } else if (voterData?.friendId) {
        fetchFriendVoters(voterData?.friendId);
      }
    }
  }, [visible, voterData?.friendId, voterData?.friendsDetails]);

  useEffect(() => {
    if (visible && voterData?.epic_number) {
      setSearchTerm("");
      setVoters([]);
      setFriendGroupId(voterData?.friendId);
      fetchFriendVoters(voterData.friendId || "");
    }
  }, [visible, voterData?.epic_number, voterData?.friendId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [voters]);

  const fetchFriendVoters = async (groupId: string) => {
    setLoading(true);
    try {
      const response = await getVotersApi({
        electionId: selectedElectionId,
        epic_number: voterData?.epic_number,
        size: 100,
      });
      const mainVoter = response.data?.voters?.content?.[0];

      if (!mainVoter) {
        setVoters([]);
        return;
      }

      const friendsDetails: Voter[] =
        mainVoter.friendsDetails?.map((f: any) => ({
          epic_number: f.epicNumber,
          voterFnameEn: f.name,
          isSearched: false,
          friendGroupId: groupId,
        })) || [];
      console.log("Friend voters", friendsDetails);
      setVoters(friendsDetails);
    } catch (error) {
      console.error("Error fetching friends:", error);
      message.error("Could not fetch friends.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      if (friendGroupId) fetchFriendVoters(friendGroupId);
      return;
    }
    if (searchTerm === voterData.epic_number) {
      message.warning("Search for someone else, not yourself.");
      return;
    }
    setLoading(true);
    try {
      const response = await getVotersApi({
        electionId: selectedElectionId,
        voterId: searchTerm,
      });

      const searched = (response.data?.voters?.content || []).map((v) => ({
        ...v,
        isSearched: true,
      }));
      setVoters(searched);
    } catch (error) {
      console.error("Search error:", error);
      message.error("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoterToFriends = async (friendEpicNumber: string) => {
    if (isFrozen) {
      message.warning("Election is frozen. Adding friends is disabled.");
      return;
    }
    console.log("[handleAddVoterToFriend] Invoked with:", friendEpicNumber);
    setLoadingEpic(friendEpicNumber);

    try {
      let updatedFriendId = friendGroupId;

      if (!updatedFriendId) {
        console.log(
          "[handleAddVoterToFriend] No friendId, attempting creation..."
        );
        console.log("EPIC Number", voterData.epic_number);
        try {
          const createResponse = await addVoterToFriends(
            undefined,
            selectedElectionId,
            voterData.epic_number
          );

          console.log(
            "[handleAddVoterToFriend] Creation response:",
            createResponse
          );

          if (
            createResponse?.data?.status === "success"
            //  &&
            // createResponse?.data?.code === 70139
          ) {
            console.log(
              "[handleAddVoterToFriend] Friend group created, fetching voter for ID..."
            );

            const checkResponse = await getVotersApi({
              electionId: selectedElectionId,
              voterId: voterData.epic_number,
            });

            const mainVoter = (checkResponse.data?.voters?.content || [])[0];
            if (mainVoter?.friendId) {
              updatedFriendId = mainVoter.friendId;
              setFriendGroupId(updatedFriendId);
              console.log(
                "[handleAddVoterToFriend] Found new friendId:",
                updatedFriendId
              );
            } else {
              message.error("Friend group created, but ID is missing.");
              return;
            }
          }
        } catch (createError: any) {
          if (createError?.response?.data?.code === 40752) {
            console.warn(
              "[handleAddVoterToFriend] Friend group already exists. Fetching..."
            );

            try {
              const checkResponse = await getVotersApi({
                electionId: selectedElectionId,
                voterId: voterData.epic_number,
              });

              const mainVoter = (checkResponse.data?.voters?.content || [])[0];
              if (mainVoter?.friendId) {
                updatedFriendId = mainVoter.friendId;
                setFriendGroupId(updatedFriendId);
                console.log(
                  "[handleAddVoterToFriend] Retrieved existing friendId:",
                  updatedFriendId
                );
              } else {
                console.error("Friend ID not found even after 40752 error.");
                message.error("Could not retrieve existing friend ID.");
                return;
              }
            } catch (fetchError) {
              console.error(
                "[handleAddVoterToFriend] Error retrieving existing friend ID:",
                fetchError
              );
              message.error("Failed to retrieve existing friend ID.");
              return;
            }
          } else {
            console.error(
              "[handleAddVoterToFriend] Error creating friend group:",
              createError
            );
            message.error("Failed to create friend group. Please try again.");
            return;
          }
        }
      }

      if (!updatedFriendId) {
        console.error(
          "[handleAddVoterToFriend] No friendId resolved—cannot proceed."
        );
        message.error("Unable to determine friend group ID.");
        return;
      }

      // Payload for adding a friend
      const payload = {
        friendId: updatedFriendId,
        friendEpicNumber,
      };
      console.log("payload", payload);

      console.log("[handleAddVoterToFriend] Sending payload:", payload);

      const addResponse = await addVoterToFriends(
        payload,
        selectedElectionId,
        voterData.epic_number
      );

      console.log("[handleAddVoterToFriend] addResponse:", addResponse);

      if (addResponse.data?.status === "success") {
        message.success("Voter added to friends successfully!");
        fetchFriendVoters(updatedFriendId);
        fetchVoters();
      } else {
        message.error(
          addResponse.data?.message || "Failed to add voter to friends."
        );
      }
    } catch (error) {
      console.error("[handleAddVoterToFriend] Unexpected error:", error);
      message.error("Failed to add voter to friends. Please try again.");
    } finally {
      setLoadingEpic(null);
    }
  };

  const handleDeleteFriend = async (epicNumber: string) => {
    if (isFrozen) {
      message.warning("Election is frozen. Removing friends is disabled.");
      return;
    }
    try {
      let voterId = voterData?.epic_number;
      await deleteFriend(selectedElectionId, voterId, epicNumber);
      message.success("Removed friend.");
      setVoters((prev) => prev.filter((v) => v.epic_number !== epicNumber));
      fetchVoters();
    } catch (err) {
      message.error("Failed to remove.");
    }
  };

  const confirmDelete = (epicNumber: string) => {
    Modal.confirm({
      title: "Remove this voter from friends?",
      content: `EPIC Number: ${epicNumber}`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: () => handleDeleteFriend(epicNumber),
    });
  };

  const handleCloseModal = () => {
    setSearchTerm("");
    setVoters([]);
    onCancel();
  };

  return (
    <Modal
      title={<Title level={4}>Friend Voters</Title>}
      open={visible}
      onCancel={handleCloseModal}
      footer={[
        <Button key="close" onClick={handleCloseModal}>
          Close
        </Button>,
      ]}
      centered
      width={600}
    >
      <div style={{ marginBottom: 24 }}>
        <Input
          placeholder="Search by EPIC Number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={handleSearch}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Button
          type="primary"
          onClick={handleSearch}
          loading={loading}
          disabled={loading}
          className="rounded bg-[#1D4ED8] border-[#1D4ED8]"
          style={{ marginBottom: 16, borderRadius: 8, color: "#fff" }}
        >
          Search
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin size="large" className="custom-spin-dark" />
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
          <List
            dataSource={voters.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )}
            renderItem={(voter) => {
              const isSameGroup =
                friendGroupId && friendGroupId === voter.friendGroupId;
              const isAlreadyFriend = isSameGroup || !voter.isSearched;

              return (
                <List.Item
                  key={voter.epic_number}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: voter.isSearched
                      ? "#fff0f6"
                      : isSameGroup
                      ? "#d9f7be"
                      : "transparent",
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Text strong style={{ fontSize: 16 }}>
                        {voter.voterFnameEn} {voter.voterLnameEn || ""}
                      </Text>
                    }
                    description={
                      <Text type="secondary">EPIC: {voter.epic_number}</Text>
                    }
                  />
                  {isAlreadyFriend ? (
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => confirmDelete(voter.epic_number)}
                    />
                  ) : (
                    <Button
                      type="primary"
                      loading={loadingEpic === voter.epic_number}
                      onClick={() => handleAddVoterToFriends(voter.epic_number)}
                      style={{ borderRadius: 8 }}
                    >
                      Add Friend
                    </Button>
                  )}
                </List.Item>
              );
            }}
          />
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={voters.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default FriendsModal;

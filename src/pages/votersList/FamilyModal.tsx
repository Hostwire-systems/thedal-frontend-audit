import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Input,
  List,
  message,
  Modal,
  Pagination,
  Spin,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  addVoterToFamily,
  deleteFamilyMember,
  getVotersApi,
} from "../../api/voterApi";
import "./FamilyModal.css"; // Keep your custom CSS if needed
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const { Title, Text } = Typography;

interface Voter {
  epic_number: string;
  voterFnameEn: string;
  voterLnameEn?: string;
  familyId?: string;
  isSearched?: boolean;
}

interface FamilyModalProps {
  voterData: {
    familyId?: string;
    epic_number: string;
  };
  currentPage: number;
  pageSize: number;
  fetchVoters: () => void;
  onCancel: () => void;
  visible: boolean;
}

const FamilyModal: React.FC<FamilyModalProps> = ({
  voterData,
  fetchVoters,
  onCancel,
  visible,
}) => {
  const selectedElectionId = localStorage.getItem("selectedElectionId") || "";
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  // Local state for familyId (may be created lazily if not present)
  const [familyId, setFamilyId] = useState<string | undefined>(
    voterData?.familyId
  );
  //pagination states for family modal
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  // Voters shown in the list (either family members or search results)
  const [voters, setVoters] = useState<Voter[]>([]);
  // Track text used for searching EPIC numbers
  const [searchTerm, setSearchTerm] = useState("");
  // Global loading (spinner in the center) for fetching list
  const [loading, setLoading] = useState(false);
  // Track which EPIC is being added (to show button-level loading)
  const [loadingEpic, setLoadingEpic] = useState<string | null>(null);

  // Reset state & fetch family members (if any) whenever the modal is shown
  useEffect(() => {
    if (visible) {
      setSearchTerm("");
      setVoters([]);
      setCurrentPage(1);
      setFamilyId(voterData?.familyId);

      if (voterData?.familyId) {
        fetchFamilyVoters(voterData?.familyId, 1);
      }
    }
  }, [visible, voterData?.familyId]);

  // Helper: fetch existing family members for a given familyId
  const fetchFamilyVoters = async (famId: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await getVotersApi({
        electionId: selectedElectionId,
        familyId: famId,
        size: pageSize,
        page: page - 1,
      });

      // Optionally exclude the main voter from the list
      const fetched = (response.data?.voters?.content ?? []).filter(
        (v: Voter) => v.epic_number !== voterData.epic_number
      );
      setVoters(fetched);
      setTotal(response.data?.voters?.totalElements || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching family voters:", error);
      message.error("Could not fetch family voters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle searching by EPIC
  // If empty, show existing family members (if any)
  // If non-empty, fetch that specific voter (mark isSearched)
  const handleSearch = async () => {
    if (!searchTerm) {
      // If search term is cleared, re-fetch the family
      if (familyId) {
        fetchFamilyVoters(familyId, 1);
      }
      return;
    }
    if (searchTerm === voterData.epic_number) {
      message.warning("Please search for a voter other than yourself.");
      return;
    }

    setLoading(true);
    try {
      const response = await getVotersApi({
        electionId: selectedElectionId,
        voterId: searchTerm,
      });

      const searchedVoters = (response.data?.voters?.content || []).map(
        (v: Voter) => ({
          ...v,
          isSearched: true,
        })
      );
      setVoters(searchedVoters);
      setTotal(searchedVoters.length);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching voter by EPIC:", error);
      message.error("Failed to fetch voter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add a voter to the family (possibly creating or retrieving the family first)
  const handleAddVoterToFamily = async (otherEpicNumber: string) => {
    if (isFrozen) {
      message.warning("Election is frozen. Adding to family is disabled.");
      return;
    }
    console.log("[handleAddVoterToFamily] Invoked with:", otherEpicNumber);
    
    // Check if the voter being added already has a different familyId
    const voterToAdd = voters.find(v => v.epic_number === otherEpicNumber);
    if (voterToAdd?.familyId && voterToAdd.familyId !== familyId) {
      // Show first confirmation modal
      Modal.confirm({
        title: "Voter Already in Another Family",
        content: "This voter is already added in another family, do you still want to add?",
        okText: "Yes",
        cancelText: "Cancel",
        onOk: () => {
          // Show second confirmation modal
          Modal.confirm({
            title: "Confirm Family Transfer",
            content: "This voter will be removed from earlier family and added here",
            okText: "Add",
            cancelText: "Cancel",
            onOk: () => {
              // Proceed with adding voter to family
              proceedWithAddingVoter(otherEpicNumber);
            },
          });
        },
      });
      return;
    }
    
    // If no conflict, proceed directly
    proceedWithAddingVoter(otherEpicNumber);
  };

  // Actual implementation of adding voter to family
  const proceedWithAddingVoter = async (otherEpicNumber: string) => {
    console.log("[proceedWithAddingVoter] Invoked with:", otherEpicNumber);
    setLoadingEpic(otherEpicNumber); // show spinner on the clicked button

    try {
      let updatedFamilyId = familyId;

      // If there's no local familyId yet, we try to create one
      if (!updatedFamilyId) {
        console.log(
          "[proceedWithAddingVoter] No familyId, attempting creation..."
        );

        try {
          // Attempt to create the family via addVoterToFamily
          // (We assume passing `undefined` triggers "create" logic in the backend)
          const createResponse = await addVoterToFamily(
            undefined,
            selectedElectionId,
            voterData.epic_number
          );

          console.log(
            "[proceedWithAddingVoter] Creation response:",
            createResponse
          );

          // If we got a success code but no familyId in the response, fetch from main voter
          if (
            createResponse?.data?.status === "success" &&
            createResponse?.data?.code === 70139
          ) {
            console.log(
              "[proceedWithAddingVoter] Family created, but no familyId returned. Fetching main voter to find it..."
            );

            const checkResponse = await getVotersApi({
              electionId: selectedElectionId,
              voterId: voterData.epic_number,
            });

            const mainVoter = (checkResponse.data?.voters?.content || [])[0];
            if (mainVoter?.familyId) {
              updatedFamilyId = mainVoter.familyId;
              console.log(
                "[proceedWithAddingVoter] Found newly created familyId:",
                updatedFamilyId
              );
              setFamilyId(updatedFamilyId);
            } else {
              message.error("Family created, but cannot determine its ID.");
              return;
            }
          }
        } catch (createError: any) {
          // If error code is 40752 => "Family ID already exists"
          if (createError?.response?.data?.code === 40752) {
            console.warn(
              "[proceedWithAddingVoter] Family already exists => fetching it..."
            );

            try {
              const checkResponse = await getVotersApi({
                electionId: selectedElectionId,
                voterId: voterData.epic_number,
              });
              console.log(
                "[proceedWithAddingVoter] checkResponse:",
                checkResponse
              );

              const mainVoter = (checkResponse.data?.voters?.content || [])[0];
              if (mainVoter?.familyId) {
                updatedFamilyId = mainVoter.familyId;
                console.log(
                  "[proceedWithAddingVoter] Found existing familyId:",
                  updatedFamilyId
                );
                setFamilyId(updatedFamilyId);
              } else {
                console.error(
                  "Could not find existing familyId, despite 40752 error."
                );
                message.error(
                  "Could not retrieve existing family ID from the server."
                );
                return;
              }
            } catch (fetchError) {
              console.error(
                "[proceedWithAddingVoter] Error retrieving existing family ID:",
                fetchError
              );
              message.error("Failed to retrieve existing family ID.");
              return;
            }
          } else {
            // Some other error
            console.error(
              "[proceedWithAddingVoter] Error creating family:",
              createError
            );
            message.error("Failed to create family. Please try again.");
            return;
          }
        }
      }

      // By now, updatedFamilyId should be either newly created or found
      if (!updatedFamilyId) {
        console.error(
          "[proceedWithAddingVoter] No familyId resolved—cannot proceed."
        );
        message.error("Unable to determine family ID. Cannot add voter.");
        return;
      }

      // Add the "other" voter to the (now guaranteed) family
      const payload = { otherEpicNumber, familyId: updatedFamilyId };
      console.log(
        "[proceedWithAddingVoter] Adding other voter with payload:",
        payload
      );

      const addResponse = await addVoterToFamily(
        payload,
        selectedElectionId,
        voterData.epic_number
      );

      console.log("[proceedWithAddingVoter] addResponse:", addResponse);

      if (addResponse.data?.status === "success") {
        message.success("Voter added to family successfully!");
        // Refresh the family list
        fetchFamilyVoters(updatedFamilyId);
        await fetchVoters();
      } else {
        message.error(
          addResponse.data?.message || "Failed to add voter to family."
        );
      }
    } catch (error) {
      console.error("[proceedWithAddingVoter] Unexpected error:", error);
      message.error("Failed to add voter to family. Please try again.");
    } finally {
      // Clear button-level loading
      setLoadingEpic(null);
    }
  };

  // Remove an existing family member from the UI
  const handleDeleteFamilyMember = async (epicNumber: string) => {
    if (isFrozen) {
      message.warning("Election is frozen. Removing from family is disabled.");
      return;
    }
    try {
      await deleteFamilyMember(selectedElectionId, epicNumber);
      message.success("Voter removed from family");
      // Filter them out locally
      setVoters((prev) => prev.filter((v) => v.epic_number !== epicNumber));
      fetchVoters();
    } catch (error) {
      console.error("Error removing family member:", error);
      message.error("Could not remove the voter from family.");
    }
  };

  // Show a confirmation prompt before removing from family
  const confirmDelete = (epicNumber: string) => {
    Modal.confirm({
      title: "Are you sure you want to remove this voter from the family?",
      content: `EPIC Number: ${epicNumber}`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      onOk: () => handleDeleteFamilyMember(epicNumber),
    });
  };

  // Close the modal
  const handleCloseModal = () => {
    setSearchTerm("");
    setVoters([]);
    onCancel();
  };

  return (
    <Modal
      title={<Title level={4}>Family Voters</Title>}
      open={visible}
      onCancel={handleCloseModal}
      footer={[
        <Button key="close" onClick={handleCloseModal}>
          Close
        </Button>,
      ]}
      centered
      width={600}
      className="family-modal"
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
          className="rounded bg-[#1D4ED8] border-[#1D4ED8] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8]"
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          Search
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin size="large" className="custom-spin-dark" />
        </div>
      ) : (
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          <List
            dataSource={voters}
            renderItem={(voter) => {
              const isSameFamily = familyId && familyId === voter.familyId;
              return (
                <List.Item
                  key={voter.epic_number}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: voter.isSearched
                      ? "#fff0f6"
                      : isSameFamily
                      ? "#d9f7be"
                      : "transparent",
                  }}
                  className="voter-list-item"
                >
                  <List.Item.Meta
                    title={
                      <Text strong style={{ fontSize: 16 }}>
                        {voter.voterFnameEn} {voter.voterLnameEn || ""}
                      </Text>
                    }
                    description={
                      <Text type="secondary">
                        EPIC Number: {voter.epic_number}
                      </Text>
                    }
                  />
                  {/* If same family, allow deletion */}
                  {isSameFamily ? (
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      className="text-red-600 hover:text-red-700 ml-4"
                      disabled={isFrozen}
                      onClick={() => confirmDelete(voter.epic_number)}
                    />
                  ) : (
                    // Otherwise, show "Add to Family"
                    <Button
                      type="primary"
                      style={{
                        backgroundColor: "#000",
                        borderColor: "#000",
                        borderRadius: 8,
                      }}
                      loading={loadingEpic === voter.epic_number}
                      disabled={loadingEpic === voter.epic_number || isFrozen}
                      onClick={() => handleAddVoterToFamily(voter.epic_number)}
                    >
                      Add to Family
                    </Button>
                  )}
                </List.Item>
              );
            }}
          />
          {!searchTerm && total > pageSize && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(page) => {
                  if (familyId) {
                    fetchFamilyVoters(familyId, page);
                  }
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default FamilyModal;

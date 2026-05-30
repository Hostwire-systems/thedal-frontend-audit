import {
  Button,
  Col,
  message,
  Modal,
  Row,
  Form,
  Input,
  Switch,
  notification,
  Spin,
  Tooltip,
} from "antd";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import NoElectionsCard from "../../components/Elections/NoElectionsCard";
import { useEffect, useState, useRef } from "react";
import { ElectionsCardProps } from "../../types";
import ElectionsCard from "../../components/Elections/ElectionCard";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  fetchElections,
  updateAllElections,
  updateSelectedElectionId,
} from "../../redux/slices/electionSlice";
import {
  confirmElectionDeleteApi,
  deleteElectionApi,
  reorderElectionsApi,
  uploadElectionApi,
  requestElectionFreezeOtp,
  verifyFreezeOtpAndFreezeElection,
  requestElectionUnfreezeOtp,
  verifyUnfreezeOtpAndUnfreezeElection,
  getAllElectionsApi,
} from "../../api/electionApi";
// Polling for merge status is handled inside the modal
import EditElectionModal from "../../components/editElectionModal";
import MergeStatusModal from "../../components/MergeStatusModal/MergeStatusModal";
import { useForm } from "antd/es/form/Form";

const { confirm } = Modal;

export default function Elections() {
  const [modalForm] = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [elections, setElections] = useState<ElectionsCardProps[]>([]);
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [userIdForOtp, setUserIdForOtp] = useState<number | null>(null);

  const [editingElection, setEditingElection] =
    useState<ElectionsCardProps | null>(null);
  const inputRef = useRef(null);
  const [loadingModal, setLoadingModal] = useState<boolean>();
  const [selectedElectionName, setSelectedElectionName] = useState<
    string | null
  >(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState<string | null>(null); // Store ID of election to be deleted
  const [deleteText, setDeleteText] = useState(""); // For capturing text input in the second modal
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  // Merge Status Modal states
  const [mergeStatusModalVisible, setMergeStatusModalVisible] = useState(false);
  const [mergeStatusTargetElection, setMergeStatusTargetElection] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  // Freeze/Unfreeze Modal states
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [freezeElectionId, setFreezeElectionId] = useState<string | null>(null);
  const [freezeElectionName, setFreezeElectionName] = useState<string>("");
  const [freezeAction, setFreezeAction] = useState<"FREEZE" | "UNFREEZE">("FREEZE");
  const [freezeTextInput, setFreezeTextInput] = useState("");
  const [freezeOtpModalVisible, setFreezeOtpModalVisible] = useState(false);
  const [freezeOtp, setFreezeOtp] = useState<string[]>(Array(6).fill(""));
  const [freezeOtpLoading, setFreezeOtpLoading] = useState(false);
  
  const selectedElectionId = useSelector(
    (state: RootState) => state.election?.selectedElectionId
  );
  // User Role
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasReadPermission = (module: string) =>
    rolesPermission?.[module]?.includes("R");

  // Removed home-level polling; modal handles progress checks on open

  const handleShowMergeStatus = () => {
    // Resolve from current elections, redux, or localStorage
    let list: any[] = [];
    if (Array.isArray(elections) && elections.length > 0) list = elections as any[];
    if (list.length === 0 && Array.isArray(allElections) && allElections.length > 0)
      list = allElections as any[];
    if (list.length === 0) {
      try {
        const fromLS = JSON.parse(localStorage.getItem("elections") || "[]");
        if (Array.isArray(fromLS) && fromLS.length > 0) list = fromLS;
      } catch {}
    }

    const selIdRaw = selectedElectionId || localStorage.getItem("selectedElectionId") || "";
    const selId = selIdRaw ? String(selIdRaw) : "";
    const pickId = (e: any) => e?.id ?? e?.electionId ?? e?.value ?? e?.key;
    const pickName = (e: any) => e?.electionName || e?.title || e?.name || "Election";

    let target: any = null;
    if (selId && list.length > 0) {
      target = list.find((e: any) => {
        const cid = pickId(e);
        return cid !== undefined && cid !== null && String(cid) === selId;
      });
    }
    if (!target && list.length > 0) target = list[0];

    // If we still have nothing and no selected id, we cannot proceed
    if (!target && !selId) {
      message.warning("No elections available for merge status");
      return;
    }

    const finalId = target ? String(pickId(target)) : String(selId);
    const finalName = target ? pickName(target) : "Election";

    setMergeStatusTargetElection({ id: finalId, name: finalName });
    setMergeStatusModalVisible(true);
  };

  // Open status for a specific target election (used by Merge modal shortcut)
  const openMergeStatus = (targetElectionId: string, targetElectionName: string) => {
    // Switch the globally selected election
    dispatch(updateSelectedElectionId(targetElectionId));
    setSelectedElectionName(targetElectionName);
    try {
      localStorage.setItem("selectedElectionId", String(targetElectionId));
    } catch {}

    notification.info({
      message: "Election Switched",
      description: `Election switched to ${targetElectionName}. Opening merge status…`,
      placement: "top",
      duration: 2,
    });

    // Open Merge Status for this election
    setMergeStatusTargetElection({ id: targetElectionId, name: targetElectionName });
    setMergeStatusModalVisible(true);
  };

  const handleAddVoter = (id: string) => {
    console.log("id", id);
    dispatch(updateSelectedElectionId(id));
    navigate("/add-voter");
  };

  // Handle Freeze/Unfreeze button click
  const handleFreezeUnfreeze = (electionId: string, isFrozen: boolean, electionName: string) => {
    setFreezeElectionId(electionId);
    setFreezeElectionName(electionName);
    setFreezeAction(isFrozen ? "UNFREEZE" : "FREEZE");
    setFreezeTextInput("");
    setFreezeModalVisible(true);
  };

  // Handle text input confirmation
  const handleFreezeTextConfirm = async () => {
    const expectedText = freezeAction === "FREEZE" ? "Freeze" : "Unfreeze";
    if (freezeTextInput !== expectedText) {
      message.error(`Please type "${expectedText}" exactly to confirm`);
      return;
    }

    setFreezeModalVisible(false);
    
    try {
      // Request OTP
      if (freezeAction === "FREEZE") {
        await requestElectionFreezeOtp(Number(freezeElectionId));
      } else {
        await requestElectionUnfreezeOtp(Number(freezeElectionId));
      }
      
      // Show OTP modal
      setFreezeOtpModalVisible(true);
      setFreezeOtp(Array(6).fill(""));
    } catch (error) {
      console.error("Error requesting OTP:", error);
    }
  };

  // Handle OTP verification
  const handleFreezeOtpVerify = async () => {
    const otpValue = freezeOtp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter complete OTP");
      return;
    }

    setFreezeOtpLoading(true);
    try {
      if (freezeAction === "FREEZE") {
        await verifyFreezeOtpAndFreezeElection(Number(freezeElectionId), otpValue);
      } else {
        await verifyUnfreezeOtpAndUnfreezeElection(Number(freezeElectionId), otpValue);
      }

      // Close modals first
      setFreezeOtpModalVisible(false);
      setFreezeOtp(Array(6).fill(""));
      
      // Force refresh from API by clearing localStorage first
      localStorage.removeItem("elections");
      
      // Fetch fresh data from API
      const response = await getAllElectionsApi();
      const freshElections = response.data;
      
      // Update Redux store
      dispatch(updateAllElections(freshElections));
      
      // Update local state
      setElections(freshElections);
      
      message.success(`Election ${freezeAction === "FREEZE" ? "frozen" : "unfrozen"} successfully`);
      
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setFreezeOtpLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    console.log("id", id);
    console.log("elections", elections);
    const selectedElection = elections.find((election) => election.id === Number(id));
    if (selectedElection) {
      const uniqueBooths = [...new Set(selectedElection.booths)];
      const uniqueStates = [...new Set(selectedElection.states)];

      setEditingElection({
        ...selectedElection,
        id: selectedElection.id,
      });
      console.log("about to exit handleEdit");
      console.log("selectedElection", selectedElection);
      console.log("uniqueStates", uniqueStates);
      setIsModalVisible(true);
    }
  };

  const handleElectionUpdated = async (updatedElection) => {
    console.log("updatedElection: ", updatedElection);
    const electionId = editingElection?.id; // Get the ID from the editingElection object
    console.log("electionId: ", electionId); // Debug log to verify
    const data = await uploadElectionApi(updatedElection, electionId); // Use electionId instead of updatedElection.id
    if (data.code === 20303) {
      const updatedElections = elections.map((election) =>
        election.id === electionId ? updatedElection : election
      );
      setElections(updatedElections);
      dispatch(updateAllElections(updatedElections));
      setIsModalVisible(false);
      message.success(data.message);
      localStorage.setItem("elections", JSON.stringify(updatedElections));
    }
    setLoadingModal(false);
  };

  const handleElectionDeleted = (deletedId: string) => {
    const updatedElections = elections.filter(
      (election) => election.id !== Number(deletedId)
    );
    console.log("updatedElections", updatedElections);

    setElections(updatedElections);
    dispatch(updateAllElections(updatedElections));

    if (updatedElections.length === 0) {
      // No elections left
      dispatch(updateSelectedElectionId(""));
      setSelectedElectionName(null);
      localStorage.removeItem("selectedElectionId");
    } else {
      // Pick the first election as the new selection
      const nextElection = updatedElections[0];
      dispatch(updateSelectedElectionId(nextElection.id.toString()));
      setSelectedElectionName(nextElection.electionName);
      localStorage.setItem("selectedElectionId", nextElection.id.toString());
      notification.info({
        message: "Election Switched Successfully!",
        description: `Election switched to ${nextElection.electionName}.`,
        placement: "top",
        duration: 3,
      });
    }

    localStorage.setItem("elections", JSON.stringify(updatedElections));
  };

  const handleDelete = (id: string) => {
    setElectionToDelete(id);
    // Show the first modal asking for confirmation to delete
    Modal.confirm({
      title: "Are you sure you want to delete this election?",
      content: "This action cannot be undone.",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        // If confirmed, show the second modal to type 'delete'
        setIsDeleteModalVisible(true);
      },
      onCancel: () => {
        setElectionToDelete(null); // Clear election to delete if canceled
      },
    });
  };

  // Add these new functions
  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        (
          document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement
        )?.focus();
      }
    }
  };

  const handleOtpKeydown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index]) {
      if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        (
          document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement
        )?.focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await confirmElectionDeleteApi(userIdForOtp!, otpValue);
      console.log("Response after election is deleted via OTP", response);
      if (response.data.status === "success") {
        message.success(
          response.data?.message || "Election deleted successfully!"
        );
        if (electionToDelete) {
          handleElectionDeleted(electionToDelete);
        }
        setShowOtpModal(false);
        setOtp(Array(6).fill(""));
      } else {
        message.error(response.data.message || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      message.error("Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeleteConfirmation = async () => {
    if (deleteText.toLowerCase() === "delete") {
      try {
        console.log("about to delete election");
        if (electionToDelete) {
          const response = await deleteElectionApi(electionToDelete);
          console.log("Response from delete election api", response);
          // Check if response indicates OTP is required
          if (response.code === 70252 && response.data?.userId) {
            setUserIdForOtp(response.data.userId);
            setShowOtpModal(true);
            setIsDeleteModalVisible(false);
            setDeleteText("");
          } else if ((response.status = "success")) {
            handleElectionDeleted(electionToDelete);
            message.success("Election deleted successfully");
          }
        }
      } catch (error) {
        console.error("Failed to delete election:", error);
      }
    } else {
      message.error("You must type 'delete' to confirm.");
    }
    setIsDeleteModalVisible(false); // Close the modal after confirmation
    setDeleteText(""); // Clear the input field
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleDeleteConfirmation();
    }
  };

  const handleOrderChange = async (newOrder: any) => {
    setElections(newOrder);
    dispatch(updateAllElections(newOrder));
    localStorage.setItem("elections", JSON.stringify(newOrder));

    //construct the payload for the API call
    const payload = newOrder.map((election, index) => ({
      electionId: election.id,
      newIndex: index,
    }));

    try {
      await reorderElectionsApi(payload);
      message.success("Elections reordered successfully");
    } catch (error) {
      console.error("Failed to reorder elections:", error);
    }
  };

  const handleOnDragEnd = (result: any) => {
    const { source, destination } = result;

    if (!destination) return; //if dragged out of bounds

    const reorderedElections = Array.from(elections);
    const [movedItem] = reorderedElections.splice(source.index, 1);
    reorderedElections.splice(destination.index, 0, movedItem);

    console.log("Reordered Elections:", reorderedElections);
    handleOrderChange(reorderedElections);
  };

  // Sync Redux state to local state
  useEffect(() => {
    if (allElections.length > 0) {
      if (JSON.stringify(elections) !== JSON.stringify(allElections)) {
        setElections(allElections);
      }
    }
  }, [allElections, elections]);

  // Initial load and localStorage fallback
  useEffect(() => {
    const savedElections = localStorage.getItem("elections");
    
    if (allElections.length === 0) {
      if (savedElections) {
        try {
          const parsedElections = JSON.parse(savedElections);
          if (JSON.stringify(allElections) !== JSON.stringify(parsedElections)) {
            dispatch(updateAllElections(parsedElections));
          }
        } catch (error) {
          console.error("Failed to parse saved elections", error);
          dispatch(fetchElections());
        }
      } else {
        dispatch(fetchElections());
      }
    }
  }, [dispatch, allElections]);

  useEffect(() => {
    if (isDeleteModalVisible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0); // Slight delay to ensure modal is fully rendered
    }
  }, [isDeleteModalVisible]);

  // Removed running jobs polling from Elections page; modal handles progress on open

  return (
    <Row gutter={[16, 16]} className="h-full p-5">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={18}>
          <h2 className="font-bold text-[31px] leading-8">Your Elections</h2>
        </Col>
        {elections.length > 0 && (
          <Col span={6} className="flex justify-end gap-3">
            <Tooltip title={"View merge job status"}>
              <Button
                className="h-[46px] rounded border text-[15px] font-semibold"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#000000',
                  color: '#000000',
                }}
                onClick={handleShowMergeStatus}
                disabled={!isSuperAdminOrAdmin && !hasReadPermission("electionsList")}
              >
                Merge Status
              </Button>
            </Tooltip>
            <Button
              className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
              hover:!bg-[#1D4ED8] hover:text-[#fff]
              hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
              onClick={() => navigate("/elections/create")}
              // disabled={userRole?.role==="VOLUNTEER"?true:false}
              disabled={
                !isSuperAdminOrAdmin && !hasCreatePermission("electionsList")
              }
            >
              Create Election
            </Button>
          </Col>
        )}
      </Row>

      <Col span={24} className="h-full">
        {elections.length === 0 ? (
          <NoElectionsCard />
        ) : (
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="cards" direction="horizontal">
              {(provided) => (
                <Row
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  gutter={[16, 16]}
                  className="w-full h-full mt-2"
                >
                  {elections.map((election, idx) => (
                    <Draggable
                      key={election.id.toString()}
                      draggableId={election.id.toString()}
                      index={idx}
                    >
                      {(provided) => (
                        <Col
                          sm={24}
                          md={8}
                          lg={8}
                          xl={8}
                          xxl={6}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ElectionsCard
                            id={election.id}
                            image={election.imageUrl}
                            title={election.electionName}
                            description={election.description}
                            electionType={election.electionType}
                            electionStatus={election.status}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            handleAddVoter={handleAddVoter}
                            electionCategory={election.category}
                            electionBody={election.body || ""}
                            electionBodyString={election.bodyString || ""}
                            electionState={
                              election.state || election.stateName || ""
                            }
                            electionReleaseDate={election.electoralReleaseDate}
                            electionsList={elections}
                            isFrozen={election.isFrozen}
                            onOpenMergeStatus={openMergeStatus}
                            onFreezeUnfreeze={handleFreezeUnfreeze}
                          />
                        </Col>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Row>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Col>

      {editingElection && (
        <EditElectionModal
          visible={isModalVisible}
          loadingModal={loadingModal}
          setLoadingModal={setLoadingModal}
          election={editingElection}
          editingElection={editingElection}
          onCancel={() => {
            setIsModalVisible(false);
            modalForm.resetFields();
          }}
          onUpdate={handleElectionUpdated}
          modalForm={modalForm}
        />
      )}

      <Modal
        title={
          <span>
            <ExclamationCircleOutlined
              style={{ color: "red", marginRight: 8 }}
            />
            Confirm Deletion
          </span>
        }
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirmation}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeleteText(""); // Clear the input if canceled
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: "#1677FF",
            borderColor: "#1677FF",
            color: "white",
          },
        }} // Apply the danger style to the "Delete" button
        cancelButtonProps={{ style: { marginRight: 8 } }}
      >
        <p>Type 'delete' to confirm the deletion</p>
        <Input
          ref={inputRef}
          onKeyDown={handleKeyPress}
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
          placeholder="Type 'delete' to confirm"
        />
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        title="Verify OTP"
        open={showOtpModal}
        onCancel={() => {
          setShowOtpModal(false);
          setOtp(Array(6).fill(""));
        }}
        footer={null}
        destroyOnClose
      >
        <div className="flex flex-col items-center">
          <p className="mb-4">
            Please enter the 6-digit OTP sent to your registered mobile number
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-input-${index}`}
                value={digit}
                onChange={(e) => handleOtpChange(e, index)}
                onKeyDown={(e) => handleOtpKeydown(e, index)}
                maxLength={1}
                className="otp-input text-center h-[62px] bg-[#F3F4F6]"
                autoComplete="off"
                inputMode="numeric"
                pattern="\d*"
              />
            ))}
          </div>

          <Button
            type="primary"
            onClick={handleVerifyOtp}
            loading={otpLoading}
            className="w-full h-[55px] font-bold text-[16px]"
          >
            Verify OTP
          </Button>
        </div>
      </Modal>

      {/* Merge Status Modal */}
      {mergeStatusTargetElection && (
        <MergeStatusModal
          visible={mergeStatusModalVisible}
          onCancel={() => {
            setMergeStatusModalVisible(false);
            setMergeStatusTargetElection(null);
          }}
          targetElectionId={mergeStatusTargetElection.id}
          targetElectionName={mergeStatusTargetElection.name}
        />
      )}

      {/* Freeze/Unfreeze Text Confirmation Modal */}
      <Modal
        title={`Confirm ${freezeAction === "FREEZE" ? "Freeze" : "Unfreeze"} Election`}
        open={freezeModalVisible}
        onCancel={() => {
          setFreezeModalVisible(false);
          setFreezeTextInput("");
        }}
        onOk={handleFreezeTextConfirm}
        okText="Proceed"
        cancelText="Cancel"
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 16 }}>
            You are about to {freezeAction === "FREEZE" ? "freeze" : "unfreeze"} the election:{" "}
            <strong>{freezeElectionName}</strong>
          </p>
          {freezeAction === "FREEZE" && (
            <p style={{ marginBottom: 16, color: "#ff4d4f" }}>
              ⚠️ Warning: Freezing will make this election read-only. No data modifications will be allowed.
            </p>
          )}
          <p style={{ marginBottom: 8 }}>
            Please type <strong>"{freezeAction === "FREEZE" ? "Freeze" : "Unfreeze"}"</strong> to confirm:
          </p>
          <Input
            placeholder={`Type ${freezeAction === "FREEZE" ? "Freeze" : "Unfreeze"}`}
            value={freezeTextInput}
            onChange={(e) => setFreezeTextInput(e.target.value)}
            onPressEnter={handleFreezeTextConfirm}
          />
        </div>
      </Modal>

      {/* Freeze/Unfreeze OTP Verification Modal */}
      <Modal
        title={`Verify OTP to ${freezeAction === "FREEZE" ? "Freeze" : "Unfreeze"} Election`}
        open={freezeOtpModalVisible}
        onCancel={() => {
          setFreezeOtpModalVisible(false);
          setFreezeOtp(Array(6).fill(""));
        }}
        footer={null}
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 16, textAlign: "center" }}>
            Enter the 6-digit OTP sent to your mobile number
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {freezeOtp.map((digit, index) => (
              <Input
                key={index}
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    const newOtp = [...freezeOtp];
                    newOtp[index] = value;
                    setFreezeOtp(newOtp);
                    
                    // Auto-focus next input
                    if (value && index < 5) {
                      const nextInput = document.getElementById(`freeze-otp-${index + 1}`);
                      nextInput?.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !freezeOtp[index] && index > 0) {
                    const prevInput = document.getElementById(`freeze-otp-${index - 1}`);
                    prevInput?.focus();
                  }
                }}
                id={`freeze-otp-${index}`}
                style={{
                  width: 45,
                  height: 45,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              />
            ))}
          </div>
          <Button
            type="primary"
            onClick={handleFreezeOtpVerify}
            loading={freezeOtpLoading}
            className="w-full h-[55px] font-bold text-[16px]"
          >
            Verify OTP
          </Button>
        </div>
      </Modal>
    </Row>
  );
}

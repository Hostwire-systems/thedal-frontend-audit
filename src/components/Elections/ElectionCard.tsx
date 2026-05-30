import React from "react";
import moment from "moment";
import { Card, Button, Modal, message, Tag } from "antd";
// import { ElectionsCardProps } from "../../types";
import { useNavigate } from "react-router-dom";
import { Edit, Merge, Trash2, UserPlus, Lock, Unlock } from "lucide-react";
import { useSelector } from "react-redux";
import MergeElectionModal from "../../components/mergeElectionModal/MergeElectionModal";

function formatElectionBody(electionBody: string): string {
  switch (electionBody.toUpperCase()) {
    case "URBAN_LOCAL":
      return "Urban Body (ULB)";
    case "RURAL_LOCAL":
      return "Rural Body (RLB)";
    default:
      return electionBody
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

function formatElectionStatus(electionStatus: string): string {
  if (!electionStatus) {
    return "No Data";
  }
  const words = electionStatus.split("-");
  const capitalisedWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  return capitalisedWords.join("-");
}

interface ElectionsCardProps {
  image: string;
  title: string;
  description: string;
  id: string | number;
  electionType: string;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAddVoter: (id: string) => void;
  electionCategory: string;
  electionBody: string;
  electionBodyString: string;
  electionStatus: string;
  electionState: string;
  electionReleaseDate: string;
  electionsList: any[];
  isFrozen?: boolean;
  onOpenMergeStatus?: (targetElectionId: string, targetElectionName: string) => void;
  onFreezeUnfreeze?: (electionId: string, isFrozen: boolean, electionName: string) => void;
}

const ElectionsCard: React.FC<ElectionsCardProps> = ({
  image,
  title,
  description,
  id,
  electionType,
  handleEdit,
  handleDelete,
  handleAddVoter,
  electionCategory,
  electionBody,
  electionBodyString,
  electionStatus,
  electionState,
  electionReleaseDate,
  electionsList,
  isFrozen = false,
  onOpenMergeStatus,
  onFreezeUnfreeze,
}) => {
  const [mergeModalVisible, setMergeModalVisible] = React.useState(false);

  const persistRoot = localStorage.getItem("persist:root");
  const auth = persistRoot ? JSON.parse(persistRoot).auth : null;
  const userRole = auth ? JSON.parse(auth).user : null;
  const navigate = useNavigate();
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole?.role === "ADMIN" || userRole?.role === "SUPER_ADMIN";

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  return (
    <>
      <Card
        className="w-[300px] px-2 pb-2 pt-6 election-card"
        hoverable
        cover={
          <img alt={title} src={image} className="h-[200px] object-contain" />
        }
      >
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-start">
            <h2 className="text-18 font-semibold leading-4 text-[#1F2937]">
              {title}
            </h2>
            {isFrozen && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                Frozen
              </Tag>
            )}
          </div>
          <p className="text-16 font-medium text-[#6B7280] m-0 p-0 whitespace-nowrap overflow-hidden text-ellpises">
            {/* {electionCategory || "n/a"} | {formatElectionBody(electionBody)} */}
            {electionReleaseDate
              ? moment(electionReleaseDate).format("DD-MMM-YYYY")
              : "No Data"}{" "}
            | {formatElectionStatus(electionStatus)}
          </p>
          <p className="text-16 font-medium text-[#6B7280] m-0 p-0 whitespace-nowrap overflow-hidden text-ellpises">
            {/* {electionState || "n/a"} |{" "}
          {electionPollingData
            ? moment(electionPollingData).format("DD-MMM-YYYY")
            : "n/a"} */}
            {electionBody
              ? formatElectionBody(electionBody)
              : electionBodyString}
          </p>
          <p className="text-16 font-medium text-[#6B7280] m-0 p-0 whitespace-nowrap overflow-hidden text-ellpises">
            {electionState}
          </p>
          <div className="flex justify-end space-x-2">
            {userRole?.role !== "VOLUNTEER" && (
              <>
                <Button
                  className="hover:!bg-[#1D4ED8]"
                  // disabled={userRole?.role === "VOLUNTEER" ? true : false}
                  disabled={
                    !isSuperAdminOrAdmin &&
                    !hasUpdatePermission("electionsList")
                  }
                  icon={<Edit size={16} />}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click from affecting draggable
                    handleEdit(String(id));
                  }}
                />
                <Button
                  className="hover:!bg-[#1D4ED8]"
                  icon={<Trash2 size={16} />}
                  // disabled={userRole?.role === "VOLUNTEER" ? true : false}
                  disabled={
                    !isSuperAdminOrAdmin &&
                    !hasDeletePermission("electionsList")
                  }
                  onClick={() => handleDelete(String(id))}
                />
                {/* Add Merge button */}
                <Button
                  className="hover:!bg-[#1D4ED8]"
                  icon={<Merge size={16} />}
                  disabled={!isSuperAdminOrAdmin && !hasUpdatePermission("electionsList")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMergeModalVisible(true);
                  }}
                />
                {/* Add Freeze/Unfreeze button */}
                <Button
                  className="hover:!bg-[#1D4ED8]"
                  icon={isFrozen ? <Unlock size={16} /> : <Lock size={16} />}
                  disabled={!isSuperAdminOrAdmin}
                  title={isFrozen ? "Unfreeze Election" : "Freeze Election"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFreezeUnfreeze) {
                      onFreezeUnfreeze(String(id), isFrozen, title);
                    }
                  }}
                />
              </>
            )}
            <Button
              className="hover:!bg-[#1D4ED8]"
              icon={<UserPlus size={16} />}
              disabled={
                !isSuperAdminOrAdmin && !hasCreatePermission("votersList")
              }
              onClick={() => handleAddVoter(String(id))}
            />
          </div>
        </div>
      </Card>
      {/* Add Merge Election Modal */}
      <MergeElectionModal
        visible={mergeModalVisible}
        onCancel={() => setMergeModalVisible(false)}
        sourceElectionId={String(id)}
        sourceElectionName={title}
        elections={electionsList}
        onOpenStatus={onOpenMergeStatus}
      />
    </>
  );
};

export default ElectionsCard;

import {
  BorderOutlined,
  CheckSquareFilled,
  CloseSquareFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import { ReactNode } from "react";
import { BenefitScheme, SchemeStatus } from "../../types/voter";

export const renderReligionDropdown = (
  menu: ReactNode,
  setIsReligionModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsReligionModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Religion
    </Button>
  </>
);

export const renderCasteDropdown = (
  menu: ReactNode,
  setIsCasteModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsCasteModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Caste
    </Button>
  </>
);

export const renderCasteCategoryDropdown = (
  menu: ReactNode,
  setIsCasteCategoryModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsCasteCategoryModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Caste Category
    </Button>
  </>
);

export const renderSubCasteDropdown = (
  menu: ReactNode,
  setIsSubCasteModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsSubCasteModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Sub Caste
    </Button>
  </>
);

export const renderPartyDropdown = (
  menu: ReactNode,
  setIsPartyModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsPartyModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Party
    </Button>
  </>
);

export const SchemeDropdown: React.FC<{
  schemes: BenefitScheme[];
  form: any;
  onAddNewScheme: () => void;
}> = ({ schemes, form, onAddNewScheme }) => {
  const currentStatuses: SchemeStatus[] =
    form.getFieldValue("schemeStatuses") ||
    schemes.map((s) => ({ schemeId: s.key, selected: null }));

  const cycleStatus = (schemeId: number) => {
    let updated = [...currentStatuses];

    // If this scheme isn't in currentStatuses yet, add it
    if (!updated.find((item) => item.schemeId === schemeId)) {
      updated.push({ schemeId, selected: null });
    }

    updated = updated.map((item) => {
      if (item.schemeId === schemeId) {
        return {
          ...item,
          selected:
            item.selected === null
              ? true
              : item.selected === true
              ? false
              : null,
        };
      }
      return item;
    });

    form.setFieldsValue({
      schemeStatuses: updated,
      scheme: updated
        .filter((item) => item.selected === true)
        .map((item) => item.schemeId),
      schemeName: updated
        .filter((item) => item.selected === true)
        .map((item) => item.schemeId),
    });
  };

  return (
    <div style={{ padding: 8 }}>
      {schemes.map((s) => {
        const status =
          currentStatuses.find((item) => item.schemeId === s.key)?.selected ??
          null;

        let icon;
        if (status === true) {
          icon = (
            <CheckSquareFilled style={{ fontSize: 20, color: "#1677ff" }} />
          );
        } else if (status === false) {
          icon = <CloseSquareFilled style={{ fontSize: 20, color: "red" }} />;
        } else {
          icon = <BorderOutlined style={{ fontSize: 20, color: "#aaa" }} />;
        }

        return (
          <div
            key={s.key}
            onClick={() => cycleStatus(s.key)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 0",
              cursor: "pointer",
            }}
          >
            <span style={{ marginRight: 8 }}>{icon}</span>
            <span>{s.schemeName}</span>
          </div>
        );
      })}

      <Button
        type="link"
        onClick={onAddNewScheme}
        style={{ padding: 8, width: "100%", textAlign: "center" }}
      >
        Add new Scheme
      </Button>
    </div>
  );
};

export const renderAvailabilityDropdown = (
  menu: ReactNode,
  setIsAvailabilityModalOpen: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsAvailabilityModalOpen(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Category
    </Button>
  </>
);

export const renderLanguageDropdown = (
  menu: ReactNode,
  setIsLanguageModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsLanguageModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Language
    </Button>
  </>
);

export const renderHistoryDropdown = (
  menu: ReactNode,
  setIsHistoryModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsHistoryModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Voting History
    </Button>
  </>
);

export const renderFeedbackDropdown = (
  menu: ReactNode,
  setIsFeedbackModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => (
  <>
    {menu}
    <Button
      type="link"
      onClick={() => setIsFeedbackModalVisible(true)}
      style={{ padding: 8, width: "100%", textAlign: "center" }}
    >
      Add new Feedback/Issue
    </Button>
  </>
);

import React, { useMemo, useState } from "react";
import { Modal, Table } from "antd";

interface BenefitSchemeCore {
  id: number;
  schemeName: string;
  schemeValue: number;
  imageUrl?: string | null;
  schemeBy: string;
}

interface VoterBenefitScheme {
  benefitScheme: BenefitSchemeCore;
  selected: boolean;
}

interface SchemesModalProps {
  visible: boolean;
  onCancel: () => void;
  schemes: VoterBenefitScheme[];
}

const SchemesModal: React.FC<SchemesModalProps> = ({ visible, onCancel, schemes }) => {
  const [pageSize, setPageSize] = useState<number>(10);

  const dataSource = useMemo(
    () =>
      (schemes || []).map((item) => ({
        key: item?.benefitScheme?.id ?? Math.random(),
        imageUrl: item?.benefitScheme?.imageUrl || "",
        schemeName: item?.benefitScheme?.schemeName || "",
        schemeBy: item?.benefitScheme?.schemeBy || "",
        schemeValue: item?.benefitScheme?.schemeValue ?? 0,
        selected: item?.selected ?? false,
      })),
    [schemes]
  );

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} width={900} title="Benefit Schemes">
      <Table
        size="small"
        dataSource={dataSource}
        pagination={{
          pageSize,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          position: ["bottomCenter"],
        }}
        columns={[
          {
            title: "Image",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url: string) =>
              url ? (
                <img
                  src={url}
                  alt=""
                  style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6 }}
                />
              ) : (
                "-"
              ),
            width: 100,
          },
          {
            title: "Scheme Name",
            dataIndex: "schemeName",
            key: "schemeName",
          },
          {
            title: "Scheme By",
            dataIndex: "schemeBy",
            key: "schemeBy",
          },
          {
            title: "Scheme Value",
            dataIndex: "schemeValue",
            key: "schemeValue",
            render: (val: number) => (typeof val === "number" ? val.toLocaleString("en-IN") : val),
            width: 140,
          },
          {
            title: "Selected",
            dataIndex: "selected",
            key: "selected",
            render: (sel: boolean) => (sel ? "✅" : "❌"),
            width: 120,
          },
        ]}
      />
    </Modal>
  );
};

export default SchemesModal;

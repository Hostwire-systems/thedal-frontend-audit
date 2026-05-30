import { Modal, Card, Radio, Select, Spin, message, Checkbox, Collapse, Row, Col, Tag } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";

const { Panel } = Collapse;

interface SchemeOption {
  key: number;
  schemeName: string;
}

interface PartOption {
  partNo: number;
  partNameEnglish?: string;
}

interface ColumnOption {
  id: string;
  label: string;
}

interface PdfExcelExportModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onExportWord?: () => void;
  availableParts?: (number | PartOption)[];
  selectedParts?: number[];
  onSelectedPartsChange?: (parts: number[]) => void;
  loadingParts?: boolean;
  loadingFormat?: "pdf" | "excel" | "word" | null;
  pdfColumns?: 2 | 3;
  onPdfColumnsChange?: (columns: 2 | 3) => void;
  availableSchemes?: SchemeOption[];
  selectedSchemeId?: number | null;
  onSelectedSchemeChange?: (schemeId: number | null) => void;
  loadingSchemes?: boolean;
  allowPdfExport?: boolean;
  allowExcelExport?: boolean;
  allowWordExport?: boolean;
  allowAllParts?: boolean;
  allPartsSelected?: boolean;
  onAllPartsChange?: (selected: boolean) => void;
  // Column selection props
  showColumnSelection?: boolean;
  selectedColumns?: string[];
  onSelectedColumnsChange?: (columnId: string, checked: boolean) => void;
  selectAllColumns?: boolean;
  onSelectAllColumnsChange?: (checked: boolean) => void;
  lockColumns?: boolean;
  columnCategories?: string[];
  getColumnsByCategory?: (category: string) => ColumnOption[];
  isCategorySelected?: (category: string) => boolean;
  isCategoryIndeterminate?: (category: string) => boolean;
  onCategorySelection?: (category: string, checked: boolean) => void;
  // Filter props
  showFilterCheckbox?: boolean;
  includeFilters?: boolean;
  onIncludeFiltersChange?: (include: boolean) => void;
}

const PdfExcelExportModal: React.FC<PdfExcelExportModalProps> = ({
  open,
  onClose,
  title = "Export Data",
  onExportPdf,
  onExportExcel,
  onExportWord,
  availableParts = [],
  selectedParts = [],
  onSelectedPartsChange,
  loadingParts = false,
  loadingFormat = null,
  pdfColumns = 2,
  onPdfColumnsChange,
  availableSchemes = [],
  selectedSchemeId = null,
  onSelectedSchemeChange,
  loadingSchemes = false,
  allowPdfExport = true,
  allowExcelExport = true,
  allowWordExport = false,
  allowAllParts = false,
  allPartsSelected = false,
  onAllPartsChange,
  // Column selection props
  showColumnSelection = false,
  selectedColumns = [],
  onSelectedColumnsChange,
  selectAllColumns = true,
  onSelectAllColumnsChange,
  lockColumns = false,
  columnCategories = [],
  getColumnsByCategory,
  isCategorySelected,
  isCategoryIndeterminate,
  onCategorySelection,
  // Filter props
  showFilterCheckbox = false,
  includeFilters = true,
  onIncludeFiltersChange,
}) => {
  const exportDisabled =
    loadingParts ||
    loadingSchemes ||
    (!allPartsSelected && selectedParts.length === 0);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DownloadOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          <span>{title}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={showColumnSelection ? 600 : 480}
    >
      <Spin
        spinning={loadingParts || loadingSchemes}
        tip={loadingParts ? "Loading part numbers..." : "Loading schemes..."}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Select Part Number
            </div>
            <Select
              mode="multiple"
              placeholder="Choose part number(s)"
              value={allPartsSelected ? ["all"] : selectedParts}
              onChange={(values) => {
                if (allowAllParts && values.includes("all")) {
                  onAllPartsChange?.(true);
                  onSelectedPartsChange?.([]);
                  return;
                }

                onAllPartsChange?.(false);
                const numericValues = values
                  .filter((v) => v !== "all")
                  .map(Number);
                onSelectedPartsChange?.(numericValues);
              }}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              disabled={!!loadingFormat}
            >
              {allowAllParts && (
                <Select.Option key="all" value="all">
                  All Parts
                </Select.Option>
              )}
              {availableParts.map((part) => {
                const partNo = typeof part === "number" ? part : part.partNo;
                const partName =
                  typeof part === "object" ? part.partNameEnglish : undefined;
                const label = partName
                  ? `${partNo} - ${partName}`
                  : `Part ${partNo}`;

                return (
                  <Select.Option key={partNo} value={partNo} label={label}>
                    {label}
                  </Select.Option>
                );
              })}
            </Select>
          </div>

          {showFilterCheckbox && (
            <Checkbox
              checked={includeFilters}
              onChange={(e) => onIncludeFiltersChange?.(e.target.checked)}
              disabled={!!loadingFormat}
            >
              Apply current filters to export
            </Checkbox>
          )}

          {showColumnSelection && (
            <div>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Select Columns to Export
              </div>
              {!lockColumns && (
                <Checkbox
                  checked={selectAllColumns}
                  onChange={(e) => onSelectAllColumnsChange?.(e.target.checked)}
                  style={{ marginBottom: 16, fontWeight: "bold" }}
                  disabled={!!loadingFormat}
                >
                  Select All Columns
                </Checkbox>
              )}

              {lockColumns && (
                <Tag color="blue" style={{ marginBottom: 16 }}>
                  {selectedColumns.length} required columns preselected
                </Tag>
              )}

              {!selectAllColumns && !lockColumns && (
                <Collapse accordion style={{ marginBottom: 16 }}>
                  {columnCategories.map((category) => (
                    <Panel
                      header={
                        <span
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "inline-block" }}
                        >
                          <Checkbox
                            checked={isCategorySelected?.(category)}
                            indeterminate={isCategoryIndeterminate?.(category)}
                            onChange={(e) => {
                              onCategorySelection?.(category, e.target.checked);
                            }}
                            disabled={!!loadingFormat}
                          >
                            {category}
                          </Checkbox>
                        </span>
                      }
                      key={category}
                    >
                      <Row gutter={[8, 8]}>
                        {getColumnsByCategory?.(category).map((column) => (
                          <Col span={12} key={column.id}>
                            <Checkbox
                              checked={selectedColumns.includes(column.id)}
                              onChange={(e) =>
                                onSelectedColumnsChange?.(
                                  column.id,
                                  e.target.checked
                                )
                              }
                              disabled={!!loadingFormat}
                            >
                              {column.label}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Panel>
                  ))}
                </Collapse>
              )}

              {!selectAllColumns && selectedColumns.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Tag color="blue">
                    {selectedColumns.length} columns selected
                  </Tag>
                </div>
              )}
            </div>
          )}

          {availableSchemes.length > 0 && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                Select Scheme
              </div>
              <Select
                placeholder="Choose a scheme"
                value={selectedSchemeId ?? "all"}
                onChange={(value) => {
                  if (value === "all") {
                    onSelectedSchemeChange(null);
                    return;
                  }

                  const parsedValue = Number(value);
                  onSelectedSchemeChange(Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null);
                }}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="children"
                disabled={loadingSchemes || !!loadingFormat}
              >
                <Select.Option key="all" value="all">
                  All Schemes
                </Select.Option>
                {availableSchemes.map((scheme) => (
                  <Select.Option key={scheme.key} value={scheme.key}>
                    {scheme.schemeName}
                  </Select.Option>
                ))}
              </Select>
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Choose a specific scheme to export only those voters, or keep All Schemes selected.
              </div>
            </div>
          )}

          {allowPdfExport && onPdfColumnsChange && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>PDF Layout</div>
              <Radio.Group
                value={pdfColumns}
                onChange={(event) => onPdfColumnsChange(event.target.value as 2 | 3)}
                disabled={!!loadingFormat}
              >
                <Radio.Button value={2}>2 Columns</Radio.Button>
                <Radio.Button value={3}>3 Columns</Radio.Button>
              </Radio.Group>
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Applies only to PDF export and uses the Family Export card layout.
              </div>
            </div>
          )}

          {allowExcelExport && (
            <Card
              hoverable={!exportDisabled && loadingFormat !== "pdf" && loadingFormat !== "word"}
              onClick={() => {
                if (exportDisabled) {
                  message.warning("Please select at least one part number.");
                  return;
                }

                if (onExportExcel) {
                  onExportExcel();
                } else {
                  message.info("Excel export API not implemented yet");
                }
              }}
              style={{
                border: "2px solid #217346",
                borderRadius: 8,
                cursor: exportDisabled || loadingFormat ? "not-allowed" : "pointer",
                opacity: exportDisabled && loadingFormat !== "excel" ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <FileExcelOutlined style={{ fontSize: 28, color: "#217346" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Export as Excel</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    XLSX format
                  </div>
                </div>
                {loadingFormat === "excel" && <Spin size="small" />}
              </div>
            </Card>
          )}

          {allowWordExport && (
            <Card
              hoverable={!exportDisabled && loadingFormat !== "pdf" && loadingFormat !== "excel"}
              onClick={() => {
                if (exportDisabled) {
                  message.warning("Please select at least one part number.");
                  return;
                }

                if (onExportWord) {
                  onExportWord();
                } else {
                  message.info("Word export API not implemented yet");
                }
              }}
              style={{
                border: "2px solid #2b579a",
                borderRadius: 8,
                cursor: exportDisabled || loadingFormat ? "not-allowed" : "pointer",
                opacity: exportDisabled && loadingFormat !== "word" ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <FileWordOutlined style={{ fontSize: 28, color: "#2b579a" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Export as Word</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    DOCX format
                  </div>
                </div>
                {loadingFormat === "word" && <Spin size="small" />}
              </div>
            </Card>
          )}

          {allowPdfExport && (
            <Card
              hoverable={!exportDisabled && loadingFormat !== "excel" && loadingFormat !== "word"}
              onClick={() => {
                if (exportDisabled) {
                  message.warning("Please select at least one part number.");
                  return;
                }

                if (onExportPdf) {
                  onExportPdf();
                } else {
                  message.info("PDF export API not implemented yet");
                }
              }}
              style={{
                border: "2px solid #ff4d4f",
                borderRadius: 8,
                cursor: exportDisabled || loadingFormat ? "not-allowed" : "pointer",
                opacity: exportDisabled && loadingFormat !== "pdf" ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <FilePdfOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Export as PDF</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    PDF format
                  </div>
                </div>
                {loadingFormat === "pdf" && <Spin size="small" />}
              </div>
            </Card>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default PdfExcelExportModal;

import React, { useEffect, useState } from "react";
import { Modal, Button, message, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const { Text } = Typography;

interface FamilyMember {
  key: string;
  epic_number: string;
  voterFnameEn: string;
  voterLnameEn: string;
  voterFnameL1: string;
  voterLnameL1: string;
  age: number;
  gender: string;
  starNumber: string;
  rlnType: string;
  rlnFnameEn: string;
  rlnLnameEn: string;
  rlnFnameL1: string;
  rlnLnameL1: string;
  partNo: number;
  sectionNo: number;
  fullAddress: string;
  serialNo: string;
  mobileNo?: string;
  photo_url?: string;
  religion?: { religionName: string };
  availability1?: { categoryName: string };
  party?: { partyName: string };
  caste?: { casteName: string };
}

interface ExportFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  familyIndex: number;
}

type LayoutOption = "two-column" | "three-column";

/** ---- helpers ---- */

const clean = (s?: string) => (s ? s.replace(/-/g, "").trim() : "");
const escapeHtml = (text: string) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/** Wait for all imgs inside container to settle (loaded or errored) */
const waitForImages = (container: HTMLElement, timeoutMs = 5000) =>
  new Promise<void>((resolve) => {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (imgs.length === 0) return resolve();
    let done = 0;
    const finish = () => {
      done += 1;
      if (done >= imgs.length) resolve();
    };
    imgs.forEach((img) => {
      if ((img as HTMLImageElement).complete) return finish();
      img.addEventListener("load", finish, { once: true });
      img.addEventListener("error", finish, { once: true });
    });
    // safety timeout
    setTimeout(resolve, timeoutMs);
  });

/** ---- component ---- */

const ExportFamilyModal: React.FC<ExportFamilyModalProps> = ({
  isOpen,
  onClose,
  familyMembers,
  familyIndex,
}) => {
  const [selectedLayout, setSelectedLayout] =
    useState<LayoutOption>("two-column");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) console.log("Family Members", familyMembers);
  }, [isOpen, familyMembers]);

  /** Build one member card (pure DOM). */
  const buildMemberCard = (member: FamilyMember): HTMLDivElement => {
    const card = document.createElement("div");

    // layout-derived measurements
    const isTwoCol = selectedLayout === "two-column";
    const cardHeight = isTwoCol ? 280 : 260; // used by pagination calc
    const fontSize = isTwoCol ? 13 : 12;
    const photoSize = isTwoCol ? 82 : 70;

    // card shell
    Object.assign(card.style, {
      height: `${cardHeight}px`,
      border: "1px solid #e5e7eb",
      borderRadius: "16px",
      padding: isTwoCol ? "16px" : "12px",
      boxSizing: "border-box",
      background: "#fff",
      position: "relative",
      boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 2px 8px rgba(16,24,40,.06)", // soft
    } as CSSStyleDeclaration);

    // top header (serial / section / part / icons)
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#1f2937",
      marginBottom: "8px",
    } as CSSStyleDeclaration);

    // --- LEFT (Star + Serial) ---
    const left = document.createElement("div");
    Object.assign(left.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: "600",
      fontSize: `${fontSize}px`,
    } as CSSStyleDeclaration);

    if (member.starNumber && String(member.starNumber).trim() !== "0") {
      const starEl = document.createElement("span");
      starEl.textContent = "⭐";
      starEl.style.cssText = "color:#ff69b4;font-size:16px;";
      left.appendChild(starEl);
    }

    const serial = document.createElement("span");
    serial.textContent = `Serial No: ${member.serialNo || "N/A"}`;
    serial.style.color = "#1890ff";
    left.appendChild(serial);

    // --- MIDDLE (Section) ---
    const middle = document.createElement("div");
    Object.assign(middle.style, {
      fontWeight: "600",
      fontSize: `${fontSize}px`,
      color: "#1890ff",
    });
    middle.textContent = `Section No: ${member.sectionNo ?? "N/A"}`;

    // --- RIGHT (Part + Icons) ---
    const right = document.createElement("div");
    Object.assign(right.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontWeight: "600",
      fontSize: `${fontSize}px`,
    } as CSSStyleDeclaration);

    const part = document.createElement("span");
    part.textContent = `Part No: ${member.partNo ?? "N/A"}`;
    part.style.color = "#1890ff";
    right.appendChild(part);

    // religion & availability icons
    const rel = member.religion?.religionName?.toLowerCase() || "";
    const isHindu = rel.includes("hindu");
    const isMuslim = rel.includes("muslim");
    const isChristian = rel.includes("christian");

    const showCrossIcon =
      !member.availability1?.categoryName?.trim() ||
      member.availability1?.categoryName
        ?.trim()
        .toLowerCase()
        .includes("unavailable");

    if (isHindu) {
      const s = document.createElement("span");
      s.textContent = "🕉️";
      s.style.cssText = "font-size:18px;color:#ef4444;";
      right.appendChild(s);
    }
    if (isChristian) {
      const s = document.createElement("span");
      s.textContent = "✝️";
      s.style.cssText = "font-size:18px;color:#ef4444;";
      right.appendChild(s);
    }
    if (isMuslim) {
      const s = document.createElement("span");
      s.textContent = "☪️";
      s.style.cssText = "font-size:18px;color:#ef4444;";
      right.appendChild(s);
    }
    if (showCrossIcon) {
      const s = document.createElement("span");
      s.textContent = "❌";
      s.style.cssText = "font-size:18px;color:#ef4444;";
      right.appendChild(s);
    }

    // append in order → left | middle | right
    header.appendChild(left);
    header.appendChild(middle);
    header.appendChild(right);

    // fine divider
    const topRule = document.createElement("div");
    topRule.style.cssText =
      "border-top:1px solid #eef0f3;margin:8px 0 10px 0;width:100%;";

    // main content row
    const main = document.createElement("div");
    main.style.cssText = "display:flex; gap:12px;";

    // photo block
    const photoWrap = document.createElement("div");
    photoWrap.style.cssText =
      "flex:none; display:flex; flex-direction:column; align-items:center; gap:8px;";

    const photo = document.createElement("div");
    photo.style.cssText = `
      width:${photoSize + 20}px; height:${photoSize + 20}px; position:relative;
      background:#0f172a; border-radius:16px; overflow:hidden;
      border:1px solid #d9d9d9; display:flex; align-items:center; justify-content:center;
    `;

    // img + fallback icon (we show icon until image loads successfully)
    const userIcon = document.createElement("div");
    userIcon.innerHTML = `
      <svg viewBox="64 64 896 896" focusable="false" width="28" height="28" fill="#ffffff" aria-hidden="true">
        <path d="M858.5 763.6a374.6 374.6 0 0 0-81.5-119.5A374.6 374.6 0 0 0 657.6 562
        374.6 374.6 0 0 0 512 528c-54.3 0-106.1 11.5-154.1 34.1A374.6 374.6 0 0 0 247
        644.1a374.6 374.6 0 0 0-81.5 119.5 372.3 372.3 0 0 0-30.4 146.3h64
        a308.3 308.3 0 0 1 25.1-124.1c16.1-36.5 39.2-69.4 68.6-97.8 29.3-28.4 63.5-50.5
        101.4-65.7C438 600.5 474.6 592 512 592s74 8.5 107.8 24.3c37.9 15.2 72.1
        37.3 101.4 65.7 29.3 28.4 52.5 61.3 68.6 97.8 16.1 36.5 25.1 76.5
        25.1 124.1h64a372.3 372.3 0 0 0-30.4-146.3zM512 512c79.5 0
        144-64.5 144-144S591.5 224 512 224 368 288.5 368 368s64.5 144
        144 144z"/>
      </svg>
    `;

    const img = document.createElement("img");
    img.style.cssText =
      "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none;";
    img.crossOrigin = "anonymous"; // enables useCORS path in html2canvas

    const photoUrl = (member.photo_url || "").trim();
    if (photoUrl) {
      img.src = photoUrl;
      img.onload = () => {
        userIcon.style.display = "none";
        img.style.display = "block";
      };
      img.onerror = () => {
        // keep icon visible
      };
    }
    photo.appendChild(img);
    photo.appendChild(userIcon);

    // EPIC ribbon – never cut off
    const epic = document.createElement("div");
    epic.textContent = member.epic_number || "N/A";
    epic.style.cssText = `
      position:absolute; left:0; right:0; bottom:0;
  background:#1890ff; color:#fff; 
  font-weight:700; font-size:${isTwoCol ? 11 : 10}px;
  padding:0px 8px 8px; text-align:center; 
  border-bottom-left-radius:16px; border-bottom-right-radius:16px;
   box-sizing:border-box; max-width:100%;
  white-space: normal; 
  overflow: visible; 
  word-break: break-word;
    `;
    photo.appendChild(epic);

    photoWrap.appendChild(photo);

    // Names
    const names = document.createElement("div");
    names.style.cssText = "flex:1;";

    const namesInner = document.createElement("div");
    namesInner.style.cssText = `font-size:${fontSize}px; line-height:1.25;`;

    const voterEn = document.createElement("div");
    voterEn.style.cssText =
      "font-weight:800; margin-bottom:4px; color:#111827; font-size:14px;";
    voterEn.textContent = `${clean(member.voterFnameEn)} ${clean(
      member.voterLnameEn
    )}`.trim();

    const voterL1 = document.createElement("div");
    voterL1.style.cssText =
      "font-weight:600; margin-bottom:10px; color:#111827;";

    voterL1.textContent = `${clean(member.voterFnameL1)} ${clean(
      member.voterLnameL1
    )}`.trim();

    const rlnEn = document.createElement("div");
    rlnEn.style.cssText = `margin-bottom:3px; color:#6b7280; font-size:${
      isTwoCol ? 12 : 11
    }px;`;
    rlnEn.textContent = `${clean(member.rlnFnameEn)} ${clean(
      member.rlnLnameEn
    )}`.trim();

    const rlnL1 = document.createElement("div");
    rlnL1.style.cssText = `margin-bottom:4px; color:#6b7280; font-size:${
      isTwoCol ? 12 : 11
    }px;`;
    rlnL1.textContent = `${clean(member.rlnFnameL1)} ${clean(
      member.rlnLnameL1
    )}`.trim();

    namesInner.appendChild(voterEn);
    namesInner.appendChild(voterL1);
    namesInner.appendChild(rlnEn);
    namesInner.appendChild(rlnL1);
    names.appendChild(namesInner);

    main.appendChild(photoWrap);
    main.appendChild(names);

    // bottom meta pinned at bottom with divider above
    const bottom = document.createElement("div");
    bottom.style.cssText =
      "position:absolute; left:16px; right:16px; bottom:14px;";

    const metaRow = document.createElement("div");
    metaRow.style.cssText =
      "display:flex; align-items:center; gap:10px; margin-bottom:8px; color:#6b7280;";

    const ageIcon = document.createElement("span");
    ageIcon.textContent =
      member.gender?.toLowerCase() === "female" ? "👩" : "👤";
    ageIcon.style.cssText = "color:#ff69b4;";

    const ageText = document.createElement("span");
    ageText.style.cssText = "font-size:12px;";
    ageText.textContent = member.age ? `${member.age}` : "—";

    const sep = document.createElement("span");
    sep.textContent = "|";
    sep.style.cssText = "color:#d1d5db;";

    const rType = document.createElement("span");
    rType.style.cssText = "font-size:12px;";
    rType.textContent = member.rlnType || "N/A";

    metaRow.appendChild(ageIcon);
    metaRow.appendChild(ageText);
    metaRow.appendChild(sep);
    metaRow.appendChild(rType);

    const addr = document.createElement("div");
    addr.style.cssText = "font-size:12px; color:#374151; margin-bottom:8px;";
    addr.textContent = member.fullAddress || "N/A";

    const hr = document.createElement("div");
    hr.style.cssText = "border-top:1px solid #eef0f3; margin:8px 0;";

    const foot = document.createElement("div");
    foot.style.cssText =
      "display:flex; align-items:center; justify-content:space-between; font-size:12px; color:#111827;";

    const phone = document.createElement("div");
    phone.innerHTML = `<span style="color:#1890ff;margin-right:8px;">📞</span><span>${
      member.mobileNo || "N/A"
    }</span>`;

    const caste = document.createElement("div");
    caste.style.cssText = "color:#6b7280;";
    caste.textContent = `Caste: ${member.caste?.casteName || "N/A"}`;

    const rightIcons = document.createElement("div");
    rightIcons.style.cssText = "display:flex; align-items:center; gap:6px;";
    const fam = document.createElement("span");
    fam.textContent = "👥";
    const party = document.createElement("span");
    if (member.party?.partyName) {
      party.textContent = "🎪";
      party.style.cssText = "color:#52c41a;";
      rightIcons.appendChild(party);
    }
    rightIcons.appendChild(fam);

    foot.appendChild(phone);
    foot.appendChild(caste);
    foot.appendChild(rightIcons);

    bottom.appendChild(metaRow);
    bottom.appendChild(addr);
    bottom.appendChild(hr);
    bottom.appendChild(foot);

    // assemble card
    card.appendChild(header);
    card.appendChild(topRule);
    card.appendChild(main);
    card.appendChild(bottom);

    return card;
  };

  /** Create ONE page (with header + grid of cards) for a slice of members. */
  const buildPage = (
    members: FamilyMember[],
    pageWidth = 800,
    pageIndex: number,
    totalMembers: number
  ): HTMLDivElement => {
    const isTwoCol = selectedLayout === "two-column";
    const gap = isTwoCol ? 16 : 12;

    const page = document.createElement("div");
    Object.assign(page.style, {
      position: "relative",
      width: `${pageWidth}px`,
      background: "#ffffff",
      padding: "20px",
      boxSizing: "border-box",
    } as CSSStyleDeclaration);

    // Only show header on the first page
    if (pageIndex === 0) {
      const head = document.createElement("div");
      head.style.cssText = "text-align:center; margin-bottom:12px;";
      head.innerHTML = `
        <h3 style="margin:0;color:#1D4ED8;font-size:22px;font-weight:800;">Family ${
          familyIndex + 1
        } Members</h3>
        <p style="color:#6b7280;margin:6px 0 0 0;font-size:12px;">Total Members: ${totalMembers}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0 0 0;">
      `;
      page.appendChild(head);
    }

    const grid = document.createElement("div");
    grid.style.cssText = `
      display:grid;
      grid-template-columns: ${isTwoCol ? "1fr 1fr" : "1fr 1fr 1fr"};
      gap:${gap}px;
    `;
    members.forEach((m) => grid.appendChild(buildMemberCard(m)));
    page.appendChild(grid);

    return page;
  };

  /** Convert a page element to a PDF image and append to jsPDF. */
  const rasterizePageToPdf = async (
    pdf: jsPDF,
    pageEl: HTMLDivElement,
    isFirst: boolean
  ) => {
    // wait images for this page
    await waitForImages(pageEl);

    // A4 portrait
    const mmWidth = 210;
    const mmHeight = 297;
    // render with higher pixel density for sharpness
    const scale = 2;

    const canvas = await html2canvas(pageEl, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: pageEl.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/png");
    // compute image size to fit A4 width while respecting aspect ratio
    const imgWidthMm = mmWidth;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    if (!isFirst) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, imgWidthMm, imgHeightMm);
  };

  /** Handle export with pagination by FULL ROWS (no card ever split). */
  const handleExport = async () => {
    if (familyMembers.length === 0) {
      message.error("No family members to export");
      return;
    }

    try {
      setIsExporting(true);
      const hide = message.loading("Generating PDF...", 0);

      // layout metrics
      const isTwoCol = selectedLayout === "two-column";
      const pageWidthPx = 800; // render width for DOM pages
      const pageHeightPx = Math.round(pageWidthPx * 1.414); // A4 aspect
      const pagePadding = 20;
      const headerReserve = 110; // title + hr height allowance
      const gap = isTwoCol ? 16 : 12;
      const cardHeight = isTwoCol ? 280 : 260;

      // compute rows per page (header + paddings + N*(cardHeight+gap))
      const usableH = pageHeightPx - headerReserve - pagePadding * 2; // space left for grid
      const rowHeight = cardHeight + gap;
      const rowsPerPage = Math.max(1, Math.floor((usableH + gap) / rowHeight));
      const cols = isTwoCol ? 2 : 3;
      const cardsPerPage = rowsPerPage * cols;

      // group by page as full rows
      const pagesMembers = chunk(familyMembers, cardsPerPage);

      // render each page separately and stream to PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pagesMembers.length; i++) {
        const pageMembers = pagesMembers[i];

        // temp container per page
        const page = buildPage(
          pageMembers,
          pageWidthPx,
          i, // page index
          familyMembers.length // total members count
        );

        // attach offscreen
        const host = document.createElement("div");
        host.style.cssText =
          "position:absolute; left:-99999px; top:-99999px; width:0; height:0; overflow:hidden;";
        host.appendChild(page);
        document.body.appendChild(host);

        // wait a tick to render layout
        await new Promise((r) => setTimeout(r, 50));

        await rasterizePageToPdf(pdf, page, i === 0);

        // cleanup this page
        document.body.removeChild(host);
      }

      const fileName = `Family_${familyIndex + 1}_Members_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);

      hide();
      message.success("PDF exported successfully!");
      onClose();
    } catch (err) {
      console.error("Error generating PDF:", err);
      message.destroy();
      message.error(
        `Failed to generate PDF: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      title="Export Family Members"
      open={isOpen}
      onCancel={isExporting ? undefined : onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={isExporting}
          disabled={familyMembers.length === 0}
          style={{ backgroundColor: "#1D4ED8" }}
        >
          Export PDF
        </Button>,
      ]}
      closable={!isExporting}
      maskClosable={!isExporting}
    >
      <div style={{ marginBottom: 24 }}>
        <Text strong>Select Layout:</Text>
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <div
            onClick={() => setSelectedLayout("two-column")}
            style={{
              cursor: "pointer",
              border:
                selectedLayout === "two-column"
                  ? "3px solid #1D4ED8"
                  : "2px solid #e8e8e8",
              borderRadius: 8,
              padding: 8,
              transition: "all .3s",
              background:
                selectedLayout === "two-column" ? "#f0f6ff" : "#ffffff",
            }}
          >
            <img
              src="/2-col.png"
              alt="2 Column Layout"
              style={{
                width: 200,
                height: "auto",
                display: "block",
                borderRadius: 4,
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: 14,
                fontWeight: selectedLayout === "two-column" ? "bold" : "normal",
                color: selectedLayout === "two-column" ? "#1D4ED8" : "#666",
              }}
            >
              2 Column Layout
            </div>
          </div>

          <div
            onClick={() => setSelectedLayout("three-column")}
            style={{
              cursor: "pointer",
              border:
                selectedLayout === "three-column"
                  ? "3px solid #1D4ED8"
                  : "2px solid #e8e8e8",
              borderRadius: 8,
              padding: 8,
              transition: "all .3s",
              background:
                selectedLayout === "three-column" ? "#f0f6ff" : "#ffffff",
            }}
          >
            <img
              src="/3-col.png"
              alt="3 Column Layout"
              style={{
                width: 200,
                height: "auto",
                display: "block",
                borderRadius: 4,
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: 14,
                fontWeight:
                  selectedLayout === "three-column" ? "bold" : "normal",
                color: selectedLayout === "three-column" ? "#1D4ED8" : "#666",
              }}
            >
              3 Column Layout
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportFamilyModal;

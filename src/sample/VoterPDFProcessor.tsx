import React, { useState } from "react";
import { Upload, Button, Table, Image, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface VoterData {
  serial: string;
  image: string;
}

const VoterPDFProcessor: React.FC = () => {
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePDF = async (file: File) => {
    setLoading(true);
    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
    const pdf = await loadingTask.promise;
    const allVoters: VoterData[] = [];

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const blocks = cropVoterBlocks(canvas);

      for (const block of blocks) {
        const serialCanvas = cropRegion(
          block,
          0,
          0,
          block.width * 0.25,
          block.height * 0.2
        );
        const imageCanvas = cropRegion(
          block,
          block.width * 0.65,
          block.height * 0.1,
          block.width * 0.3,
          block.height * 0.5
        );

        const serial = await extractSerial(serialCanvas);
        const image = imageCanvas.toDataURL("image/jpeg");

        if (serial) {
          allVoters.push({ serial, image });
        }
      }
    }
    console.log("All voters", allVoters);

    setVoters(allVoters);
    setLoading(false);
  };

  const cropVoterBlocks = (canvas: HTMLCanvasElement): HTMLCanvasElement[] => {
    const blocks: HTMLCanvasElement[] = [];
    const rows = 10,
      cols = 3;

    const boxWidth = canvas.width / cols;
    const boxHeight = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const block = cropRegion(
          canvas,
          c * boxWidth,
          r * boxHeight,
          boxWidth,
          boxHeight
        );
        blocks.push(block);
      }
    }
    return blocks;
  };

  const cropRegion = (
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): HTMLCanvasElement => {
    const cropped = document.createElement("canvas");
    cropped.width = width;
    cropped.height = height;
    const ctx = cropped.getContext("2d")!;
    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return cropped;
  };

  const extractSerial = async (canvas: HTMLCanvasElement): Promise<string> => {
    try {
      const result = await Tesseract.recognize(canvas, "tam+eng", {
        langPath: "https://tessdata.projectnaptha.com/4.0.0/",
      })
      
      const lines = result.data.text
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      console.log("OCR lines:", lines);

      const firstLine = lines[0];
      const numberMatch = firstLine?.match(/\d+/);
      return numberMatch ? numberMatch[0] : "";
    } catch (e) {
      console.error("OCR error", e);
      return "";
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Upload
        accept=".pdf"
        showUploadList={false}
        customRequest={({ file }) => handlePDF(file as File)}
      >
        <Button icon={<UploadOutlined />} disabled={loading} loading={loading}>
          Upload Voter PDF
        </Button>
      </Upload>

      <Table
        style={{ marginTop: 24 }}
        dataSource={voters}
        rowKey="serial"
        columns={[
          { title: "Serial", dataIndex: "serial", key: "serial" },
          {
            title: "Image",
            dataIndex: "image",
            key: "image",
            render: (src) => <Image src={src} width={80} />,
          },
        ]}
      />
    </div>
  );
};

export default VoterPDFProcessor;

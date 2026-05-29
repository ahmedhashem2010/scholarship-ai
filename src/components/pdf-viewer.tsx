"use client";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PDFViewerProps {
  fileUrl: string;
  highlights?: Array<{
    text: string;
    severity: "high" | "medium" | "low";
  }>;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
      </Worker>
    </div>
  );
}

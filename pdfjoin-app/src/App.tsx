import "./App.css";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import "./App.css"; // Import TailwindCSS styles
import "./tailwind.css";

export default function App() {
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const mergePDFs = async () => {
    if (files && files.length > 0) {
      const mergedPdf = await PDFDocument.create();
      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Merger</h1>
      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4 p-2 bg-gray-800 text-white cursor-pointer"
      />
      <button
        onClick={mergePDFs}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
      >
        Merge PDFs
      </button>
    </div>
  );
}

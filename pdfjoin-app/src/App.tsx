import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";
import "./tailwind.css";

type FileItem = {
  id: string;
  file: File;
};

const DraggableFile: React.FC<{
  file: FileItem;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
}> = ({ file, index, moveFile }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "file",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "file",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveFile(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`p-2 mb-2 bg-gray-800 rounded ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {file.file.name}
    </div>
  );
};

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
      }));
      setFiles(newFiles);
    }
  };

  const moveFile = useCallback((dragIndex: number, hoverIndex: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const [removed] = newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, removed);
      return newFiles;
    });
  }, []);

  const mergePDFs = async () => {
    if (files.length > 0) {
      const mergedPdf = await PDFDocument.create();
      for (const fileItem of files) {
        const arrayBuffer = await fileItem.file.arrayBuffer();
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
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col p-4">
        <h1 className="text-2xl font-bold mb-4">PDF Merger</h1>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-4 p-2 bg-gray-800 text-white cursor-pointer"
        />
        {files.length > 0 && (
          <div className="mb-4 w-full max-w-md">
            {files.map((file, index) => (
              <DraggableFile
                key={file.id}
                file={file}
                index={index}
                moveFile={moveFile}
              />
            ))}
          </div>
        )}
        <button
          onClick={files.length > 0 ? mergePDFs : undefined}
          className={`px-4 py-2 rounded ${
            files.length > 0
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          {files.length > 0 ? "Merge PDFs" : "Upload"}
        </button>
      </div>
    </DndProvider>
  );
}

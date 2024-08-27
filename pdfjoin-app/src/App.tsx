import React, { useState, useCallback, useEffect } from "react";
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
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        const arrayBuffer = await file.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = pdf.getPages();
        if (pages.length > 0) {
          const pngImage = await pages[0].exportAsPng({ scale: 0.5 });
          const blob = new Blob([pngImage], { type: "image/png" });
          setPreview(URL.createObjectURL(blob));
        }
      } catch (error) {
        console.error("Error generating preview:", error);
      }
    };
    generatePreview();
  }, [file]);

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
      className={`p-2 m-2 bg-gray-800 rounded-lg ${
        isDragging ? "opacity-50" : ""
      } w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6`}
    >
      {preview ? (
        <img
          src={preview}
          alt={file.file.name}
          className="w-full h-40 object-contain mb-2 rounded"
        />
      ) : (
        <div className="w-full h-40 bg-gray-700 flex items-center justify-center mb-2 rounded">
          <span>Loading preview...</span>
        </div>
      )}
      <p className="text-sm truncate">{file.file.name}</p>
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
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-4">
        <div className="w-full max-w-7xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Merge PDFs</h1>
          <div className="mb-8 flex justify-center">
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="p-3 bg-gray-800 text-white cursor-pointer rounded text-lg"
            />
          </div>
          {files.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap justify-center">
                {files.map((file, index) => (
                  <DraggableFile
                    key={file.id}
                    file={file}
                    index={index}
                    moveFile={moveFile}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <button
              onClick={files.length > 0 ? mergePDFs : undefined}
              className={`px-8 py-4 rounded-lg text-xl ${
                files.length > 0
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {files.length > 0 ? "Merge PDFs" : "Upload PDFs"}
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

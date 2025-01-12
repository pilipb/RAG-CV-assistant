import { useState } from "react";
import { PdfUpload, uploadFile } from "../components/pdfUpload";
import { ChatInterface } from "../components/chat";
import { ReferencesDisplay } from "../components/references";


export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [references, setReferences] = useState<string[]>([]);
    const [notes, setNotes] = useState<string[]>([]);
  
  
    const handlePdfUpload = (file: File) => {
      uploadFile(file);
      setPdfFile(file);
      console.log("Uploaded PDF:", file);
    };
  
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4 p-6 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">RAG CV Assistant</h1>
        <div className="flex w-full space-x-4 flex-row md:flex-row h-full">
          {/* PDF Upload Section */}
          <div className="w-1/5 md:w-1/5 h-[60vh] p-4">
            <PdfUpload onFileUpload={handlePdfUpload} />
          </div>

          {/* Chat Interface */}
          <div className="w-3/5 md:w-3/5 h-[60vh] p-4">
            <ChatInterface />
          </div>

          {/* References Section */}
          <div className="w-1/5 md:w-1/5 h-[60vh] p-4">
            <ReferencesDisplay references={references} />
          </div>
        </div>
      </div>
    );
  };

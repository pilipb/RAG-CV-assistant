"use client";

import { Card, CardHeader, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRef } from "react";

// / File upload function
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file); // Append file to FormData
  try {
    const response = await fetch("/api/upload_pdf", {
      method: "POST",
      body: formData,
    });
    console.log("Response:", response);
  } catch (error) {
    console.error("Failed to upload PDF:", error);
  }
}

// PDF Upload Component
export const PdfUpload = ({
  onFileUpload,
}: {
  onFileUpload: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file); // Trigger the file upload logic
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Manually trigger the file input
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <h2 className="text-xl font-bold">Upload PDF</h2>
      </CardHeader>
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <CardFooter>
        <Button
          variant="secondary"
          className="w-full mt-3"
          onClick={triggerFileInput}
        >
          Upload
        </Button>
      </CardFooter>
    </Card>
  );
};

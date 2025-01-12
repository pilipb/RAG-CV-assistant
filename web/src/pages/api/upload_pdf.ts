import { NextApiRequest, NextApiResponse } from "next";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for handling file uploads
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(400).json({ error: "Failed to parse form data" });
    }

    const uploadedFile =
      files.file && Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = uploadedFile.filepath;
    if (!uploadedFile.originalFilename) {
      return res.status(400).json({ error: "File has no original filename" });
    }
    const newFilePath = path.join(uploadsDir, uploadedFile.originalFilename);

    // Move the file to the 'uploads' directory
    fs.renameSync(filePath, newFilePath);

    // Generate a URL (you could use a static file serving route here)
    const fileUrl = `http://localhost:3000/uploads/${uploadedFile.originalFilename}`;

    console.log("File uploaded successfully:", fileUrl);

    const API_URL =
      "http://127.0.0.1:5001/rag-cv-assistant/us-central1/api/add-pdf";
      
    const data = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        cvUrl: fileUrl,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return null;
    });
    if (data) {
      res.status(200).json(data);
    }
    return res
      .status(400)
      .json({ note: "Failed to run backend", error: "Failed to upload" });
  });
}

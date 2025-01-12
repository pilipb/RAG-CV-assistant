import { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required" });
  }

  try {
    // Check if the file exists in Firestore
    const docRef = db.collection("users/demo/pdfs").doc(fileName as string);
    const doc = await docRef.get();

    if (doc.exists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking PDF:", error);
    return res.status(500).json({ error: "Error checking PDF" });
  }
}

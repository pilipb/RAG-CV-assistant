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
  try {
    // Query the first document in the 'users/demo/pdfs' collection
    const snapshot = await db.collection("users/demo/pdfs").limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No PDF found in the collection" });
    }

    // Get the first document
    const doc = snapshot.docs[0];
    const pdfData = doc.data();
    const notes = pdfData?.notes || [];

    // Return the notes
    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Error fetching PDF document:", error);
    return res.status(500).json({ error: "Failed to fetch PDF document" });
  }
}

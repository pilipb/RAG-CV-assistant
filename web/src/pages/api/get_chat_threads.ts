import { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { FirestoreChat } from "../../../../functions/src/firebaseTypes";

// Initialize Firebase Admin SDK if not already initialized

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

const db = admin.firestore();


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const snapshot = await db
      .collection("users/demo/chats")
      .orderBy("timestamp")
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ threads: [] });
    }

    // Extract each document's question and answer
    const threads = snapshot.docs.map((doc) => {
      const data = doc.data();
      const { question, answer, timestamp, followUpQus } = data as FirestoreChat;
      return { question, answer, timestamp, followUpQus };
    });

    res.status(200).json({ threads });
  } catch (error) {
    console.error("Error fetching chat threads:", error);
    res.status(500).json({ error: "Failed to fetch chat threads" });
  }
}

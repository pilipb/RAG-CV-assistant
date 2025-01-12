import {
  VectorQuery,
  VectorQuerySnapshot,
} from "@google-cloud/firestore";

import { firestore } from "firebase-admin";
import { generateOpenAIEmbedding } from "../notes/controller";
import { FirestorePdf  } from "../firebaseTypes";
import { Document } from "langchain/document";
import { PaperNote } from "../notes/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { outputParser, QA_ON_CV_PROMPT, QA_TOOL_SCHEMA } from "./prompts";
import { formatDocumentsAsString } from "langchain/util/document";


async function searchByVector(
  coll: firestore.CollectionReference,
  queryVector: Array<number>
): Promise<Array<Document>> {
  // Requires a single-field vector index
  const vectorQuery: VectorQuery = coll.findNearest({
    vectorField: "embedding",
    queryVector: queryVector,
    limit: 3,
    distanceMeasure: "COSINE",
  });

  const vectorQuerySnapshot: VectorQuerySnapshot = await vectorQuery.get();

  const results: Array<Document> = vectorQuerySnapshot.docs.map((doc) => {
    return new Document({
      pageContent: doc.data().content,
      metadata: doc.data().metadata,
    });
  });
  return results;
}

async function getCVNotesFromFirestore(): Promise<FirestorePdf["notes"]> {
  const cvCollection = firestore().collection("users/demo/pdfs");
  // get all notes from all documents in the collection
  const querySnapshot = await cvCollection.get();
  // if no notes are found, return null
  if (querySnapshot.empty) {
    return null;
  }
  const cvNotes: Array<PaperNote> = [];
  // loop through each document in the collection
  querySnapshot.forEach((doc) => {
    // get the notes from the document
    const notes = doc.data().notes;
    // if notes are found, add them to the cvNotes array
    if (notes) {
      cvNotes.push(notes);
    }
  });
  // return the cvNotes array

  return cvNotes;
}

async function qaModel(
  question: string,
  documents: Array<Document>,
  notes: Array<PaperNote>
) {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const modelWithTool = model.bind({
    tools: [QA_TOOL_SCHEMA],
    tool_choice: "auto",
  });
  const chain = QA_ON_CV_PROMPT.pipe(modelWithTool).pipe(outputParser);

  const documentsAsString = formatDocumentsAsString(documents);
  const notesAsString = notes.map((note) => note.note).join("\n");

  const response = await chain.invoke({
    question: question,
    notes: notesAsString,
    relevantDocuments: documentsAsString,
  });

  return response;
}

async function saveQaToFirestore(
    question: string,
    answer: string,
    followUpQus: string[],
    context: string,
) {
  const chatRef = firestore().collection("users/demo/chats").doc();

  const chatObject = {
    question: question,
    answer: answer,
    followUpQus: followUpQus,
    context: context,
    timestamp: null, // Todo!!: make this work with timestamp (having issues with firestore timestamp)
  };

  // Set the document in Firestore
  await chatRef.set(chatObject, { merge: true });

  console.log("PDF stored successfully in Firestore.");
}


export async function qaOnCV(question: string) {
  const cvCollection = firestore().collection("users/demo/pdfs");
  const notes = await getCVNotesFromFirestore();
  const queryVector = await generateOpenAIEmbedding(question);
  const documents = await searchByVector(cvCollection, queryVector);

  const answerAndQuestions = await qaModel(question, documents, notes as Array<PaperNote>);

  await saveQaToFirestore(
    question, 
    answerAndQuestions[0].answer, 
    answerAndQuestions[0].followupQuestions, 
    formatDocumentsAsString(documents),
  
    );
}

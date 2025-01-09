import axios from "axios";
import { Document } from "langchain/document";
import { writeFile, unlink } from "fs/promises";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from "@langchain/openai";
import { NOTE_PROMPT, NOTES_TOOL_SCHEMA, outputParser, PaperNote } from "./prompts";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { FirestorePdf } from "./firebaseTypes";
import { OpenAI } from "openai";

import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});


async function loadPdfFromUrl(url: string): Promise<Buffer> {
  // load the pdf from the url
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return response.data;
}

async function convertPdfToDocuments(pdf: Buffer): Promise<Array<Document>> {

  const randomName = Math.random().toString(36).substring(7);
  await writeFile(`pdfs/${randomName}.pdf`, pdf, "binary");

  const pdfLoader = new PDFLoader(`pdfs/${randomName}.pdf`);

  // load the pdf into a document
  const documents = await pdfLoader.load();

  // remove the pdf from disk
  await unlink(`pdfs/${randomName}.pdf`);
  return documents;
}

async function generateNotes(documents: Array<Document>): Promise<Array<PaperNote>> {

  let documentsAsString = formatDocumentsAsString(documents);

  // truncate the documents to 2048 characters
  if (documentsAsString.length > 2048) {
    documentsAsString = documentsAsString.substring(0, 2048);
  }
  
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.0,
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const modelWithTool = model.bind({ tools: [NOTES_TOOL_SCHEMA] });
  
  const chain = NOTE_PROMPT.pipe(modelWithTool).pipe(outputParser);
  const response = await chain.invoke({
    paper: documentsAsString,
  })
  
  if (response) {
    return response;
  }
  
  throw new Error("Failed to generate notes.");

}

async function generateOpenAIEmbedding(
  text: string
): Promise<FieldValue> {
  // Use OpenAI's embedding model to generate embeddings for the provided text
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });

  // Check if embeddings are returned
  if (embeddingResponse.data && embeddingResponse.data[0].embedding) {
    return FieldValue.arrayUnion(...embeddingResponse.data[0].embedding); // Return the embedding vector as FieldValue
  }

  throw new Error("Failed to generate embedding from OpenAI.");
}


async function storePdfToFirestore(pdfData: FirestorePdf): Promise<void> {
  // generate a reference to the PDF document in Firestore
  const pdfRef = admin.firestore().collection("users/demo/pdfs").doc();

  // Prepare the PDF object to be stored
  const pdfObject = {
    url: pdfData.url,
    title: pdfData.title,
    createdAt: pdfData.createdAt || admin.firestore.Timestamp.now(),
    content: pdfData.content,
    embedding: pdfData.embedding || FieldValue.arrayUnion([]), // Ensure embedding is initialized
    metadata: pdfData.metadata,
    notes: pdfData.notes,
  };

  // Set the document in Firestore
  await pdfRef.set(pdfObject, { merge: true });

  console.log("PDF stored successfully in Firestore.");
}


async function main({ cvUrl, name }: { cvUrl: string; name: string }) {
  if (!cvUrl.endsWith("pdf")) {
    throw new Error("The url must point to a pdf file");
  }
  const pdfAsBuffer = await loadPdfFromUrl(cvUrl);
  const documents = await convertPdfToDocuments(pdfAsBuffer);

  // console.log({ documents });
  console.log({ 'documents length': documents.length });
  const notes = await generateNotes(documents);

  // console.log({ notes });
  console.log({ 'notes length': notes.length });
  const content = documents.map((doc) => doc.pageContent).join("\n");

  // console.log({ content });
  console.log({ 'content length': content.length });
  const embedding = await generateOpenAIEmbedding(content);

  // console.log({  embedding });
  console.log({ 'embedding': embedding });

  const pdfData: FirestorePdf = {
    url: cvUrl,
    title: "test", // You can extract the title from the PDF or other metadata
    createdAt: admin.firestore.Timestamp.now(),
    content: content,
    embedding: embedding,
    metadata: {}, // Add any relevant metadata
    notes: notes,
  };

  // console.log({ pdfData });

  await storePdfToFirestore( pdfData);


}

main({
  cvUrl: "https://www.sbs.ox.ac.uk/sites/default/files/2019-01/cv-template.pdf",
  name: "test",
});

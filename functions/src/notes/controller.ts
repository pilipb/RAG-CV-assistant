import axios from "axios";
import { Document } from "langchain/document";
import { writeFile, unlink } from "fs/promises";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from "@langchain/openai";
import { NOTE_PROMPT, NOTES_TOOL_SCHEMA, outputParser, PaperNote } from "./prompts";
import * as admin from "firebase-admin";
import { FirestorePdf } from "../firebaseTypes";
import { OpenAI } from "openai";
import * as functions from "firebase-functions";
import { onInit } from "firebase-functions/v2/core";

import * as dotenv from "dotenv";
dotenv.config();

// Access the OpenAI API key from Firebase functions config
const openaiApiKey = functions.config().openai.key;

let openai: OpenAI;
onInit(() => {
  openai = new OpenAI({
    apiKey: openaiApiKey, 
  });
}
);

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
// Utility function to split content into smaller chunks (e.g., based on word count)
function splitContentIntoChunks(text: string, chunkSize: number = 200): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/); // Split by spaces to approximate word count

  let currentChunk = '';
  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= chunkSize) {
      currentChunk += ' ' + word;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = word; 
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim()); 
  }

  return chunks;
}

async function convertPdfToDocuments(pdf: Buffer): Promise<Array<Document>> {
  const randomName = Math.random().toString(36).substring(7);
  await writeFile(`pdfs/${randomName}.pdf`, pdf, "binary");

  const pdfLoader = new PDFLoader(`pdfs/${randomName}.pdf`);

  // Load the PDF into a document (this will load all the pages)
  const documents = await pdfLoader.load();

  // Split documents into smaller chunks
  const chunkedDocuments: Document[] = [];
  for (const doc of documents) {
    const chunks = splitContentIntoChunks(doc.pageContent);
    for (const chunk of chunks) {
      chunkedDocuments.push(new Document({
        pageContent: chunk,
        metadata: doc.metadata, 
      }));
    }
  }

  // Remove the PDF from disk
  await unlink(`pdfs/${randomName}.pdf`);

  return chunkedDocuments; // Return the array of chunked documents
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

export async function generateNotesFromPdf(cvUrl: string): Promise<Array<PaperNote>> {
  if (!cvUrl.endsWith("pdf")) {
    throw new Error("The url must point to a pdf file");
  }
  const pdfAsBuffer = await loadPdfFromUrl(cvUrl);
  const documents = await convertPdfToDocuments(pdfAsBuffer);
  const notes = await generateNotes(documents);
  return notes;
}

export async function generateOpenAIEmbedding(
  text: string
): Promise<Array<number>> {
  // Use OpenAI's embedding model to generate embeddings for the provided text
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
    dimensions: 2048,
  });

  // Check if embeddings are returned
  if (embeddingResponse.data && embeddingResponse.data[0].embedding) {
    return embeddingResponse.data[0].embedding;
  }

  throw new Error("Failed to generate embedding from OpenAI.");
}


async function storePdfToFirestore(pdfData: FirestorePdf): Promise<string> {
  // generate a reference to the PDF document in Firestore
  const pdfRef = admin.firestore().collection("users/demo/pdfs").doc();
  console.log({ pdfRef });

  // Set the document in Firestore
  await pdfRef.set(pdfData, { merge: true });

  console.log("PDF stored successfully in Firestore.");
  return pdfRef.id;
}


export async function addNewPdf(cvUrl: string ): Promise<FirestorePdf> {
  if (!cvUrl.endsWith("pdf")) {
    throw new Error("The url must point to a pdf file");
  }
  const pdfAsBuffer = await loadPdfFromUrl(cvUrl);
  const documents = await convertPdfToDocuments(pdfAsBuffer);


  // console.log({ documents });
  console.log({ 'documents length': documents.length });
  const notes = await (await generateNotes(documents)).map((note) => note.note);

  // console.log({ notes });
  console.log({ 'notes length': notes.length });
  const content = documents.map((doc) => doc.pageContent).join("\n");

  // console.log({ content });
  console.log({ 'content length': content.length });
  const embedding = await generateOpenAIEmbedding(content);

  // console.log({  embedding });
  console.log({ 'embedding length': embedding.length });
try {
  const pdfData: FirestorePdf = {
    url: cvUrl,
    title: "test", // You can extract the title from the PDF or other metadata
    createdAt: null,
    content: content,
    embedding: embedding,
    metadata: {}, 
    notes: notes,
  };

  console.log({ pdfData });

  const refId = await storePdfToFirestore( pdfData);
  console.log("PDF stored successfully in Firestore with refId: ", refId);

  return pdfData;
} catch (error) {
  throw new Error(`Failed to add PDF: ${error}`);
}
}


// main({
//   cvUrl: "https://www.sbs.ox.ac.uk/sites/default/files/2019-01/cv-template.pdf",
//   name: "test",
// });

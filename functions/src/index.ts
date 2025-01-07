import axios from "axios";
import { Document } from "langchain/document";
import { writeFile, unlink } from "fs/promises";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from "@langchain/openai";
import { NOTE_PROMPT, NOTES_TOOL_SCHEMA, outputParser, PaperNote } from "./prompts";

import * as dotenv from "dotenv";
dotenv.config();


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

  const documentsAsString = formatDocumentsAsString(documents);

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
  return response;

}

async function main({ cvUrl, name }: { cvUrl: string; name: string }) {
  if (!cvUrl.endsWith("pdf")) {
    throw new Error("The url must point to a pdf file");
  }
  const pdfAsBuffer = await loadPdfFromUrl(cvUrl);

  const documents = await convertPdfToDocuments(pdfAsBuffer);

  const notes = await generateNotes(documents);

}

main({ cvUrl: "https://arxiv.org/pdf/2312.10997.pdf", name: "test" });

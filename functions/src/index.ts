import {  addNewPdf, generateNotesFromPdf } from './notes/controller';
import { qaOnCV } from './qa/controller';
import * as functions from "firebase-functions";
import * as bodyParser from "body-parser";
import express from 'express';
import cors from "cors";

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: true }));

app.get('/', (_req: any, res: any) => {
    res.status(200).send('You\'ve reached the API endpoint');
});

app.post('/take-notes', async (req: any, res: any) => {
    const { cvUrl } = req.body;
    try {
      console.log("take-notes");
      const notes = await generateNotesFromPdf(cvUrl);
      res.status(200).send(notes);
      return;
    } catch (error) {
      res.status(500).send(`Error: ${error}`);
    }
});

app.post('/add-pdf', async (req: any, res: any) => {
    const { cvUrl } = req.body;
    try {
      console.log("add-pdf");
      const pdfData = await addNewPdf(cvUrl);
        res.status(200).send(pdfData);
      return;
    } catch (error) {
      res.status(500).send(`Error: ${error}`);
    }
});

app.post('/qa', async (req: any, res: any) => {
    const { question } = req.body;
    const qa = await qaOnCV(question);
    res.status(200).send(qa);
    return;
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);


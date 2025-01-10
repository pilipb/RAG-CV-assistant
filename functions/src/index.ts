import express from 'express';
import { generateNotesFromPdf } from './controller';
import * as functions from "firebase-functions";

import * as bodyParser from "body-parser";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: true }));

app.get('/', (_req: any, res: any) => {
    res.status(200).send('Hello, world!');
});

app.post('/take-notes', async (req: any, res: any) => {
    const { cvUrl } = req.body;
    try {
        console.log('take-notes');
        const notes = await generateNotesFromPdf(cvUrl);
        res.status(200).send(notes);
        return;
    } catch (error) {
        res.status(500).send(`Error: ${error}`);
    }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);


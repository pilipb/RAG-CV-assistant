// firebaseTypes.ts

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";


export interface FirestorePdf {
    url: string | null;
    title: string | null;
    createdAt: admin.firestore.Timestamp | null;
    content: string | null;
    embedding: FieldValue | Array<number> | null;
    metadata: Json | null;
    notes: Json | null;
}

export interface FirestoreChat {
    question: string | null;
    answer: string | null;
    followUpQus: string[] | null;
    context: string | null;
}

export type Json = {
    [key: string]: any;
}


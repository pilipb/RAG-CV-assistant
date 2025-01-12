import type { NextApiRequest, NextApiResponse } from "next";

type PaperNote = {
    note: string;
    pageNumbers: number[];
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PaperNote>
    ) {
    const API_URL =
      "http://127.0.0.1:5001/rag-cv-assistant/us-central1/api/take-notes";
    const data = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
            "Content-Type": "application/json",
        },
        }).then((res) => {
            if (res.ok) {
                return res.json();
            }
            return null;
        });
        if (data) {
            res.status(200).json(data);
        }
        return res.status(400).json({ note: "Failed to fetch data", pageNumbers: [] });
}
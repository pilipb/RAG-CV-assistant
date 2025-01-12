import { Card, CardHeader, CardFooter } from "@/src/components/ui/card";
import { useEffect, useState } from "react";

export const ReferencesDisplay = ({ fileName }: { fileName: string }) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes from the API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/get_pdf_notes?fileName=${fileName}`);
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }

        const data = await response.json();
        setNotes(data.notes || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [fileName]); // Re-fetch if fileName changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    
    <Card className="w-full h-full overflow-y-auto">
      <CardHeader>
      {notes.length === 0 ? (
        <p>No notes available for this PDF.</p>
      ) : (
        <h2 className="text-xl font-bold">Chat Notes</h2>)}
        </CardHeader>
        <ul className="overflow-y-hidden">
        {notes.map((ref, index) => (
          <li key={index} className="text-sm text-gray-700 p-4 overflow-hidden">
            {ref}
          </li>
        ))}
      </ul>
    </Card>
  );
};





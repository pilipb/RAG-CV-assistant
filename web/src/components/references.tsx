

import { Card, CardHeader, CardFooter } from "@/src/components/ui/card";



// References Component
export const ReferencesDisplay = ({ references }: { references: string[] }) => {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <h2 className="text-xl font-bold">Chat References</h2>
      </CardHeader>
        <ul className="space-y-2">
          {references.map((ref, index) => (
            <li key={index} className="text-sm text-gray-500">
              {ref}
            </li>
          ))}
        </ul>
    </Card>
  );
};
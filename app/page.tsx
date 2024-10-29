import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploader from "@/components/FileUploader";
import ArchivesList from "@/components/ArchivesList";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              AWS Glacier Archive Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Archive Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <ArchivesList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

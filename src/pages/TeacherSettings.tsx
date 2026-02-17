import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function TeacherSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" /> Teacher Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage teacher salary and configuration settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Teacher salary and configuration settings will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

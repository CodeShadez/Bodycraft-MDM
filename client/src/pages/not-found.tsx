import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col p-6">
      <SidebarTrigger
        data-testid="button-sidebar-toggle"
        className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md self-start"
      />
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 glass-card border-0 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">
                404 Page Not Found
              </h1>
            </div>

            <p className="mt-4 text-sm text-white/70">
              Did you forget to add the page to the router?
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

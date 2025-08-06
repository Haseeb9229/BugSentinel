import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenshotTool } from "@/components/screenshot/screenshot-tool";

export function GlobalScreenshotButton() {
  const [showScreenshotTool, setShowScreenshotTool] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowScreenshotTool(true)}
        className="flex items-center space-x-2"
      >
        <Camera className="w-4 h-4" />
        <span>Screenshot Tool</span>
      </Button>

      {/* Screenshot Tool Modal */}
      {showScreenshotTool && (
        <ScreenshotTool
          onClose={() => setShowScreenshotTool(false)}
        />
      )}
    </>
  );
} 
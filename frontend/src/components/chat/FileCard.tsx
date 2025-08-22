import { FileText, Image, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileAttachment } from "./ChatLayout";

interface FileCardProps {
  file: FileAttachment;
  onClick: () => void;
}

export const FileCard = ({ file, onClick }: FileCardProps) => {
  const IconComponent = file.type === "pdf" ? FileText : Image;
  
  return (
    <div 
      className="group bg-glass border border-white/10 rounded-lg p-3 hover:bg-glass-strong transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {file.name}
          </p>
          {file.size && (
            <p className="text-xs text-text-secondary mt-1">
              {file.size}
            </p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            // Handle download
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
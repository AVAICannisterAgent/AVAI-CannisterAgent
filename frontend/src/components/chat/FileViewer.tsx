"use client"

import { useState } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FileAttachment } from "./ChatLayout";

interface FileViewerProps {
  files: FileAttachment[];
  isOpen: boolean;
  onClose: () => void;
}

export const FileViewer = ({ files, isOpen, onClose }: FileViewerProps) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  if (!isOpen || files.length === 0) return null;
  
  const currentFile = files[currentFileIndex];
  const hasMultipleFiles = files.length > 1;
  
  const nextFile = () => {
    setCurrentFileIndex((prev) => (prev + 1) % files.length);
  };
  
  const prevFile = () => {
    setCurrentFileIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const renderFileContent = () => {
    if (currentFile.type === "image") {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img 
            src={currentFile.url} 
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    } else if (currentFile.type === "pdf") {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">PDF Viewer</h3>
            <p className="text-text-secondary mb-4">
              PDF viewing will be implemented with react-pdf library
            </p>
            <p className="text-sm text-text-secondary">
              File: {currentFile.name}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[500px] lg:w-[600px] bg-background border-l border-border shadow-2xl transition-transform duration-300",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {currentFile.name}
          </h2>
          {hasMultipleFiles && (
            <span className="text-sm text-text-secondary bg-muted px-2 py-1 rounded">
              {currentFileIndex + 1} of {files.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasMultipleFiles && (
            <>
              <Button variant="ghost" size="sm" onClick={prevFile}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={nextFile}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 h-[calc(100vh-80px)]">
        {renderFileContent()}
      </div>

      {/* File list for multiple files */}
      {hasMultipleFiles && (
        <div className="border-t border-border p-4">
          <ScrollArea className="h-24">
            <div className="flex gap-2">
              {files.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => setCurrentFileIndex(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                    index === currentFileIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {file.type === "pdf" ? "📄" : "🖼️"} {file.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
import { useState } from "react";
import type { FileAttachment } from "./ChatLayout";

export const useUIState = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  const setTyping = (typing: boolean) => setIsTyping(typing);
  
  const openFileViewer = (files: FileAttachment[]) => {
    setSelectedFiles(files);
    setFileViewerOpen(true);
  };
  
  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFiles([]);
  };

  return {
    sidebarOpen,
    isTyping,
    fileViewerOpen,
    selectedFiles,
    toggleSidebar,
    closeSidebar,
    setTyping,
    openFileViewer,
    closeFileViewer
  };
};

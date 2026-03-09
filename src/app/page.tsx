"use client";

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import DocumentTemplate, { DocType } from "@/components/Admin/DocumentTemplate";

interface PageProps {
  params: { id: string };
}

const AdminEventPage: React.FC<PageProps> = ({ params }) => {
  const docType: DocType = "event"; // adjust based on your actual DocType
  const docData = { id: params.id }; // replace with your actual doc data

  useEffect(() => {
    const tempContainer = document.getElementById("document-root");
    if (!tempContainer) {
      console.error("Temp container not found. DocumentTemplate cannot render.");
      return;
    }

    // Safe root initialization
    const root = ReactDOM.createRoot(tempContainer);
    root.render(
      <DocumentTemplate type={docType} {...docData} exportMode={true} />
    );

    // Optional: cleanup on unmount
    return () => {
      root.unmount();
    };
  }, [params.id]);

  return (
    <div>
      <h1>Admin Event {params.id}</h1>
      {/* This div is required for the ReactDOM root */}
      <div id="document-root"></div>
    </div>
  );
};

export default AdminEventPage;
"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui";

interface ExportDropdownProps {
  exportType: "users" | "creators" | "collectors" | "artworks" | "reports" | "cor-members" | "cor-requests" | "cor-opportunities" | "cor-applications";
  filters?: any;
}

export function ExportDropdown({ exportType, filters }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      const res = await fetch("/api/admin/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: exportType,
          filters
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Unable to generate export.");
      }

      // Check content-disposition to get filename if possible, otherwise fallback
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `export-${new Date().getTime()}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Export Successful", "Data exported successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error("Export Failed", error.message || "Unable to generate the export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportCSV}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#141413] hover:bg-[#FAF5EC] hover:border-[#D5D3CE] transition-all focus:outline-none focus:ring-1 focus:ring-[#141413] shadow-xs disabled:opacity-50 cursor-pointer"
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 text-[#141413] animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5 text-[#865E16]" />
      )}
      <span>{isExporting ? "Preparing CSV..." : "Download CSV"}</span>
    </button>
  );
}


"use client";

import { Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PrintButtonProps {
  label?: string;
  className?: string;
  targetId?: string;
  fileName?: string;
}

export default function PrintButton({ 
  label = "Download Bill", 
  className = "btn btn-primary h-12 px-6 rounded-xl flex items-center gap-2",
  targetId = "bill-content",
  fileName = "purchase-bill.pdf"
}: PrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      alert("Bill content not found!");
      return;
    }

    try {
      setIsGenerating(true);
      
      const canvas = await html2canvas(element, {
        scale: 1.5, // Balanced quality and size
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // 1. Inject global reset
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root {
              --color-primary: #2563eb !important;
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-200: #e2e8f0 !important;
              --color-slate-300: #cbd5e1 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-500: #64748b !important;
              --color-slate-600: #475569 !important;
              --color-slate-700: #334155 !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
              --color-blue-50: #eff6ff !important;
              --color-blue-100: #dbeafe !important;
              --color-blue-600: #2563eb !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important; /* Shadows often use modern colors */
              text-shadow: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          // 2. Nuclear Scrubber: Force compute all styles and remove modern colors
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            try {
              const comp = window.getComputedStyle(el);
              
              // If color uses lab/oklch, fallback to black/inherit
              if (comp.color.includes('lab') || comp.color.includes('oklch')) {
                el.style.color = '#000000';
              }
              
              // If bg uses lab/oklch, fallback to transparent/white
              if (comp.backgroundColor.includes('lab') || comp.backgroundColor.includes('oklch')) {
                el.style.backgroundColor = 'transparent';
              }

              // If border uses lab/oklch, fallback to transparent
              if (comp.borderColor.includes('lab') || comp.borderColor.includes('oklch')) {
                el.style.borderColor = 'transparent';
              }
            } catch (e) {
              // Ignore elements that can't be computed
            }
          }
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.7);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 1.5, canvas.height / 1.5],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(fileName);
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      alert(`Failed to generate PDF: ${error.message || "Unknown error"}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("download") === "true") {
        // Delay slightly to ensure browser DOM is fully stable for canvas capture
        const timer = setTimeout(() => {
          handleDownload();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <button 
      onClick={handleDownload}
      className={className}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isGenerating ? "Generating..." : label}
    </button>
  );
}

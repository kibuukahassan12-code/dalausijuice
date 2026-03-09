import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportToPDF(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [canvas.width / 2, canvas.height / 2],
        });

        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error("PDF Export Error:", error);
    }
}

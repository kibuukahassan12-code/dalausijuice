const handleDownloadPDF = async (docType: DocType) => {
    if (!docData) return;

    if (docType === "RECEIPT" && (!docData.payments || docData.payments.length === 0)) {
        alert("No payments found for this event. Receipt cannot be generated.");
        return;
    }

    let tempContainer: HTMLDivElement | null = null;
    let root: any = null;

    const ReactDOM = await import("react-dom/client");

    try {
        tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "0";
        tempContainer.style.width = "800px";
        tempContainer.style.backgroundColor = "#ffffff";
        tempContainer.style.padding = "40px";
        tempContainer.id = "temp-doc-container";

        document.body.appendChild(tempContainer);

        if (tempContainer) {
            root = (ReactDOM as any).createRoot(tempContainer);

            root.render(
                React.createElement(
                    DocumentTemplate,
                    { type: docType, ...docData, exportMode: true }
                )
            );
        }

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 800);
            });
        });

        const docElement =
            tempContainer.querySelector('[id="printable-document"]') || tempContainer;

        const canvas = await html2canvas(docElement as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/png", 1.0);

        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const pageHeight = 297;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const fileName = `${docType}_${docData.docNumber ?? "DOC"}_${Date.now()}.pdf`;

        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        if (root) {
            try { root.unmount(); } catch {}
        }

        if (tempContainer?.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
        }
    }
};
import { pdfjs } from 'pdfjs-dist';

// Set the workerSrc property for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

export function loadPDF(url, canvasContainer) {
  const loadingTask = pdfjs.getDocument(url);
  loadingTask.promise.then(pdf => {
    // Fetch the first page
    pdf.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvasContainer.appendChild(canvas);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    });
  }).catch(error => {
    console.error('Error loading PDF:', error);
  });
}

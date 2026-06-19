export async function loadPDF(url, canvasContainer) {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    const pdfjs = pdfjsLib.pdfjs || pdfjsLib;
    // Use CDN worker to avoid bundling pdf.worker into the app bundle
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    const loadingTask = pdfjs.getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvasContainer.appendChild(canvas);
    const renderContext = { canvasContext: context, viewport };
    page.render(renderContext);
  } catch (error) {
    console.error('Error loading PDF:', error);
  }
}

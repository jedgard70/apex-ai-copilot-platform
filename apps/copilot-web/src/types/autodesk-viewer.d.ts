// Minimal type declarations for the Autodesk Viewer SDK loaded via CDN script tag
// Full types: https://aps.autodesk.com/en/docs/viewer/v7/reference/globals/

declare namespace Autodesk {
  namespace Viewing {
    interface InitializerOptions {
      env: 'AutodeskProduction' | 'AutodeskStaging'
      accessToken: string
      api?: string
      language?: string
      getAccessToken?: (callback: (token: string, expires: number) => void) => void
    }

    interface ViewerConfig {
      extensions?: string[]
      theme?: 'dark-theme' | 'light-theme'
    }

    type ViewerEventCallback = (...args: unknown[]) => void

    interface ViewerDocument {
      getRoot(): ModelNode
    }

    interface ModelNode {
      getDefaultGeometry(): ModelNode
    }

    class GuiViewer3D {
      constructor(container: HTMLElement, config?: ViewerConfig)
      start(): number
      finish(): void
      loadDocumentNode(doc: ViewerDocument, node: ModelNode): Promise<unknown>
      addEventListener(event: string, cb: ViewerEventCallback): void
      removeEventListener(event: string, cb: ViewerEventCallback): void
      resize(): void
    }

    class Document {
      static load(
        urn: string,
        onSuccess: (doc: ViewerDocument) => void,
        onError: (code: number, msg: string) => void,
      ): void
    }

    function Initializer(options: InitializerOptions, callback: () => void): void
  }
}

interface Window {
  Autodesk?: typeof Autodesk
}

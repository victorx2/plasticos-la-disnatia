import { toast } from "sonner"

const PRINT_LABELS = {
  blocked:
    "No se pudo abrir la vista de impresión. Permita ventanas emergentes o use «Descargar HTML».",
  downloadFallback: "Se descargó el documento. Ábralo en el navegador para imprimir.",
}

function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export type OpenPrintHtmlOptions = {
  title: string
  filename?: string
  autoPrint?: boolean
}

export function openPrintHtml(html: string, options: OpenPrintHtmlOptions): boolean {
  const { title, filename, autoPrint = true } = options
  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", title)
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    if (filename) downloadHtml(html, filename)
    toast.error(PRINT_LABELS.blocked)
    return false
  }

  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  if (!win) {
    document.body.removeChild(iframe)
    if (filename) downloadHtml(html, filename)
    toast.error(PRINT_LABELS.blocked)
    return false
  }

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe)
    }, 1500)
  }

  win.addEventListener("afterprint", cleanup, { once: true })
  window.setTimeout(() => {
    win.focus()
    if (autoPrint) win.print()
    else cleanup()
  }, 250)

  return true
}

export function openPrintHtmlWithFallback(html: string, options: OpenPrintHtmlOptions): void {
  const ok = openPrintHtml(html, options)
  if (!ok && options.filename) {
    downloadHtml(html, options.filename)
    toast.message(PRINT_LABELS.downloadFallback)
  }
}

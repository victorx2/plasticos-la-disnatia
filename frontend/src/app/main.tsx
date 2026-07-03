import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"

import { router } from "@/app/router"
import { BRANDING } from "@/config/branding"
import "@/index.css"

document.documentElement.classList.add("classic-light")
document.title = BRANDING.siteName

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors closeButton />
  </StrictMode>,
)

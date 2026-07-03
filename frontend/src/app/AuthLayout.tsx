import { Outlet } from "react-router-dom"

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  )
}

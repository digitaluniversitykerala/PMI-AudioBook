import { createBrowserRouter, Outlet } from "react-router-dom";
import { Home } from '@/pages'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Outlet />,
        children: [
            {
                index: true,
                element: <Home />
            }
        ]
    }
])

export default router
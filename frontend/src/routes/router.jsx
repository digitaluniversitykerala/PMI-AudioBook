import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import AdminDashboard from "../pages/Admin";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/admindashboard",
    element: <AdminDashboard />,
  },
  // Redirect any unknown paths to home
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

export default router;

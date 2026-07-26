import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import AdminDashboard from "../pages/Admin";
import SingleAudioBook from "../pages/SingleAudioBook/SingleAudioBook";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";

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
  // Primary admin route
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  // Backwards-compat redirect for any saved /admindashboard links
  {
    path: "/admindashboard",
    element: <Navigate to="/admin" replace />,
  },
  {
    path: "/book/:id",
    element: <SingleAudioBook />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  // Redirect any unknown paths to home
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

export default router;

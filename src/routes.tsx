import { createBrowserRouter } from "react-router";

import AdminDashboard from "./pages/admin/AdminDashboard";

import Layout from "./components/Layout";
import DashboardLayout from "./components/dashboard/DashboardLayout";

import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";

import Home from "./pages/Home";
import Plans from "./pages/Plans";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RiskDisclosure from "./pages/RiskDisclosure";

import Dashboard from "./pages/dashboard/Dashboard";
import DashboardPlans from "./pages/dashboard/DashboardPlans";
import Wallet from "./pages/dashboard/Wallet";
import Investments from "./pages/dashboard/Investments";
import Deposit from "./pages/dashboard/Deposit";
import Withdraw from "./pages/dashboard/Withdraw";
import Transactions from "./pages/dashboard/Transactions";
import Notifications from "./pages/dashboard/Notifications";
import Profile from "./pages/dashboard/Profile";
import Support from "./pages/dashboard/Support";

export const router = createBrowserRouter([
  /*
   * SPLASH
   */
  {
    path: "/",
    element: <Splash />,
  },

  /*
   * ONBOARDING
   */
  {
    path: "/onboarding",
    element: <Onboarding />,
  },

  /*
   * ADMIN
   */
  {
    path: "/admin",
    element: <AdminDashboard />,
  },

  /*
   * PUBLIC WEBSITE
   *
   * Existing public website is available at /home.
   */
  {
    path: "/home",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "plans",
        element: <Plans />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "how-it-works",
        element: <HowItWorks />,
      },
      {
        path: "faq",
        element: <FAQ />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "terms",
        element: <Terms />,
      },
      {
        path: "privacy",
        element: <Privacy />,
      },
      {
        path: "risk-disclosure",
        element: <RiskDisclosure />,
      },
    ],
  },

  /*
   * DIRECT AUTH ROUTES
   */
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  /*
   * USER DASHBOARD
   */
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "plans",
        element: <DashboardPlans />,
      },
      {
        path: "investments",
        element: <Investments />,
      },
      {
        path: "wallet",
        element: <Wallet />,
      },
      {
        path: "deposit",
        element: <Deposit />,
      },
      {
        path: "withdraw",
        element: <Withdraw />,
      },
      {
        path: "transactions",
        element: <Transactions />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "support",
        element: <Support />,
      },
    ],
  },
]);
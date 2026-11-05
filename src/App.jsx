import { useState, useEffect } from "react";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import ForgotPassword from "./Pages/ForgotPassword";
import Dashboard from "./Pages/Dashboard";
import MisAudios from "./Pages/MisAudios";
import Player from "./Pages/Player";
import ResetPassword from "./Pages/ResetPassword";
import Perfil from "./Pages/Perfil";
import VerifyEmail from "./Pages/VerifyEmail";

function getInitialPage() {
  const pathname = window.location.pathname;
  if (pathname === "/reset-password") return "reset";
  if (pathname === "/verify-email") return "verify-email";

  const page = pathname.replace(/^\//, "") || "landing";
  const protectedPages = ["dashboard", "audios", "player", "perfil"];
  if (protectedPages.includes(page) && !localStorage.getItem("token")) return "login";
  return protectedPages.includes(page) ? page : "landing";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);

  useEffect(() => {
    const isProtected = ["dashboard", "audios", "player", "perfil"].includes(currentPage);
    const routes = { reset: "/reset-password", "verify-email": "/verify-email" };
    if (routes[currentPage] && window.location.pathname !== routes[currentPage]) {
      window.history.pushState({}, "", routes[currentPage]);
    } else if (isProtected && window.location.pathname !== `/${currentPage}`) {
      window.history.pushState({}, "", `/${currentPage}`);
    } else if (currentPage === "landing" && window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  }, [currentPage]);

  function navigate(page) {
    const protectedPages = ["dashboard", "audios", "player", "perfil"];
    if (protectedPages.includes(page) && !localStorage.getItem("token")) {
      setCurrentPage("login");
      window.history.pushState({}, "", "/login");
      return;
    }
    const routes = {
      landing: "/", login: "/login", signup: "/signup", forgot: "/forgot-password",
      dashboard: "/dashboard", audios: "/audios", player: "/player", perfil: "/perfil",
      reset: "/reset-password", "verify-email": "/verify-email",
    };
    setCurrentPage(page);
    window.history.pushState({}, "", routes[page] || "/");
    window.scrollTo(0, 0);
  }

  const pages = {
    landing: <Landing onNavigate={navigate} />,
    login: <Login onNavigate={navigate} />,
    signup: <SignUp onNavigate={navigate} />,
    forgot: <ForgotPassword onNavigate={navigate} />,
    dashboard: <Dashboard onNavigate={navigate} />,
    audios: <MisAudios onNavigate={navigate} />,
    player: <Player onNavigate={navigate} />,
    perfil: <Perfil onNavigate={navigate} />,
    reset: <ResetPassword onNavigate={navigate} />,
    "verify-email": <VerifyEmail onNavigate={navigate} />,
  };
  return pages[currentPage] || pages.landing;
}

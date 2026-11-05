import { useState, useEffect } from "react";
import Landing        from "./Pages/Landing";
import Login          from "./Pages/Login";
import SignUp         from "./Pages/SignUp";
import ForgotPassword from "./Pages/ForgotPassword";
import Dashboard      from "./Pages/Dashboard";
import MisAudios      from "./Pages/MisAudios";
import Player         from "./Pages/Player";
import ResetPassword  from "./Pages/ResetPassword";
import Perfil         from "./Pages/Perfil";
import VerifyEmail    from "./Pages/VerifyEmail";

function getInitialPage() {
  const pathname = window.location.pathname;

  if (pathname === "/reset-password") return "reset";
  if (pathname === "/verify-email") return "verify-email";

  const protectedPages = ["dashboard", "audios", "player", "perfil"];
  const page = pathname.replace(/^\//, "") || "landing";

  if (protectedPages.includes(page) && !localStorage.getItem("token")) {
    return "login";
  }

  return protectedPages.includes(page) ? page : "landing";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isProtected = ["dashboard", "audios", "player", "perfil"].includes(currentPage);

    if (pathname === "/reset-password" && currentPage !== "reset") {
      window.history.pushState({}, "", "/reset-password");
    } else if (pathname === "/verify-email" && currentPage !== "verify-email") {
      window.history.pushState({}, "", "/verify-email");
    } else if (isProtected && pathname !== `/${currentPage}`) {
      window.history.pushState({}, "", `/${currentPage}`);
    } else if (!isProtected && pathname !== "/" && currentPage === "landing") {
      window.history.pushState({}, "", "/");
    }
  }, [currentPage]);

  function navigate(page) {
    const protegidas = ["dashboard", "audios", "player", "perfil"];

    if (protegidas.includes(page) && !localStorage.getItem("token")) {
      setCurrentPage("login");
      window.history.pushState({}, "", "/login");
      return;
    }

    setCurrentPage(page);

    const routeMap = {
      landing: "/",
      login: "/login",
      signup: "/signup",
      forgot: "/forgot-password",
      dashboard: "/dashboard",
      audios: "/audios",
      player: "/player",
      perfil: "/perfil",
      reset: "/reset-password",
      "verify-email": "/verify-email",
    };

    const nextPath = routeMap[page] || "/";
    window.history.pushState({}, "", nextPath);
    window.scrollTo(0, 0);
  }

  const pages = {
    landing:   <Landing        onNavigate={navigate} />,
    login:     <Login          onNavigate={navigate} />,
    signup:    <SignUp         onNavigate={navigate} />,
    forgot:    <ForgotPassword onNavigate={navigate} />,
    dashboard: <Dashboard      onNavigate={navigate} />,
    audios:    <MisAudios      onNavigate={navigate} />,
    player:    <Player         onNavigate={navigate} />,
    perfil:    <Perfil         onNavigate={navigate} />,
    reset:     <ResetPassword  onNavigate={navigate} />,
    "verify-email": <VerifyEmail onNavigate={navigate} />,
  };

  return pages[currentPage];
}

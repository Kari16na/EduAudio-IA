import { useState } from "react";
import Landing        from "./Pages/Landing";
import Login          from "./Pages/Login";
import SignUp         from "./Pages/SignUp";
import ForgotPassword from "./Pages/ForgotPassword";
import Dashboard      from "./Pages/Dashboard";
import MisAudios      from "./Pages/MisAudios";
import Player         from "./Pages/Player";
import ResetPassword  from "./Pages/ResetPassword";

export default function App() {

  const [currentPage, setCurrentPage] = useState("landing");

  // Detectar si viene del link de recuperar contraseña
  if (window.location.pathname === "/reset-password") {
    return <ResetPassword onNavigate={(page) => {
      window.history.pushState({}, "", "/");
      setCurrentPage(page);
    }} />;
  }

  function navigate(page) {
    const protegidas = ["dashboard", "audios", "player"];
    if (protegidas.includes(page) && !localStorage.getItem("token")) {
      setCurrentPage("login");
      return;
    }
    setCurrentPage(page);
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
    reset:     <ResetPassword  onNavigate={navigate} />,
  };

  return pages[currentPage];
}
import { useState } from "react";
import Landing        from "./Pages/Landing";
import Login          from "./Pages/Login";
import SignUp         from "./Pages/SignUp";
import ForgotPassword from "./Pages/ForgotPassword";
import Dashboard      from "./Pages/Dashboard";
import MisAudios      from "./Pages/MisAudios";
import Player         from "./Pages/Player";

export default function App() {

  const [currentPage, setCurrentPage] = useState("landing");

  function navigate(page) {
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
  };

  return pages[currentPage];
}
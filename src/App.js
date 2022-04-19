import React from "react";
import LineupSite from "./pages/LineupSite";
import DesignLineup from "./pages/DesignLineup";
import SelectLineupPage from "./pages/SelectLineupPage";
import Home from "./pages/Home";

import Navbar from "./component-utils/navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EditLineup from "./pages/EditLineup";

function App() {
  return (
    <div>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/abilities" element={<LineupSite />} />
          <Route path="/send" element={<DesignLineup />} />
          <Route path="/select" element={<SelectLineupPage />} />
          <Route path="/edit" element={<EditLineup />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

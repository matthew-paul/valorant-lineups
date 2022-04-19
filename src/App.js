import React from "react";
import LineupSite from "./pages/LineupSite";
import DesignLineup from "./pages/DesignLineup";
import SelectLineupPage from "./pages/SelectLineupPage";
import Info from "./pages/Info";

import Navbar from "./component-utils/navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EditLineup from "./pages/EditLineup";

function App() {
  return (
    <div>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LineupSite />} />
          <Route path="/about" element={<Info />} />
          <Route path="/send" element={<DesignLineup />} />
          <Route path="/select" element={<SelectLineupPage />} />
          <Route path="/edit" element={<EditLineup />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BattlePage from "@/pages/BattlePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BattlePage />} />
      </Routes>
    </Router>
  );
}

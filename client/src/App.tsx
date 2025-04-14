import "./App.css";
import Convert from "./pages/convert";
import Crop from "./pages/crop";
import { Routes, Route, Link } from "react-router-dom";
function App() {
  return (
    <>
      <nav style={{ padding: "1rem" }}>
        <Link to="/convert" style={{ marginRight: "1rem" }}>
          Convert
        </Link>
        <Link to="/crop">Crop</Link>
      </nav>
      <Routes>
        <Route path="/convert" element={<Convert />} />
        <Route path="/crop" element={<Crop />} />
      </Routes>
    </>
  );
}

export default App;

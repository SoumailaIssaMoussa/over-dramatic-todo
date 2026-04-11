import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";

function App() {
  const token = localStorage.getItem("token");
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={token ? <Tasks /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={token ? "/tasks" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;

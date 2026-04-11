import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import OAuthCallback from "./pages/OAuthCallback";

function App() {
  const token = localStorage.getItem("token");
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/auth/callback"   element={<OAuthCallback />} />
          <Route path="/tasks"           element={token ? <Tasks />    : <Navigate to="/login" />} />
          <Route path="/profile"         element={token ? <Profile />  : <Navigate to="/login" />} />
          <Route path="/calendar"        element={token ? <Calendar /> : <Navigate to="/login" />} />
          <Route path="*"                element={<Navigate to={token ? "/tasks" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

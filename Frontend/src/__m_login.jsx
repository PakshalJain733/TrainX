import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import Login from "./pages/authentication/login";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Login />
  </BrowserRouter>
);

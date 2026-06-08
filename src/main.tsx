import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPanel from "./AdminPanel";
import "./index.css";

function Root() {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  if (path === "/admin" || path === "/admin/") {
    return <AdminPanel />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: ", location.pathname);
    document.title = "404 — TransactLab";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center glass-panel p-10 animate-fade-in">
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Page not found</p>
        <Link to="/dashboard" className="inline-flex items-center px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

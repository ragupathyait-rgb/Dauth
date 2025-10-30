import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { exchangeCodeForTokens, saveTokens } from "../services/authService";

export default function Callback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const client_id = import.meta.env.VITE_CLIENT_ID;
      const redirect_uri = window.location.origin + "/callback";
      const code_verifier = localStorage.getItem("pkce_verifier");
      const client_secret = import.meta.env.VITE_CLIENT_SECRET;
      try {
        const tokens = await exchangeCodeForTokens({ code, client_id, redirect_uri, code_verifier, client_secret });
        saveTokens(tokens);
        navigate("/dashboard");
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };
    run();
  }, [location.search, navigate]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Completing sign-in...</h1>
    </div>
  );
}



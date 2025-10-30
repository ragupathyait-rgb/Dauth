import { getTokens, clearTokens } from "../services/authService";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const tokens = getTokens();

  useEffect(() => {
    if (!tokens?.access_token) {
      navigate("/");
    }
  }, [tokens, navigate]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>You are logged in via DAuth.</p>
      <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto">{JSON.stringify(tokens, null, 2)}</pre>
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        onClick={() => {
          clearTokens();
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
}

import { useState } from "react";
// no navigation needed here

export default function Home() {
  const [busy, setBusy] = useState(false);

  const startLogin = async () => {
    setBusy(true);
    const client_id = import.meta.env.VITE_CLIENT_ID;
    window.location.href = `${import.meta.env.VITE_API_URL}/authorize?client_id=${encodeURIComponent(client_id)}`;
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={startLogin}
        disabled={busy}
        className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-60"
      >
        {busy ? "Redirecting..." : "Login with DAuth"}
      </button>
    </div>
  );
}

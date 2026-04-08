import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
};

function GoogleAuthButton({ onCredential, disabled = false }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setError("Google auth is not configured yet.");
        return;
      }

      try {
        await loadGoogleScript();

        if (!mounted || !window.google || !containerRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
            }
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
        });

        setReady(true);
      } catch (err) {
        setError(err.message || "Unable to initialize Google sign-in.");
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [onCredential]);

  if (error) {
    return <p className="text-xs text-amber-300">{error}</p>;
  }

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      {!ready && <p className="text-xs text-slate-400 mb-2">Loading Google sign-in...</p>}
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}

export default GoogleAuthButton;

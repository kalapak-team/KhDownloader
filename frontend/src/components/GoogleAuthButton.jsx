import { useEffect, useRef, useState } from "react";

import { getGoogleConfig } from "../services/api";

const GOOGLE_SCRIPT_ID = "google-identity-service";

export default function GoogleAuthButton({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
  const [isLoadingConfig, setIsLoadingConfig] = useState(!import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      return;
    }

    let isMounted = true;
    getGoogleConfig()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }
        setGoogleClientId((data?.client_id || "").trim());
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setGoogleClientId("");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) {
      return undefined;
    }

    const setupButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential);
          }
        },
      });

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        shape: "pill",
        theme: "filled_black",
        text: "continue_with",
        size: "large",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      setupButton();
      return undefined;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", setupButton);
    return () => script.removeEventListener("load", setupButton);
  }, [googleClientId, onCredential]);

  if (!googleClientId) {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-borderColor bg-bgPrimary px-4 py-2.5 text-sm font-medium text-textSecondary"
        >
          Continue with Google
        </button>
        <p className="text-center text-xs text-textSecondary">
          {isLoadingConfig ? "Checking Google sign-in..." : "Google sign-in is not configured on server."}
        </p>
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-70" : ""}>
      <div ref={buttonRef} className="mx-auto flex min-h-[44px] items-center justify-center" />
    </div>
  );
}

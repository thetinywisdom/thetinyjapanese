import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      navigate("/", { replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish();
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });

    const timeout = window.setTimeout(() => {
      if (!done) setError("That link didn't work. Try sending a new one.");
    }, 6000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-sm">{error}</p>
            <button
              className="text-sm underline"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

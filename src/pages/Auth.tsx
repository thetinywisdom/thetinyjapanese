import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSync } from "@/features/sync/SyncContext";

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useSync();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your email to sync across devices, no password needed, we'll send you a login link. Or continue as a guest to save everything locally.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-card p-6 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 mx-auto text-accent" />
            <p className="text-sm">
              Check your inbox — we sent a sign-in link to <strong>{email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              Open it on this device to finish signing in. The link expires after a while.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-6">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send link
            </Button>
            <p className="text-xs text-muted-foreground">
              No password needed. We email you a link that signs you in.
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Auth;

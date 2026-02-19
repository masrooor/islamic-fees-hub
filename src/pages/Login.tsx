import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Lock } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export default function Login() {
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const attemptsRef = useRef(0);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  if (session) return <Navigate to="/" replace />;


  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return "Enter a valid email address.";
    if (trimmedEmail.length > 255) return "Email is too long.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password.length > 128) return "Password is too long.";
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLocked) {
      const secsLeft = Math.ceil(((lockedUntil ?? 0) - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${secsLeft}s.`);
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);

    if (error) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setLockedUntil(until);
        attemptsRef.current = 0;
        setError(`Too many failed attempts. Account locked for 2 minutes.`);
      } else {
        // Generic error to avoid user enumeration
        setError("Invalid email or password.");
      }
    } else {
      attemptsRef.current = 0;
      setLockedUntil(null);
    }

    setLoading(false);
  };

  const remainingAttempts = MAX_ATTEMPTS - attemptsRef.current;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mb-2">
            ☪
          </div>
          <CardTitle className="text-xl">Islamic Education Center</CardTitle>
          <CardDescription>Fees Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={255}
                disabled={!!isLocked}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                maxLength={128}
                minLength={6}
                disabled={!!isLocked}
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                {isLocked ? (
                  <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                )}
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {!isLocked && attemptsRef.current > 0 && attemptsRef.current < MAX_ATTEMPTS && (
              <p className="text-xs text-muted-foreground">
                {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining before temporary lockout.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !!isLocked}>
              {loading ? "Signing in..." : isLocked ? "Locked" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

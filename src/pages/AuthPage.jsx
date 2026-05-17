import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocalAuth } from "@/lib/localAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function AuthPage() {
  const navigate = useNavigate();
  const t = useT();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { toast.error(t('pleaseFillAllFields')); return; }
    if (mode === "register" && password !== confirm) { toast.error(t('passwordsDoNotMatch')); return; }
    if (mode === "register" && password.length < 6) { toast.error(t('passwordTooShort')); return; }

    setLoading(true);
    try {
      if (mode === "register") {
        await LocalAuth.register(username.trim(), password);
        await LocalAuth.login(username.trim(), password);
        toast.success(t('accountCreated'));
      } else {
        await LocalAuth.login(username.trim(), password);
        toast.success(t('loggedIn'));
      }
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('appTitle')}</h1>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{mode === "login" ? t('signIn') : t('createAccount')}</CardTitle>
            <CardDescription>
              {mode === "login" ? t('accessVault') : t('setupVault')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm">{t('username')}</Label>
                <Input
                  id="username"
                  placeholder={t('enterUsernamePlaceholder')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPasswordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              {mode === "register" && (
                <div>
                  <Label htmlFor="confirm" className="text-sm">{t('confirmPassword')}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <KeyRound className="w-4 h-4 mr-2" />}
                {mode === "login" ? t('signIn') : t('createAccount')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>{t('alreadyHaveAccount')} {" "}
                  <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                    {t('register')}
                  </button>
                </>
              ) : (
                <>{t('alreadyHaveAccount')} {" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                    {t('signIn')}
                  </button>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              {t('localDataNote')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
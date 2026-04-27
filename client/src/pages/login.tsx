import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { LampIllustration } from "@/components/ui/lamp-illustration";
import rayaLogo from "@assets/raya_1772472529742.png";

// Som de interruptor curto em Base64 (WAV)
const switchSoundUrl = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="; // Usaremos um beep genérico curto caso não haja arquivo de som. Para melhorar a experiência, idealmente um MP3 de click.
// Para garantir compatibilidade e qualidade sem onerar o arquivo, instanciamos o Audio vazio e tentamos usar Web Audio API ou um som mais complexo.
// Mas o ideal é um som de switch mecânico. Como placeholder, usamos a API de Audio do navegador para gerar um click suave (oscilador).

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Credenciais inválidas");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate("/");
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao entrar", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Preencha usuário e senha", variant: "destructive" });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore if AudioContext is not supported or blocked
    }
  };

  const handlePageClick = () => {
    setIsLightOn((prev) => {
      const newState = !prev;
      playClickSound();
      return newState;
    });
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center text-white overflow-hidden transition-colors duration-700 ${!isLightOn ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: isLightOn ? '#1c1f24' : '#121417' }}
      onClick={handlePageClick}
    >
      <div className="relative flex flex-col md:flex-row items-center justify-center w-full max-w-[900px] px-6 gap-12 z-10">

        {/* Lado Esquerdo - Luminária */}
        <div className="relative w-[300px] md:w-[350px] h-[450px] flex-shrink-0">
          <LampIllustration isLightOn={isLightOn} />
        </div>

        {/* Lado Direito - Formulário */}
        <div className="relative w-full max-w-[380px]">

          {/* Mensagem Inicial (Apagado) */}
          <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out transform ${isLightOn ? 'opacity-0 translate-y-[-20px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <h1 style={{ fontFamily: "'Brume', sans-serif" }} className="text-4xl text-white/90 mb-4">
              Acenda a esteira criativa.
            </h1>
            <p className="text-sm text-white/50">
              Clique em qualquer lugar para acender a luz e acessar o estúdio.
            </p>
          </div>

          {/* Formulário (Aceso) */}
          <div
            className={`w-full bg-[#242220]/40 backdrop-blur-xl border border-white/5 p-10 rounded-[32px] shadow-2xl transition-all duration-700 ease-in-out transform ${isLightOn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="text-center">
                <h1 style={{ fontFamily: "'Brume', sans-serif" }} className="text-3xl text-white tracking-wide">Raya Studio</h1>
                <p className="text-sm text-white/50 mt-1">Explore sua Criatividade</p>
              </div>
            </div>

            <div className="mb-6 text-center">
              <p className="text-xs text-white/40 mt-1">Use suas credenciais para acessar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs text-white/50 ml-1 font-medium">Usuário</Label>
                <Input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="h-12 bg-[#1a1816]/60 border-white/5 text-white placeholder:text-white/20 focus-visible:bg-[#1a1816]/80 focus-visible:border-white/10 focus-visible:ring-0 rounded-2xl transition-all px-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-white/50 ml-1 font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 pr-12 bg-[#1a1816]/60 border-white/5 text-white placeholder:text-white/20 focus-visible:bg-[#1a1816]/80 focus-visible:border-white/10 focus-visible:ring-0 rounded-2xl transition-all px-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-4 rounded-2xl bg-[#f2efe9] hover:bg-white text-[#121417] font-semibold text-base transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin text-[#121417]" /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

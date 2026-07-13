import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  token: string | null;
  plano: string | null;
  trialDias: number;
  carregando: boolean;
}

export function useAuth(redirecionarSeNaoLogado = true) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    plano: null,
    trialDias: 0,
    carregando: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const plano = localStorage.getItem("plano");
    const trialDias = parseInt(localStorage.getItem("trial_dias") || "0");

    if (!token && redirecionarSeNaoLogado) {
      router.replace("/login");
      return;
    }

    setAuth({ token, plano, trialDias, carregando: false });
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("plano");
    localStorage.removeItem("trial_dias");
    router.replace("/login");
  };

  return { ...auth, logout };
}

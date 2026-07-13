interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export default function Logo({ size = "md", variant = "full" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-7 h-7 text-xs", text: "text-sm", sub: "text-[10px]" },
    md: { icon: "w-9 h-9 text-sm", text: "text-base", sub: "text-xs" },
    lg: { icon: "w-12 h-12 text-base", text: "text-xl", sub: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Ícone — letra O estilizada */}
      <div className={`${s.icon} rounded-xl flex items-center justify-center font-black relative overflow-hidden flex-shrink-0`}
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 60%, #f97316 100%)" }}>
        <span className="text-white relative z-10 tracking-tighter">Or</span>
        {/* Anel decorativo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-xl opacity-20"
            style={{ background: "radial-gradient(circle at 70% 30%, #f97316, transparent 60%)" }} />
        </div>
      </div>

      {variant === "full" && (
        <div>
          <p className={`${s.text} font-bold text-white leading-none tracking-tight`}>
            Orbita
          </p>
          <p className={`${s.sub} leading-none mt-0.5`}
            style={{ color: "#f97316" }}>
            Operador Inteligente
          </p>
        </div>
      )}
    </div>
  );
}

import { Bot } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 14, text: "text-sm",  box: "w-7 h-7" },
  md: { icon: 16, text: "text-base", box: "w-8 h-8" },
  lg: { icon: 22, text: "text-xl",  box: "w-11 h-11" },
};

export default function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl flex items-center justify-center flex-shrink-0`}
        style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
        <Bot size={s.icon} className="text-white" />
      </div>
      <span className={`font-bold text-white tracking-wide ${s.text}`}>Orbita</span>
    </div>
  );
}

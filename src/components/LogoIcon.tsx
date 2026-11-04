import { publicAsset } from "@/lib/site-base";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <img
      src={publicAsset(import.meta.env.BASE_URL, "logo.svg")}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}

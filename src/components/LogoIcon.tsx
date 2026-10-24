interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return <img src="/logo.svg" alt="" aria-hidden="true" className={className} />;
}

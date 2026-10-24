import logo from "@/assets/tiny-wisdom-logo.png";
import logoDark from "@/assets/tiny-wisdom-logo-dark.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center space-y-3">
        <a
          href="https://www.thetinywisdom.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="The Tiny Wisdom"
        >
          <img src={logo} alt="The Tiny Wisdom" className="h-7 w-auto dark:hidden" />
          <img src={logoDark.url} alt="The Tiny Wisdom" className="h-7 w-auto hidden dark:block" />
        </a>
        <p className="text-sm text-muted-foreground max-w-md">
          If you enjoy this website and would love to support me, please subscribe to my newsletter at{" "}
          <a
            href="https://www.thetinywisdom.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-[hsl(var(--accent))]"
          >
            www.thetinywisdom.com
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

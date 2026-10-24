import { Link } from "react-router-dom";
import { CircleUserRound, Loader2, RefreshCw, LogOut, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSync } from "@/features/sync/SyncContext";
import { cn } from "@/lib/utils";

function statusText(
  status: string,
  lastSyncedAt: number | null,
  email: string | null,
): string {
  const account = email ? `your account at ${email}` : "your account";
  if (status === "syncing") return `Syncing your data to ${account}…`;
  if (status === "error") return `Sync to ${account} failed — will retry`;
  if (status === "synced" && lastSyncedAt) {
    const mins = Math.floor((Date.now() - lastSyncedAt) / 60000);
    if (mins < 1) return `Your data are synced to ${account} just now`;
    if (mins === 1) return `Your data are synced to ${account} 1 minute ago`;
    return `Your data are synced to ${account} ${mins} minutes ago`;
  }
  return `Your data are synced to ${account}`;
}

interface Props {
  className?: string;
  variant?: "icon" | "row";
}

export function AccountMenu({ className, variant = "icon" }: Props) {
  const { email, status, lastSyncedAt, skippedImages, syncNow, signOut } = useSync();
  const icon = (
    <>
      {status === "syncing" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "error" ? (
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      ) : (
        <CircleUserRound className="h-3.5 w-3.5" />
      )}
    </>
  );

  if (!email) {
    if (variant === "row") {
      return (
        <Link
          to="/auth"
          className={cn(
            "px-2 py-1 rounded hover:bg-muted transition-colors inline-flex items-center gap-1",
            className,
          )}
        >
          {icon}
          Sign in
        </Link>
      );
    }
    return (
      <Link
        to="/auth"
        aria-label="Sign in"
        className={cn(
          "inline-flex items-center justify-center p-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground",
          className,
        )}
      >
        {icon}
      </Link>
    );
  }

  const triggerClass =
    variant === "row"
      ? "px-2 py-1 rounded hover:bg-muted transition-colors inline-flex items-center gap-1 outline-none cursor-pointer"
      : "inline-flex items-center justify-center p-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground outline-none cursor-pointer";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className={cn(triggerClass, className)}
      >
        {icon}
        {variant === "row" && (
          <span className="truncate">{email}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="text-xs font-normal">
          <span className="block truncate">{email}</span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">
            {statusText(status, lastSyncedAt, email)}
          </span>
          {skippedImages > 0 && (
            <span className="block text-[11px] text-muted-foreground mt-0.5">
              {skippedImages} drawing{skippedImages > 1 ? "s were" : " was"} too large to sync.
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => syncNow()} className="cursor-pointer gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Sync now
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer gap-2">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

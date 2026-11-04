import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Toaster, toast } from "@/components/ui/sonner";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("toasts follow the app theme", () => {
  it("marks the toaster dark when the app theme is dark", async () => {
    localStorage.setItem("theme", "dark");
    render(<Toaster />);
    toast("Saved on this device");
    const title = await screen.findByText("Saved on this device");
    const toaster = title.closest("[data-sonner-toaster]");
    expect(toaster).toHaveAttribute("data-theme", "dark");
    expect(toaster).toHaveStyle({ "--normal-bg": "hsl(var(--popover))" });
  });

  it("marks the toaster light when the app theme is light", async () => {
    localStorage.setItem("theme", "light");
    render(<Toaster />);
    toast("Light toast");
    const title = await screen.findByText("Light toast");
    expect(title.closest("[data-sonner-toaster]")).toHaveAttribute("data-theme", "light");
  });
});

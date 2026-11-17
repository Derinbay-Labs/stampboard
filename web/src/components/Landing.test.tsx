import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLONE_COMMAND, copyFor } from "@/content";
import { CommandBlock } from "./CommandBlock";
import { CloseUps, Final, Footer, Nav, Spec, StageSection, Steps, Trust } from "./Sections";

afterEach(() => vi.restoreAllMocks());

describe("CommandBlock", () => {
  const t = copyFor("en");
  it("copies the command and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CommandBlock labels={t} />);
    await userEvent.click(screen.getByRole("button"));
    expect(writeText).toHaveBeenCalledWith(CLONE_COMMAND);
    expect(await screen.findAllByText(t.copied)).not.toHaveLength(0);
  });
  it("announces failure and selects the text", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("no")) },
      configurable: true,
    });
    render(<CommandBlock labels={t} />);
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByText(t.copyFail)).toBeTruthy();
    expect(window.getSelection()?.toString()).toContain("git clone");
  });
});

describe("Stage", () => {
  it("moves between scene tabs with the arrow keys and lights a part", async () => {
    const t = copyFor("en");
    const { container } = render(<StageSection t={t} locale="en" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[1]!, { key: "End" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[2]!, { key: "ArrowRight" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[0]!, { key: "a" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    const note = container.querySelector(".note") as HTMLElement;
    await userEvent.click(note);
    expect(note).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".is-lit")).not.toBeNull();
    await userEvent.click(note);
    expect(container.querySelector(".is-lit")).toBeNull();
  });
  it.each(["en", "tr"] as const)("renders every scene in %s", (locale) => {
    const t = copyFor(locale);
    render(<StageSection t={t} locale={locale} />);
    for (const tab of screen.getAllByRole("tab")) {
      fireEvent.click(tab);
      expect(screen.getByRole("tabpanel").textContent).toContain("Stampboard");
    }
  });
});

describe("sections", () => {
  it.each(["en", "tr"] as const)("render in %s with a Labs nameplate", (locale) => {
    const t = copyFor(locale);
    const { container } = render(
      <>
        <Nav t={t} locale={locale} />
        <Spec t={t} />
        <CloseUps t={t} locale={locale} />
        <Steps t={t} />
        <Trust t={t} />
        <Final t={t} locale={locale} />
        <Footer t={t} locale={locale} />
      </>,
    );
    expect(container.querySelector("a.labs")).toHaveAttribute(
      "href",
      `https://derinbay.com/${locale}/labs/`,
    );
    expect(container.querySelector(".seg a[aria-current='true']")).toHaveTextContent(
      locale.toUpperCase(),
    );
  });
});

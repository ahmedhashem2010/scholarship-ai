import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWidget } from "@/components/chat-widget";

describe("ChatWidget", () => {
  it("renders closed state by default", () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText("Open AI chat")).toBeInTheDocument();
  });

  it("opens the chat panel when clicked", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByLabelText("Open AI chat"));
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByLabelText("Close chat")).toBeInTheDocument();
  });

  it("closes the chat panel when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByLabelText("Open AI chat"));
    await user.click(screen.getByLabelText("Close chat"));
    expect(screen.getByLabelText("Open AI chat")).toBeInTheDocument();
  });
});

import { act, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { send } from "emailjs-com";

import EmailForm from "./EmailForm";

jest.mock("emailjs-com", () => ({ send: jest.fn() }));
const sendMock = jest.mocked(send);
const originalFetch = global.fetch;
let resolveIpRequest: (response: Pick<Response, "ok" | "json">) => void;

const finishIpRequest = async (): Promise<void> => {
  await act(async () => {
    resolveIpRequest({ ok: true, json: async () => ({ IPv4: "127.0.0.1" }) });
  });
};

const fillFeedback = (): void => {
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: " Viewer " } });
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: " Feedback details " } });
};

describe("EmailForm", () => {
  beforeEach(() => {
    sendMock.mockReset();
    global.fetch = jest.fn().mockReturnValue(new Promise((resolve) => {
      resolveIpRequest = resolve;
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("rejects blank feedback and permits newlines in the message", async () => {
    render(<EmailForm setModalOpen={jest.fn()} />);
    await finishIpRequest();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Send Feedback" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please enter a name!");
    expect(sendMock).not.toHaveBeenCalled();

    const message = screen.getByRole("textbox", { name: "Message" });
    const newline = createEvent.keyDown(message, { key: "Enter", cancelable: true });
    fireEvent(message, newline);
    expect(newline.defaultPrevented).toBe(false);
  });

  it("allows one request at a time, trims fields, and clears the close timer on unmount", async () => {
    jest.useFakeTimers();
    let resolveSend!: (value: { status: number; text: string }) => void;
    sendMock.mockReturnValue(new Promise((resolve) => { resolveSend = resolve; }));
    const setModalOpen = jest.fn();
    const { unmount } = render(<EmailForm lineupId="lineup-1" setModalOpen={setModalOpen} />);
    await finishIpRequest();
    fillFeedback();
    const button = screen.getByRole("button", { name: "Send Feedback" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(sendMock).toHaveBeenCalledWith(
      "service_r60abgd", "template_lr0blbe",
      expect.objectContaining({ from_name: "Viewer", message: "Feedback details", lineup_id: "lineup-1", ip_address: "127.0.0.1" }),
      "TYyx4FALpcygXGRoA",
    );

    await act(async () => resolveSend({ status: 200, text: "OK" }));
    expect(screen.getByRole("status")).toHaveTextContent("Feedback sent");
    unmount();
    act(() => jest.runAllTimers());
    expect(setModalOpen).not.toHaveBeenCalled();
  });

  it("allows retry after a failed request and does not schedule a close after unmount", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("Offline"));
    const setModalOpen = jest.fn();
    const { unmount } = render(<EmailForm setModalOpen={setModalOpen} />);
    await finishIpRequest();
    fillFeedback();
    const button = screen.getByRole("button", { name: "Send Feedback" });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByRole("status")).toHaveTextContent("Unable to send feedback");

    let resolveSend!: (value: { status: number; text: string }) => void;
    sendMock.mockReturnValueOnce(new Promise((resolve) => { resolveSend = resolve; }));
    fireEvent.click(button);
    unmount();
    jest.useFakeTimers();
    await act(async () => resolveSend({ status: 200, text: "OK" }));
    act(() => jest.runAllTimers());
    expect(setModalOpen).not.toHaveBeenCalled();
  });
});

import React, { useState, useEffect, useRef } from "react";
import { send } from "emailjs-com";
import type { InfoMessage } from "../../types/lineup";

export interface EmailFormProps {
  lineupId?: string | null;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const getIPAddr = async (signal: AbortSignal): Promise<string> => {
  const response = await fetch("https://geolocation-db.com/json/", { signal });
  if (!response.ok) return "";
  const data: unknown = await response.json();

  if (
    typeof data === "object" &&
    data !== null &&
    "IPv4" in data &&
    typeof data.IPv4 === "string"
  ) {
    return data.IPv4;
  }

  return "";
};

const EmailForm = ({
  lineupId = null,
  setModalOpen,
}: EmailFormProps): JSX.Element => {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sendingMessage, setSendingMessage] = useState<InfoMessage>({
    value: "",
    type: "info",
  });
  const [ipAddress, setIpAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const mountedRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    void getIPAddr(controller.signal)
      .then((ip) => {
        if (!controller.signal.aborted) {
          setIpAddress(ip);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("Unable to determine feedback sender IP address:", error);
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (closeTimeoutRef.current !== undefined) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = (): readonly [boolean, string] => {
    if (sender.trim() === "") {
      return [false, "Please enter a name!"];
    }
    if (message.trim() === "") {
      return [false, "Please enter a message!"];
    }
    return [true, ""];
  };

  const sendEmail = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (sendingRef.current) return;

    const validate = validateForm();
    if (!validate[0]) {
      setSendingMessage({ value: validate[1], type: "error" });
      return;
    }

    sendingRef.current = true;
    setIsSending(true);
    setSendingMessage({ value: "Sending feedback...", type: "info" });

    try {
      await send(
        "service_r60abgd",
        "template_lr0blbe",
        {
          from_name: sender.trim(),
          ip_address: ipAddress,
          lineup_id: lineupId,
          message: message.trim(),
          reply_to: replyTo.trim(),
        },
        "TYyx4FALpcygXGRoA"
      );
      if (mountedRef.current) {
        setSendingMessage({
          value: "Feedback sent, thank you! Closing window...",
          type: "success",
        });
        closeTimeoutRef.current = setTimeout(() => setModalOpen(false), 3000);
      }
    } catch (error: unknown) {
      sendingRef.current = false;
      if (mountedRef.current) {
        setIsSending(false);
        setSendingMessage({
          value: "Unable to send feedback. Please try again.",
          type: "error",
        });
        console.error("Unable to send feedback:", error);
      }
    }
  };

  return (
    <form
      className="feedback-container"
      onSubmit={(event) => void sendEmail(event)}
    >
      <h2 className="feedback-header">
        Send feedback {lineupId !== null && "for this lineup"}
      </h2>
      <input
        className="feedback-name"
        name="name"
        aria-label="Name"
        placeholder="Name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
        autoComplete="off"
        maxLength={25}
      />
      <textarea
        className="feedback-description"
        name="description"
        aria-label="Message"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        autoComplete="off"
        maxLength={500}
      />
      <input
        className="feedback-reply-to"
        name="replyTo"
        type="email"
        aria-label="Reply email address (optional)"
        placeholder="Reply email address (optional)"
        value={replyTo}
        onChange={(e) => setReplyTo(e.target.value)}
        autoComplete="off"
        maxLength={50}
      />
      <button
        className="feedback-submit-button"
        type="submit"
        disabled={isSending}
      >
        Send Feedback
      </button>
      {sendingMessage.value !== "" && (
        <div role="status" className={`sending-message ${sendingMessage.type}`}>
          {sendingMessage.value}
        </div>
      )}
    </form>
  );
};

export default EmailForm;

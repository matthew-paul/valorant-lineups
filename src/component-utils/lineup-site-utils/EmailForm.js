import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { send } from "emailjs-com";

const EmailForm = (props) => {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sendingMessage, setSendingMessage] = useState(["", "info"]);
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    getIPAddr().then((ip) => setIpAddress(ip));
  }, []);

  const getIPAddr = async () => {
    const response = await fetch("https://geolocation-db.com/json/");
    const data = await response.json();
    return data.IPv4;
  };

  const validateForm = () => {
    if (sender === "") return [false, "Please enter a name!"];
    if (message === "") return [false, "Please enter a message!"];
    return [true, ""];
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (ipAddress === "") {
      setSendingMessage(["Please try again in a few seconds", "error"]);
    }

    let validate = validateForm();
    if (!validate[0]) {
      setSendingMessage([validate[1].toString(), "error"]);
      return;
    }

    send(
      "service_r60abgd",
      "template_lr0blbe",
      {
        from_name: sender,
        ip_address: ipAddress,
        lineup_id: props.lineupId,
        message: message,
        reply_to: replyTo,
      },
      "EkSY40i2KKwEobLzD"
    )
      .then((response) => {
        setSendingMessage([
          "Feedback sent, thank you! Closing window...",
          "success",
        ]);
        console.log("SUCCESS!", response.status, response.text);
        setTimeout(() => props.setModalOpen(false), 3000);
      })
      .catch((err) => {
        setSendingMessage(["Error sending feedback: " + err, "error"]);
        console.log("FAILED...", err);
      });
  };

  const onKeyPress = (event) => {
    // problem with react tag when pressing enter in video input
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <div className="feedback-container">
      <h2 className="feedback-header">
        Send feedback {props.lineupId !== null && "for this lineup"}
      </h2>
      <input
        className="feedback-name"
        name="name"
        placeholder="Name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
        autoComplete="off"
        maxLength={25}
        onKeyDown={onKeyPress}
      />
      <textarea
        className="feedback-description"
        name="description"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        autoComplete="off"
        onKeyDown={onKeyPress}
        maxLength={500}
      />
      <input
        className="feedback-reply-to"
        name="replyTo"
        placeholder="Reply email address (optional)"
        value={replyTo}
        onChange={(e) => setReplyTo(e.target.value)}
        autoComplete="off"
        maxLength={50}
        onKeyDown={onKeyPress}
      />
      <button
        className="feedback-submit-button"
        onClick={(e) => {
          setSendingMessage(["Sending feedback...", "info"]);
          sendEmail(e);
        }}
      >
        Send Feedback
      </button>
      {sendingMessage[0] !== "" ? (
        <div className={`sending-message ${sendingMessage[1]}`}>
          {sendingMessage[0]}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

EmailForm.propTypes = {
  lineupId: PropTypes.string,
  setModalOpen: PropTypes.func.isRequired,
};

EmailForm.defaultProps = {
  lineupId: null,
};

export default EmailForm;

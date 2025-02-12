import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./otpmodal.module.css";
import Button from "../../shared/button/button.jsx";

const OTPModal = ({ isOpen, onClose, onSubmit, phoneNumber, mode }) => {
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(119); // 1:59 minutes timer
  const [resendEnabled, setResendEnabled] = useState(false);
  const navigate = useNavigate();

  // Handle OTP input change
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to the next input automatically
      if (value && index < otp.length - 1) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  // Handle backspace functionality
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        document.getElementById(`otp-input-${index - 1}`).focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  // Format timer display
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    setError("");

    if (otpValue.length !== 5) {
      setError("کد تأیید باید ۵ رقم باشد.");
      return;
    }

    const query = `
      mutation {
        ${mode === "login" ? "verifyLoginOtp" : "verifyOtp"}(
          phone: "${phoneNumber}", 
          otp: ${otpValue}
        ) {
          success
          ${mode === "login" ? "token" : ""}
        }
      }
    `;

    try {
      const response = await fetch("http://95.217.8.192:8000/graphql/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const result =
        mode === "login" ? data?.data?.verifyLoginOtp : data?.data?.verifyOtp;

      if (result?.success) {
        if (mode === "login" && result.token) {
          // ذخیره توکن و شماره تلفن
          sessionStorage.setItem("sessionToken", result.token);
          sessionStorage.setItem("userPhone", phoneNumber);
          setError(""); // پاک کردن پیام‌های خطا

          // نمایش پیام موفقیت
          setError("ورود موفقیت‌آمیز بود!");

          // ریدایرکت با تاخیر
          setTimeout(() => {
            onClose();
            window.location.href = "/dashboard";
          }, 1000);
        } else if (mode === "signup") {
          onSubmit(otpValue);
          onClose();
        }
      } else {
        setError("کد تأیید نادرست است. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("خطایی در تأیید کد رخ داده است.");
    }
  };

  // Handle OTP resend
  const handleResendCode = async () => {
    setError("");
    setTimer(119); // Reset timer
    setResendEnabled(false);

    const query = `
      mutation {
        ${
          mode === "login" ? "requestLoginOtp" : "requestOtp"
        }(phone: "${phoneNumber}") {
          success
        }
      }
    `;

    try {
      const response = await axios.post(
        "http://95.217.8.192:8000/graphql/",
        { query },
        { headers: { "Content-Type": "application/json" } }
      );

      const requestResult =
        mode === "login"
          ? response.data?.data?.requestLoginOtp
          : response.data?.data?.requestOtp;

      if (!requestResult?.success) {
        setError("ارسال مجدد کد با مشکل مواجه شد.");
      }
    } catch (err) {
      setError("مشکلی در ارتباط با سرور رخ داد.");
    }
  };

  // Timer countdown logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendEnabled(true);
    }
  }, [timer]);

  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles["modal-title"]}>کد تأیید</h2>
        <p className={styles["modal-subtitle"]}>
          کد ارسال‌شده به {phoneNumber} را وارد کنید:
        </p>
        <button className={styles["edit-phone-link"]} onClick={onClose}>
          ویرایش شماره موبایل
        </button>

        <div className={styles["otp-input-container"]}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={styles["otp-input"]}
              style={{ direction: "ltr", textAlign: "center" }}
            />
          ))}
        </div>

        <div className={styles["resend-container"]}>
          {resendEnabled ? (
            <button
              onClick={handleResendCode}
              className={styles["resend-button"]}
            >
              ارسال مجدد کد
            </button>
          ) : (
            <span className={styles["timer-text"]}>
              تا دریافت مجدد کد: {formatTimer()}
            </span>
          )}
        </div>

        {error && <div className={styles["error-message"]}>{error}</div>}

        <Button
          text={"تأیید"}
          size="large"
          onClick={handleVerifyOtp}
          customStyles={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default OTPModal;

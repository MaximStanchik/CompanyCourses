import React, { useState } from "react";

const Register = () => {
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return "";
    
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    
    if (score <= 2) return "Weak";
    if (score === 3) return "Moderate";
    return "Strong";
  };

  const onChange = (e) => {
    // ... existing code ...
    if (name === "password") {
      setPassword(value);
      setPasswordStrength(getPasswordStrength(value));
    } else if (name === "username") {
      // ... existing code ...
    }
  };

  return (
    <div>
      {/* Password strength */}
      {password && (
        <div className="mb-2">
          <div
            className={classnames("password-strength-bar", {
              "weak": passwordStrength === "Weak",
              "fair": passwordStrength === "Moderate",
              "good": passwordStrength === "Strong",
              "strong": passwordStrength === "Strong"
            })}
          />
          <small className="text-muted">
            {passwordStrength === "Weak" && "Weak - Your password is too easy to guess."}
            {passwordStrength === "Moderate" && "Moderate - Almost there."}
            {passwordStrength === "Strong" && "Strong - you did it!"}
            {!passwordStrength && "* at least 8 characters, including a number"}
          </small>
        </div>
      )}
      
      {/* Confirm password */}
    </div>
  );
};

export default Register; 
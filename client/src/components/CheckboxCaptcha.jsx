"use client";
import { useState } from "react";

export default function CheckboxCaptcha({ onVerify }) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e) => {
    const value = e.target.checked;
    setChecked(value);
    onVerify(value);
  };

  return (
    <div className="flex items-center gap-3 border-2 border-gray-400 p-4 rounded-lg w-fit bg-white shadow-sm hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-6 h-6 cursor-pointer accent-green-600"
        id="captcha-checkbox"
      />
      <label htmlFor="captcha-checkbox" className="text-base font-semibold text-gray-900 select-none cursor-pointer">
        I'm not a robot
      </label>
    </div>
  );
}

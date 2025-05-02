import React from "react";

interface SelectionPopupProps {
  position: { top: number; left: number };
  selectedText: string;
  onAskGpt: (text: string) => void;
}

const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  onAskGpt,
}) => {
  return (
    <div
      className="selection-popup"
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
    >
      <button className="ask-gpt-button" onClick={() => onAskGpt(selectedText)}>
        Ask GPT
      </button>
    </div>
  );
};

export default SelectionPopup;

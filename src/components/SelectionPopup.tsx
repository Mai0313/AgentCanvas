import React from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";

interface SelectionPopupProps {
  position: { top: number; left: number };
  selectedText: string;
  onAskGpt: (text: string) => void;
}

// Icon for the Ask GPT button
const AskIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

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
        transform: "translateX(-50%)", // Center horizontally
        filter: "drop-shadow(0 10px 8px rgb(0 0 0 / 0.2))",
      }}
    >
      <Card className="py-1 px-1 selection-popup-card">
        <Button
          color="primary" 
          variant="flat"
          size="sm"
          startContent={<AskIcon />}
          onClick={() => onAskGpt(selectedText)}
          className="whitespace-nowrap"
        >
          Ask GPT
        </Button>
      </Card>
    </div>
  );
};

export default SelectionPopup;

import React from "react";

export const HighlightedText = ({
    text,
    highlight,
  }: {
    text: string;
    highlight: string;
  }) => {
      if (!highlight.trim()) {
        return <span>{text}</span>;
      }
      
      const regex = new RegExp(`(${highlight})`, "gi");
      const parts = text.split(regex);

        return (
          <span>
            {parts.filter(String).map((part, i) => {
              return regex.test(part) ? (
                <mark key={i}>{part}</mark>
              ) : (
                <span key={i}>{part}</span>
              );
            })}
          </span>
        );
  };
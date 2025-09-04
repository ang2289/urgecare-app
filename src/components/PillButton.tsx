// src/components/PillButton.tsx
import React from 'react'

interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function PillButton({ label, active, onClick, children }: Props) {
  return (
    <button type="button" className={`pill-btn${active ? ' is-active' : ''}`} onClick={onClick}>
      {label}
      {children}
    </button>
  );
}

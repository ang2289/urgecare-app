// src/components/PillButton.tsx
import React from 'react'

type PillButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

type Props = {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export default function PillButton({ active, onClick, children }: Props) {
  return (
    <button type="button" className={`pill-btn${active ? ' is-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

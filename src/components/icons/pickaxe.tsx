import { LucideProps } from "lucide-react";

export function Pickaxe(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 10l4-4" />
      <path d="M16 10l-8 8" />
      <path d="M8 18L4 22" />
      <path d="M4 4l16 16" />
    </svg>
  );
} 
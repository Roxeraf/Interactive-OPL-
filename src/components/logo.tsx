export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect width="32" height="32" rx="3" fill="#0066CC" />
      <path
        d="M9.2 8.4 16 15.2 22.8 8.4 24.6 10.2 17.8 17 24.6 23.8 22.8 25.6 16 18.8 9.2 25.6 7.4 23.8 14.2 17 7.4 10.2 9.2 8.4Z"
        fill="#fff"
      />
    </svg>
  );
}

import React from 'react';

export default function BrandMark({ className }) {
  return (
    <div className={`brand-mark ${className || ''}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M32 54.5c-.6 0-1.2-.2-1.7-.6-1.5-1.1-14.8-11-19.5-20.5C7.5 25.4 10.3 15 18.8 11.2c4.8-2.2 10.5-.8 13.7 2.7 3.2-3.5 8.9-4.9 13.7-2.7 8.5 3.8 11.3 14.2 7.9 21.9-4.7 9.5-18 19.4-19.5 20.5-.5.4-1.1.6-1.6.6zm0-8.6c3.8-3 10.6-8.8 13.5-14.7 2.2-4.7 1.4-10.8-3-13.1-4-2-8.6-.1-9.9 3-.4 1.1-1.5 1.8-2.6 1.8s-2.2-.7-2.6-1.8c-1.3-3.1-5.9-5-9.9-3-4.4 2.3-5.2 8.4-3 13.1 2.9 5.9 9.7 11.7 13.5 14.7z" fill="currentColor" />
        <path d="M21.6 31.8h6.8l2.7-5.6 3.9 11 2.2-5.4H42" fill="none" stroke="currentColor" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

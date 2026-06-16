"use client";

import { useJourney } from "./JourneyProvider";

export default function JourneyButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { openJourney } = useJourney();
  return (
    <button type="button" className={className} onClick={openJourney}>
      {children}
    </button>
  );
}

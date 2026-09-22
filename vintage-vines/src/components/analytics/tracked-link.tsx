"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/actions/analytics";
import type { AnalyticsEventType } from "@/types/database";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: AnalyticsEventType;
}

/** A plain <a> that also fires an analytics event on click — for mailto/tel/external links a Server Component can't attach an onClick to. */
export function TrackedLink({ event, onClick, ...anchorProps }: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        void trackEvent(event);
        onClick?.(e);
      }}
    />
  );
}

// Section 6: "cap text length." Kept dependency-free so client
// components can import it without pulling in server-only AI code —
// the same bug class as Phase 3's upload-limits split.
export const MAX_MATCHMAKER_TEXT_LENGTH = 600;

// Page-level marketing copy, kept separate from src/config/business.ts
// (structured facts/pricing) and out of the components themselves, per
// section 11: "editable ... homepage text ... kept separate from
// presentation components."

export const siteCopy = {
  landing: {
    hero: {
      eyebrow: "Columbus, Ohio · Locally propagated",
      headline: "One-of-one plants, grown with purpose.",
      body: "Every Vintage Vines piece pairs a locally propagated houseplant with a thrifted vintage vessel. No two are alike, and the one you choose is the exact one you'll take home.",
    },
    matchmaker: {
      heading: "Find your plant",
      prompt:
        "Tell us about you, the person you're buying for, or the space this plant will call home.",
      examples: [
        "A closing gift for someone with a sunny kitchen",
        "I travel often and forget to water",
        "A pet-friendly plant for a dim office",
      ],
      buttonLabel: "Match me with a plant",
    },
    howItWorks: [
      {
        title: "Tell us about the person or space",
        body: "A few sentences about who it's for, or where it'll live, is all we need.",
      },
      {
        title: "We check real available pieces",
        body: "No wish-list magic — just what's actually sitting in the collection today.",
      },
      {
        title: "You claim the exact one you see",
        body: "The photo is the plant. What you claim is what arrives.",
      },
    ],
    waysToWorkWithUs: {
      heading: "Two ways to work with us",
      realtorCard: {
        heading: "For real estate agents",
        body: "A memorable, locally made closing gift that feels personal without being difficult to order.",
        cta: "Start a realtor order",
      },
      shopCard: {
        heading: "For shops",
        body: "A changing display of one-of-one pieces that gives customers a reason to look again.",
        cta: "Ask about a shop display",
      },
    },
    founderNote: {
      heading: "A note from Libby",
      teaser:
        "I've always loved plants and gardening and wanted to do something with that love that fits seamlessly into my hectic life as a part time transition specialist and mom of two littles.",
      cta: "Read more about Vintage Vines",
    },
  },
  about: {
    eyebrow: "About",
    headline: "Grown with purpose, one vessel at a time.",
    founderStory: [
      "I've always loved plants and gardening and wanted to do something with that love that fits seamlessly into my hectic life as a part time transition specialist and mom of two littles.",
      "Everyone around here is growing in some way, and I wanted to grow as well alongside the plants. The vintage vessels are another aspect of growing something into a different purpose.",
      "And grown with purpose ties into that by supporting people with disabilities in employment while also just stating that there is love, purpose, and meaningfulness behind the growth.",
    ],
    founderAttribution: "— Libby Costin, founder",
    propagation: {
      heading: "Locally propagated",
      body: "Every plant starts here in Columbus, propagated by hand rather than shipped in from a wholesaler.",
    },
    vessels: {
      heading: "Thrifted vintage vessels",
      body: "Each vessel is a real find — brass, ceramic, stoneware — thrifted and given a second purpose. Vessels never repeat, so the piece you choose really is the only one.",
    },
    cta: "See available pieces",
  },
  realtors: {
    eyebrow: "For Realtors",
    headline: "A closing gift worth remembering.",
    intro:
      "A memorable, locally made closing gift that feels personal without being difficult to order.",
    ctaLabel: "Start a realtor order",
    mailSubject: "Realtor closing gift order",
  },
  shops: {
    eyebrow: "For Shops",
    headline: "A display worth a second look.",
    intro:
      "A changing display of one-of-one pieces that gives customers a reason to look again.",
    ctaLabel: "Ask about a shop display",
    mailSubject: "Shop display inquiry",
  },
} as const;

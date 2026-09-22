export type SizeClass = "small" | "standard" | "large";

export interface PricingTier {
  sizeClass: SizeClass;
  label: string;
  priceCents: number;
}

export interface DeliveryTier {
  maxMiles: number;
  feeCents: number;
  label: string;
}

export interface BusinessConfig {
  name: string;
  tagline: string;
  founder: string;
  location: {
    city: string;
    state: string;
    pickupArea: string;
  };
  contact: {
    email: string;
    phone: string;
    phoneHref: string;
    instagramHandle: string;
    instagramUrl: string;
  };
  purpose: {
    statement: string;
    /** PENDING — Libby has not chosen a beneficiary organization yet. */
    beneficiaryOrganization: string | null;
    /** PENDING — no donation percentage or amount has been confirmed yet. */
    donationAmount: string | null;
  };
  packaging: {
    description: string;
  };
  tax: {
    note: string;
  };
  oneOfOnePricing: PricingTier[];
  productNaming: {
    pattern: string;
    example: string;
  };
  firstCollection: {
    audience: string;
    focusSize: string;
    leadPlants: string[];
    knownVesselMaterials: string[];
  };
  realtors: {
    signatureGiftPriceCents: number;
    volumePriceCents: number;
    volumeMinimumQuantity: number;
    leadTimeDays: { min: number; max: number };
    fulfillment: string;
  };
  shops: {
    termsNote: string;
  };
  fulfillment: {
    deliveryTiers: DeliveryTier[];
    beyondMaxMilesNote: string;
    pickupNote: string;
  };
  returns: {
    policy: string;
    /** PENDING — depends on whether the payment provider requires a separate cancellation rule. */
    cancellationTiming: string | null;
  };
  admin: {
    /** PENDING — Libby has not specified which email addresses may access admin. */
    approvedEmails: string[];
  };
  uploads: {
    /** PENDING — desired number of photos per piece has not been specified. */
    maxPhotosPerItem: number | null;
    /** PENDING — maximum upload size has not been specified. */
    maxUploadSizeMb: number | null;
  };
  petSafety: {
    /** Libby has not supplied per-plant pet-safety data. Never treat unknown as safe. */
    dataProvided: boolean;
  };
}

export const business: BusinessConfig = {
  name: "Vintage Vines",
  tagline: "Grown with Purpose.",
  founder: "Libby Costin",
  location: {
    city: "Columbus",
    state: "Ohio",
    pickupArea: "Upper Arlington",
  },
  contact: {
    email: "vintagevinesohio@gmail.com",
    phone: "614-288-8800",
    phoneHref: "tel:+16142888800",
    instagramHandle: "@vintagevinescolumbus",
    instagramUrl: "https://www.instagram.com/vintagevinescolumbus",
  },
  purpose: {
    statement: "A portion of every sale supports meaningful employment for people with disabilities.",
    beneficiaryOrganization: null,
    donationAmount: null,
  },
  packaging: {
    description: "kraft gift tag and hand-stamped wood round",
  },
  tax: {
    note: "Ohio sales tax included",
  },
  oneOfOnePricing: [
    { sizeClass: "small", label: "Small", priceCents: 1000 },
    { sizeClass: "standard", label: "Standard", priceCents: 2000 },
    { sizeClass: "large", label: "Large or rare", priceCents: 4000 },
  ],
  productNaming: {
    pattern: "{fun name} - {plant} in {vessel}",
    example: "Betty - snake plant in brass tumbler",
  },
  firstCollection: {
    audience: "realtors",
    focusSize: "medium 4-inch plants",
    leadPlants: ["pothos", "inch plant", "philodendron", "snake plant"],
    knownVesselMaterials: ["brass", "ceramic", "stoneware"],
  },
  realtors: {
    signatureGiftPriceCents: 3000,
    volumePriceCents: 2500,
    volumeMinimumQuantity: 5,
    leadTimeDays: { min: 3, max: 5 },
    fulfillment: "Hand-delivered locally or Upper Arlington pickup",
  },
  shops: {
    termsNote: "Flexible terms, ask me.",
  },
  fulfillment: {
    deliveryTiers: [
      { maxMiles: 10, feeCents: 0, label: "Free within Upper Arlington and up to 10 miles" },
      { maxMiles: 20, feeCents: 1000, label: "$10 for 10 to 20 miles" },
      { maxMiles: 30, feeCents: 2000, label: "$20 for 20 to 30 miles" },
    ],
    beyondMaxMilesNote: "30+ miles by individual inquiry",
    pickupNote: "Pickup available - message for details",
  },
  returns: {
    policy:
      "Only items damaged in delivery may be returned. There are no returns for plant decline after delivery.",
    cancellationTiming: null,
  },
  admin: {
    approvedEmails: [],
  },
  uploads: {
    maxPhotosPerItem: null,
    maxUploadSizeMb: null,
  },
  petSafety: {
    dataProvided: false,
  },
};

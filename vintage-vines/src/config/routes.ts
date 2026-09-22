export type RouteKey =
  | "home"
  | "about"
  | "purchase"
  | "inventory"
  | "realtors"
  | "shops"
  | "admin";

export interface RouteDefinition {
  key: RouteKey;
  path: string;
  label: string;
  purpose: string;
  primaryAction: string;
}

export const routes: Record<RouteKey, RouteDefinition> = {
  home: {
    key: "home",
    path: "/",
    label: "Home",
    purpose: "Landing page and plant matchmaker",
    primaryAction: "Find my plant",
  },
  about: {
    key: "about",
    path: "/about",
    label: "About",
    purpose: "Libby, local propagation, vintage vessels, and purpose",
    primaryAction: "See available pieces",
  },
  purchase: {
    key: "purchase",
    path: "/purchase",
    label: "Shop",
    purpose: "Browse and claim exact available pieces",
    primaryAction: "Claim this exact piece",
  },
  inventory: {
    key: "inventory",
    path: "/inventory",
    label: "Inventory",
    purpose: "Public view of current inventory; intentionally empty at launch",
    primaryAction: "Browse available pieces or join the empty-state path",
  },
  realtors: {
    key: "realtors",
    path: "/realtors",
    label: "For Realtors",
    purpose: "Closing-gift offer and volume ordering",
    primaryAction: "Start a realtor order",
  },
  shops: {
    key: "shops",
    path: "/shops",
    label: "For Shops",
    purpose: "Display and restock program",
    primaryAction: "Ask about a shop display",
  },
  admin: {
    key: "admin",
    path: "/admin",
    label: "Admin",
    purpose: "Authenticated inventory management",
    primaryAction: "Add a piece",
  },
};

export interface NavLink {
  label: string;
  path: string;
}

// Matches section 4: "Shop, Find your plant, About, For Realtors, For Shops."
export const primaryNav: NavLink[] = [
  { label: "Shop", path: routes.purchase.path },
  { label: "Find your plant", path: "/#matchmaker" },
  { label: "About", path: routes.about.path },
  { label: "For Realtors", path: routes.realtors.path },
  { label: "For Shops", path: routes.shops.path },
];

export const headerCta: NavLink = {
  label: "See what's available",
  path: routes.purchase.path,
};

// Public sitemap excludes admin, drafts, and private claim pages (section 14).
export const publicRoutes: RouteDefinition[] = [
  routes.home,
  routes.about,
  routes.purchase,
  routes.inventory,
  routes.realtors,
  routes.shops,
];

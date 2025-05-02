export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "AgentCanvas",
  description: "Agent Canvas, a web-based platform for interactive Chatbot",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Chat",
      href: "/chat",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://www.mediatek.com/",
    twitter: "https://www.mediatek.com/",
    docs: "https://www.mediatek.com/",
    discord: "https://www.mediatek.com/",
  },
};

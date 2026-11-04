// Page title/description for /blogs (the page itself is a client component, which can't export metadata).
export const metadata = {
  title: { default: "Blog", template: "%s | SaaSify" },
  description: "Guides, trends and ideas for growing a SaaS business.",
};

export default function Layout({ children }) {
  return children;
}

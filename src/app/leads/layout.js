// Page title/description for /leads (the page itself is a client component, which can't export metadata).
export const metadata = {
  title: "Leads",
  description: "Form submissions received by the site.",
  robots: { index: false },
};

export default function Layout({ children }) {
  return children;
}

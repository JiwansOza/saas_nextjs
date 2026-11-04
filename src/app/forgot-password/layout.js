// Page title/description for /forgot-password (the page itself is a client component, which can't export metadata).
export const metadata = {
  title: "Reset Password",
  description: "Request a password reset link for your SaaSify account.",
  robots: { index: false },
};

export default function Layout({ children }) {
  return children;
}

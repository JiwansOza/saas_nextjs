// Blog post titles come from the URL (the slug is the post title).
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = decodeURIComponent(slug || "").trim();
  return { title: title || "Blog", description: title ? `${title} — on the SaaSify blog.` : undefined };
}

export default function Layout({ children }) {
  return children;
}

// TEMPORARY — home page is for signed-in visitors only. Delete this file to undo it.
//
// `saasify_session` is the cookie the login and signup pages set and the navbar's
// logout clears, so its presence is what "signed in" already means to the rest of the
// site. Checked here, on the server, rather than in the page: a client-side check would
// paint the landing page first and then swap it for the login form.
import { NextResponse } from "next/server";

export function middleware(request) {
  if (request.cookies.get("saasify_session")?.value) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

// Only the home page. Add paths here ("/pricing", "/features", …) to gate more.
export const config = { matcher: ["/"] };

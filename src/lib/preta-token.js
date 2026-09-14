// UNUSED as of the switch to cookie delivery (data-ctx-cookie). Kept for reference only.
//
// This signed the context JWT inside Next.js so RootLayout could print it into
// window.__PRETA_CTX__ (data-ctx-var). That is no longer how the token reaches the browser:
// our own backend already signs it and returns it as `preta_token` from /auth/login,
// /auth/signup and /users/preta-token (saas-backend/src/routes/auth.js, users.js), and
// src/lib/preta-cookie.js writes that into the `preta_ctx` cookie.
//
// Keeping a second signer here would mean PRETA_PRIVATE_KEY living in two places for no
// benefit. Delete this file once you are sure nothing else imports it.
import { SignJWT, importPKCS8 } from "jose";

// PEM may be stored raw (with BEGIN header, \n escaped) or base64 in the env.
function decodePem(value) {
  if (!value) return null;
  if (value.includes("BEGIN")) return value.replace(/\\n/g, "\n");
  return Buffer.from(value, "base64").toString("utf8");
}

const PRIVATE_PEM = decodePem(process.env.PRETA_PRIVATE_KEY);

let privateKeyPromise;
function getPrivateKey() {
  if (!PRIVATE_PEM) throw new Error("PRETA_PRIVATE_KEY is not set");
  if (!privateKeyPromise) privateKeyPromise = importPKCS8(PRIVATE_PEM, "RS256");
  return privateKeyPromise;
}

/**
 * Create the signed context token consumed by the Preta SDK via
 * window.__PRETA_CTX__ + data-ctx-var. The edge verifies only the SIGNATURE
 * (against the company's registered public key), so we just carry the user
 * attributes under the preta:user namespace — plan is what the rules target.
 * @param {{plan?:string, role?:string, has_paid?:boolean, risk_score?:number, billing_status?:string, [k:string]:any}} ctx
 * @param {{ttlSeconds?:number}} [opts]
 */
export async function createPretaContextToken(ctx, opts = {}) {
  const key = await getPrivateKey();
  const ttl = opts.ttlSeconds ?? 300; // 5 minutes — re-signed on every page load anyway
  return await new SignJWT({ "preta:user": { ...ctx } })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(key);
}

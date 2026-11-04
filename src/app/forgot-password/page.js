"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { track } from "@/lib/analytics";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (status === "error") setStatus("idle");
  };

  // There is no self-serve reset yet: the request is stored with the site's leads (shown on
  // /leads) and the team sends the link. The message says exactly that.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_name: "Password reset request",
          element_type: "site_form",
          domain: window.location.hostname,
          pathname: window.location.pathname,
          form_data: { email: email.trim().toLowerCase() },
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("password_reset_request");
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden">
      {/* Background Grid & Gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_206%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card border shadow-lg p-0">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Forgot Password?</h2>
            <p className="text-muted-foreground text-center">
              Enter your email address, and we&apos;ll send you a link to reset
              your password.
            </p>

            {/* Forgot Password Form */}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="johndoe@example.com"
                  value={email}
                  onChange={handleChange}
                  className="mt-1 w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={status === "sending"}
                className="w-full mt-4 rounded-full text-base py-5 cursor-pointer bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg group"
              >
                Send Reset Link
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-all ease-in-out duration-300" />
              </Button>
            </form>
            {status === "sent" && (
              <p className="text-sm text-center text-green-600 dark:text-green-400">
                Request received. If an account exists for {email.trim()}, our team will email you a reset link within one business day.
              </p>
            )}
            {status === "error" && <p className="text-sm text-center text-red-600 dark:text-red-400">Enter a valid email address.</p>}
            {status === "failed" && (
              <p className="text-sm text-center text-red-600 dark:text-red-400">
                We couldn’t send your request. Please try again or email support@saascompany.com.
              </p>
            )}

            <p className="text-base text-muted-foreground text-center">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

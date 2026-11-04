"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// ?topic= from the "Book a Demo" / "Contact Sales" buttons.
const TOPICS = {
  demo: { heading: "Book a Demo", hint: "Tell us about your team and a good time for a 30-minute demo." },
  enterprise: { heading: "Talk to Sales", hint: "Tell us about your team size and what you need from Enterprise." },
};

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [topic, setTopic] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topic");
    if (TOPICS[t]) setTopic(t);
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Stored with the site's other leads (saas-backend /leads), so they show on /leads.
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email and message.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_name: topic ? `Contact page (${topic})` : "Contact page",
          element_type: "site_form",
          domain: window.location.hostname,
          pathname: window.location.pathname,
          form_data: { name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), topic: topic || "general" },
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("generate_lead", { form: "contact", topic: topic || "general" });
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
      setError("We couldn’t send your message. Please try again or email support@saascompany.com.");
    }
  };

  return (
    <section className="w-full py-20 px-6 md:px-10 bg-muted/30 dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Get in Touch
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Have questions or need help? Fill out the form below or reach out to
          us directly.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-muted p-8 rounded-xl shadow-md border"
        >
          <h3 className="text-2xl font-semibold mb-6">{topic ? TOPICS[topic].heading : "Send a Message"}</h3>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <Input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Your Name"
              className="p-3 rounded-lg h-12"
            />
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Your Email"
              className="p-3 rounded-lg h-12"
            />
            <Textarea
              name="message"
              value={form.message}
              onChange={onChange}
              placeholder={topic ? TOPICS[topic].hint : "Your Message"}
              className="p-3 rounded-lg h-28"
              rows={12}
              cols={20}
            />
            <Button type="submit" disabled={status === "sending"} className="w-full flex py-6 text-base items-center gap-2 cursor-pointer">
              {status === "sending" ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {status === "sending" ? "Sending…" : "Send Message"}
            </Button>
            {status === "sent" && <p className="text-sm text-green-600 dark:text-green-400">Thanks — we’ve got your message and will reply within one business day.</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border dark:bg-neutral-800 p-8 rounded-xl shadow-md "
        >
          <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="size-6" />
              <p>support@saascompany.com</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-6" />
              <p>+1 234 567 890</p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-6" />
              <p>123 SaaS Street, Tech City, USA</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactPage;

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { formatPrice } from "./catalog";
import type { Order } from "./types";

/*
 * Purchase emails over SMTP. Works with Gmail (app password), Outlook,
 * Resend, SendGrid, Mailgun, Zoho… Required env:
 *   SMTP_HOST, SMTP_USER, SMTP_PASS     (SMTP_PORT defaults to 465)
 *   EMAIL_FROM        e.g. "Summarist <orders@yourdomain.com>" (defaults to SMTP_USER)
 *   BUSINESS_EMAILS   comma-separated addresses that get a copy of every order
 * If SMTP isn't configured, emails are skipped (and logged) — the purchase still succeeds.
 */

export type Address = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

let transport: Transporter | null = null;

function getTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transport;
}

export function businessEmails(): string[] {
  return (process.env.BUSINESS_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

function formatAddress(a: Address | null | undefined): string[] {
  if (!a) return [];
  const cityLine = [a.city, [a.state, a.postal_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [a.name, a.line1, a.line2, cityLine, a.country].filter(
    (l): l is string => Boolean(l && l.trim()),
  );
}

function itemsTable(order: Order) {
  const money = (cents: number) => formatPrice(cents, order.currency);
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e1e7ea">${esc(i.title)} × ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e1e7ea;text-align:right">${money(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join("");
  const total = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:700;font-size:16px" : ""}">${label}</td>
      <td style="padding:4px 0;text-align:right;${bold ? "font-weight:700;font-size:16px" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;color:#032b41">
    ${rows}
    ${total("Subtotal", money(order.subtotal))}
    ${total("Shipping", order.shipping ? money(order.shipping) : "Free")}
    ${total("Tax", money(order.tax))}
    ${total("Total paid", money(order.total), true)}
  </table>`;
}

function itemsText(order: Order) {
  const money = (cents: number) => formatPrice(cents, order.currency);
  return [
    ...order.items.map((i) => `- ${i.title} x ${i.quantity}: ${money(i.price * i.quantity)}`),
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${order.shipping ? money(order.shipping) : "Free"}`,
    `Tax: ${money(order.tax)}`,
    `Total paid: ${money(order.total)}`,
  ].join("\n");
}

/** Company name shown in the email banner, subjects and footer. */
const COMPANY = process.env.COMPANY_NAME || "Summarist";
/** Store link in the banner (Vercel provides the production domain at runtime). */
const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://summarist-app-purple-gold.vercel.app");

/** Table-based layout so the banner renders the same in Gmail, Outlook and Apple Mail. */
function layout(title: string, body: string) {
  const company = esc(COMPANY);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7faf9;font-family:Roboto,Arial,sans-serif;color:#032b41">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7faf9">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
        <tr><td style="background:#032b41;border-radius:8px 8px 0 0;padding:22px 24px;border-bottom:4px solid #2bd97c">
          <a href="${SITE_URL}" style="text-decoration:none">
            <span style="display:block;font-size:28px;line-height:32px;font-weight:700;color:#ffffff;letter-spacing:0.3px">${company}</span>
            <span style="display:block;font-size:13px;line-height:18px;color:#2bd97c;margin-top:4px">Book summaries &amp; bookstore</span>
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e1e7ea;border-top:none;border-radius:0 0 8px 8px;padding:24px">
          <h1 style="font-size:20px;margin:0 0 12px;color:#032b41">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 4px;font-size:12px;line-height:18px;color:#6b757b">
          This email was sent because a purchase was made at
          <a href="${SITE_URL}" style="color:#16a05d">${company}</a>.<br>
          &copy; ${new Date().getFullYear()} ${company}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const block = (heading: string, lines: string[]) =>
  lines.length
    ? `<h2 style="font-size:14px;margin:20px 0 6px">${heading}</h2>
       <p style="margin:0;font-size:14px;line-height:1.5">${lines.map(esc).join("<br>")}</p>`
    : "";

/** Sends the buyer's receipt and the business notification. Never throws. */
export async function sendOrderEmails(
  order: Order,
  details: { shipping?: Address | null; billing?: Address | null },
) {
  const mailer = getTransport();
  if (!mailer) {
    console.warn(`Purchase emails skipped for ${order.id}: SMTP is not configured.`);
    return;
  }
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  const ref = order.id.slice(-10).toUpperCase();
  const shipLines = formatAddress(details.shipping);
  const billLines = formatAddress(details.billing);
  const sends: Promise<unknown>[] = [];

  if (order.customerEmail) {
    const firstName = order.customerName.split(" ")[0] || "there";
    sends.push(
      mailer.sendMail({
        from,
        to: order.customerEmail,
        replyTo: businessEmails()[0],
        subject: `Your ${COMPANY} order is confirmed (#${ref})`,
        text: [
          `Hi ${firstName},`,
          "",
          "Thanks for your purchase! Here's your receipt.",
          "",
          itemsText(order),
          "",
          shipLines.length ? `Shipping to:\n${shipLines.join("\n")}` : "",
          "",
          `Order reference: ${order.id}`,
        ].join("\n"),
        html: layout(
          "Thanks for your order!",
          `<p style="font-size:14px;line-height:1.5;margin:0 0 16px">Hi ${esc(firstName)}, your payment was successful. Here's your receipt.</p>
           ${itemsTable(order)}
           ${block("Shipping to", shipLines)}
           ${block("Billing address", billLines)}
           <p style="font-size:12px;color:#6b757b;margin-top:20px">Order reference: ${esc(order.id)}</p>`,
        ),
      }),
    );
  }

  const business = businessEmails();
  if (business.length) {
    sends.push(
      mailer.sendMail({
        from,
        to: business,
        replyTo: order.customerEmail || undefined,
        subject: `${COMPANY} – new order: ${formatPrice(order.total, order.currency)} from ${order.customerName || order.customerEmail} (#${ref})`,
        text: [
          `A new purchase was made on ${COMPANY}.`,
          "",
          `Customer: ${order.customerName} <${order.customerEmail}>`,
          "",
          itemsText(order),
          "",
          shipLines.length ? `Ship to:\n${shipLines.join("\n")}` : "",
          billLines.length ? `\nBilling address:\n${billLines.join("\n")}` : "",
          "",
          `Stripe payment: https://dashboard.stripe.com/payments/${order.id}`,
        ].join("\n"),
        html: layout(
          "New order received",
          `<p style="font-size:14px;margin:0 0 16px"><strong>${esc(order.customerName)}</strong> &lt;${esc(order.customerEmail)}&gt;</p>
           ${itemsTable(order)}
           ${block("Ship to", shipLines)}
           ${block("Billing address", billLines)}
           <p style="font-size:14px;margin-top:20px"><a href="https://dashboard.stripe.com/payments/${esc(order.id)}" style="color:#16a05d">View payment in Stripe</a></p>`,
        ),
      }),
    );
  } else {
    console.warn(`Business notification skipped for ${order.id}: BUSINESS_EMAILS is empty.`);
  }

  const results = await Promise.allSettled(sends);
  for (const r of results) {
    if (r.status === "rejected") console.error(`Purchase email failed for ${order.id}`, r.reason);
  }
}

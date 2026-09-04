import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  address?: string;
  tenantName?: string;
  amountWithheld?: string;
  deadline?: string;
  letterBody?: string;
  reportNumber?: string;
  hash?: string;
  verifyLink?: string;
}

const Email = ({
  address,
  tenantName,
  amountWithheld,
  deadline,
  letterBody,
  reportNumber,
  hash,
  verifyLink,
}: Props) => {
  const place = address || "the rental";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Formal demand for return of the security deposit — ${place}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>deposit</Text>
          <Heading style={h1}>Demand for return of security deposit — {place}</Heading>
          <Text style={p}>
            {tenantName || "Your former tenant"} has sent you a formal demand under A.R.S. §
            33-1321{amountWithheld ? ` for ${amountWithheld} withheld` : ""}
            {deadline ? `. The 14 business-day deadline was ${deadline}` : ""}.
          </Text>

          {letterBody ? (
            <Section style={letterBox}>
              <Text style={letter}>{letterBody}</Text>
            </Section>
          ) : null}

          <Section style={sealBox}>
            <Text style={sealTitle}>Sealed evidence</Text>
            <Text style={sealLine}>Report: {reportNumber || "—"}</Text>
            <Text style={sealLine}>SHA-256 seal: {hash || "pending"}</Text>
            <Text style={sealLine}>
              Every photo is fingerprinted and stamped with GPS coordinates and capture time. Any
              edit breaks the fingerprint.
            </Text>
          </Section>

          {verifyLink ? (
            <Section style={{ margin: "24px 0 8px" }}>
              <Button href={verifyLink} style={button}>
                Verify the sealed report
              </Button>
            </Section>
          ) : null}

          <Text style={small}>
            This message is evidence documentation, not legal advice. Reply to this email to respond
            to the tenant directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Props) =>
    `Demand for return of security deposit — ${data.address || "your rental"}`,
  displayName: "Security deposit demand letter",
  previewData: {
    address: "1420 E Camelback Rd Unit 3",
    tenantName: "Jordan Reyes",
    amountWithheld: "$1,800.00",
    deadline: "9/22/2026",
    letterBody: "Dear Landlord,\n\nI vacated the above premises…",
    reportNumber: "DEP-00123",
    hash: "34ccf9949cb385cf96a7aae7cd756d33223de4d6f",
    verifyLink: "https://myazdepositportal.live/verify/example",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
  color: "#111111",
};
const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "32px 28px",
  border: "1px solid #EAE9E5",
  borderRadius: "16px",
  backgroundColor: "#ffffff",
};
const brand = { fontSize: "20px", letterSpacing: "-0.02em", margin: "0 0 20px", color: "#111111" };
const h1 = { fontSize: "20px", lineHeight: "1.35", margin: "0 0 16px", color: "#111111" };
const p = { fontSize: "14px", lineHeight: "1.65", margin: "0 0 14px", color: "#111111" };
const letterBox = {
  border: "1px solid #EAE9E5",
  borderRadius: "12px",
  padding: "18px 20px",
  margin: "18px 0",
  backgroundColor: "#FAFAF9",
};
const letter = {
  fontSize: "13px",
  lineHeight: "1.7",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
  color: "#111111",
};
const sealBox = {
  border: "1px solid #EAE9E5",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "18px 0",
};
const sealTitle = {
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
  color: "#6b675f",
};
const sealLine = {
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 6px",
  color: "#111111",
  wordBreak: "break-all" as const,
};
const small = { fontSize: "12px", lineHeight: "1.6", margin: "24px 0 0", color: "#6b675f" };
const button = {
  backgroundColor: "#111111",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "12px 22px",
  fontSize: "14px",
  textDecoration: "none",
};

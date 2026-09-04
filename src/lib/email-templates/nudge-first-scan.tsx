import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface NudgeProps {
  name?: string | null;
  appUrl?: string;
  /** "no_property" = signed up but nothing added, "unsealed" = scan started, not sealed */
  variant?: "no_property" | "unsealed";
  address?: string | null;
  reportId?: string | null;
}

const NudgeEmail = ({
  name,
  appUrl = "https://myazdepositportal.live",
  variant = "no_property",
  address,
  reportId,
}: NudgeProps) => {
  const unsealed = variant === "unsealed";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {unsealed
          ? "Your scan isn't sealed yet — finish it in a few minutes"
          : "Ten minutes now can protect your whole deposit"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>deposit</Text>
          <Heading style={h1}>
            {unsealed ? "Your scan is still open" : `Ready when you are${name ? `, ${name}` : ""}`}
          </Heading>
          {unsealed ? (
            <Text style={text}>
              You started documenting {address ? <b>{address}</b> : "your place"} but the report
              isn&apos;t sealed yet. Until it&apos;s sealed there&apos;s no hash and no verification
              link — so it can still be argued with. Sealing takes a minute.
            </Text>
          ) : (
            <Text style={text}>
              Most Arizona deposit fights come down to one thing: who can prove the condition on day
              one. Add your place and walk the eight room prompts — about ten minutes on your phone —
              and you&apos;ll have timestamped, hashed photos your landlord can verify but nobody can
              edit.
            </Text>
          )}
          <Section style={{ margin: "28px 0" }}>
            <Button
              style={button}
              href={
                unsealed && reportId ? `${appUrl}/scan/${reportId}` : `${appUrl}/properties/new`
              }
            >
              {unsealed ? "Finish and seal my report" : "Start my free scan"}
            </Button>
          </Section>
          <Text style={muted}>
            Scanning is free. You only pay $14.99 when you unlock and send the report to your
            landlord.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            deposit — Arizona security deposit documentation. General information, not legal advice.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system,Segoe UI,Roboto,sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  margin: "32px auto",
  padding: "36px",
  maxWidth: "560px",
};
const brand = {
  fontSize: "13px",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "#8a8a94",
  margin: "0 0 12px",
};
const h1 = { fontSize: "24px", color: "#16161a", margin: "0 0 16px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#3a3a42" };
const muted = { fontSize: "12px", lineHeight: "20px", color: "#8a8a94" };
const button = {
  backgroundColor: "#16161a",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "15px",
  padding: "13px 26px",
  textDecoration: "none",
};
const hr = { borderColor: "#ececf1", margin: "28px 0 16px" };

export const template: TemplateEntry = {
  component: NudgeEmail,
  subject: (data) =>
    data["variant"] === "unsealed"
      ? "Your move-in report isn't sealed yet"
      : "Seal your move-in condition before you unpack",
  displayName: "First scan nudge",
  previewData: { name: "Sam", variant: "no_property" },
};

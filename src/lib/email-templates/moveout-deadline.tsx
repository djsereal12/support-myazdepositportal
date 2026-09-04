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

interface MoveOutProps {
  name?: string | null;
  address?: string | null;
  leaseEnd?: string | null;
  propertyId?: string | null;
  appUrl?: string;
}

const MoveOutEmail = ({
  name,
  address,
  leaseEnd,
  propertyId,
  appUrl = "https://myazdepositportal.live",
}: MoveOutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your lease is ending — do the move-out scan before you hand back the keys</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>deposit</Text>
        <Heading style={h1}>Move-out scan time{name ? `, ${name}` : ""}</Heading>
        <Text style={text}>
          Your lease at {address ? <b>{address}</b> : "your rental"}
          {leaseEnd ? ` ends ${leaseEnd}` : " is ending soon"}. Do the move-out scan{" "}
          <b>after you clean and before you hand back the keys</b>. Side-by-side with your move-in
          report, it&apos;s the fastest way to end a deduction argument.
        </Text>
        <Text style={text}>
          Once you move out and give your landlord a forwarding address in writing, Arizona law gives
          them <b>14 business days</b> to return the deposit with an itemized list. Weekends and
          holidays don&apos;t count.
        </Text>
        <Section style={{ margin: "28px 0" }}>
          <Button
            style={button}
            href={propertyId ? `${appUrl}/properties/${propertyId}` : `${appUrl}/dashboard`}
          >
            Start my move-out scan
          </Button>
        </Section>
        <Text style={muted}>
          Deadline slipping? Use the calculator at {appUrl}/calculator, then generate an A.R.S.
          §33-1321 demand letter from your report.
        </Text>
        <Hr style={hr} />
        <Text style={muted}>General information, not legal advice.</Text>
      </Container>
    </Body>
  </Html>
);

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
  component: MoveOutEmail,
  subject: "Your lease is ending — seal the move-out condition",
  displayName: "Move-out deadline reminder",
  previewData: { name: "Sam", address: "1420 W Thomas Rd Unit 12", leaseEnd: "March 31" },
};

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

interface LandlordResponseEmailProps {
  /** 'accepted' | 'disputed' | 'replied' */
  event?: string;
  reportNumber?: string;
  address?: string;
  landlordName?: string;
  note?: string;
  appUrl?: string;
  reportId?: string;
}

const headline = (event?: string) => {
  if (event === "accepted") return "Your landlord accepted and e-signed the report";
  if (event === "disputed") return "Your landlord disputed the report";
  return "New reply from your landlord";
};

const LandlordResponseEmail = ({
  event,
  reportNumber,
  address,
  landlordName,
  note,
  reportId,
  appUrl = "https://myazdepositportal.live",
}: LandlordResponseEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{headline(event)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>deposit</Text>
        <Heading style={h1}>{headline(event)}</Heading>
        <Text style={text}>
          {landlordName ? `${landlordName} ` : "Your landlord "}responded to report{" "}
          <strong>{reportNumber ?? "your report"}</strong>
          {address ? ` for ${address}` : ""}.
        </Text>
        {note ? (
          <Section style={card}>
            <Text style={cardTitle}>Their message</Text>
            <Text style={cardText}>{note}</Text>
          </Section>
        ) : null}
        <Button
          style={button}
          href={reportId ? `${appUrl}/reports/${reportId}` : `${appUrl}/dashboard`}
        >
          View the report
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Keep this documentation — Arizona landlords generally must return a deposit or send an
          itemized statement within 14 business days (A.R.S. §33-1321).
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: LandlordResponseEmail,
  subject: (data: Record<string, any>) =>
    data["event"] === "accepted"
      ? `Report ${data["reportNumber"] ?? ""} accepted and e-signed`.trim()
      : data["event"] === "disputed"
        ? `Report ${data["reportNumber"] ?? ""} was disputed`.trim()
        : "New reply from your landlord",
  displayName: "Landlord response notification",
  previewData: {
    event: "disputed",
    reportNumber: "DEP-1042",
    address: "1200 E Camelback Rd, Unit 4",
    landlordName: "Sunrise Property Group",
    note: "Carpet damage in the living room is not reflected in the move-out photos.",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const brand = {
  fontSize: "13px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#8b857e",
  margin: "0 0 18px",
};
const h1 = { fontSize: "24px", color: "#111111", margin: "0 0 16px", letterSpacing: "-0.02em" };
const text = { fontSize: "15px", color: "#44413d", lineHeight: "1.6", margin: "0 0 22px" };
const card = {
  backgroundColor: "#F8F7F5",
  border: "1px solid #EAE9E5",
  borderRadius: "16px",
  padding: "18px 20px",
  margin: "0 0 24px",
};
const cardTitle = { fontSize: "13px", color: "#8b857e", margin: "0 0 8px" };
const cardText = {
  fontSize: "14px",
  color: "#111111",
  lineHeight: "1.7",
  margin: 0,
  whiteSpace: "pre-line" as const,
};
const button = {
  backgroundColor: "#111111",
  color: "#ffffff",
  borderRadius: "12px",
  padding: "12px 22px",
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#EAE9E5", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8b857e", lineHeight: "1.6", margin: 0 };

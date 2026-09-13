import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  fullName?: string;
  email?: string;
  phone?: string | null;
  rentalAddress?: string;
  unit?: string | null;
  city?: string | null;
  landlordName?: string | null;
  landlordEmail?: string | null;
  depositAmount?: string | null;
  amountWithheld?: string | null;
  moveOutDate?: string | null;
  disputeReason?: string;
  details?: string | null;
  source?: string;
  claimId?: string;
}

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <Text style={row}>
      <span style={labelStyle}>{label}: </span>
      {value}
    </Text>
  ) : null;

const Email = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New deposit claim from ${p.fullName ?? "a renter"}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New deposit claim intake</Heading>
        <Text style={sub}>Submitted from the {p.source ?? "site"} page.</Text>
        <Hr style={hr} />
        <Row label="Name" value={p.fullName ?? null} />
        <Row label="Email" value={p.email ?? null} />
        <Row label="Phone" value={p.phone ?? null} />
        <Hr style={hr} />
        <Row label="Rental address" value={p.rentalAddress ?? null} />
        <Row label="Unit" value={p.unit ?? null} />
        <Row label="City" value={p.city ?? null} />
        <Row label="Move-out date" value={p.moveOutDate ?? null} />
        <Hr style={hr} />
        <Row label="Landlord" value={p.landlordName ?? null} />
        <Row label="Landlord email" value={p.landlordEmail ?? null} />
        <Row label="Deposit amount" value={p.depositAmount ?? null} />
        <Row label="Amount withheld" value={p.amountWithheld ?? null} />
        <Hr style={hr} />
        <Row label="Reason" value={p.disputeReason ?? null} />
        <Row label="Details" value={p.details ?? null} />
        <Row label="Claim ID" value={p.claimId ?? null} />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New deposit claim — ${data["fullName"] ?? "renter"}`,
  displayName: "Deposit claim intake (internal)",
  to: "support@myazdepositportal.live",
  previewData: {
    fullName: "Jamie Rivera",
    email: "jamie@example.com",
    phone: "602-555-0134",
    rentalAddress: "7102 N 45th Ave",
    unit: "Apt 6",
    city: "Glendale",
    landlordName: "Sun Valley Rentals",
    landlordEmail: "manager@example.com",
    depositAmount: "$1,800.00",
    amountWithheld: "$1,200.00",
    moveOutDate: "2026-08-31",
    disputeReason: "Deposit withheld for pre-existing carpet wear",
    details: "Carpet was already stained at move-in; I have photos.",
    source: "pricing",
    claimId: "00000000-0000-0000-0000-000000000000",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };
const container = { padding: "24px 28px", maxWidth: "600px" };
const heading = { fontSize: "20px", color: "#171717", margin: "0 0 4px" };
const sub = { fontSize: "13px", color: "#727272", margin: "0" };
const hr = { borderColor: "#d9d9d9", margin: "16px 0" };
const row = { fontSize: "14px", color: "#202020", margin: "0 0 8px" };
const labelStyle = { color: "#727272" };

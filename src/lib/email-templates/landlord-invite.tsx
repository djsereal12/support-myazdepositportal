import React from 'react'
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
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  address?: string
  reportNumber?: string
  customMessage?: string
  link?: string
}

const Email = ({ address, reportNumber, customMessage, link }: Props) => {
  const place = address || 'the rental'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Review and e-sign the move-in inspection for ${place}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>deposit</Text>
          <Heading style={h1}>Review the move-in inspection for {place}</Heading>
          <Text style={p}>
            {customMessage ||
              'A tenant completed move-in documentation and asked you to review it. Please accept if accurate, or dispute with notes.'}
          </Text>
          <Text style={p}>
            {reportNumber ? `Report ${reportNumber}, ` : ''}created per A.R.S. § 33-1321(C). Photos
            include GPS coordinates, timestamps and SHA-256 hashes.
          </Text>
          {link ? (
            <Section style={{ margin: '28px 0 8px' }}>
              <Button href={link} style={button}>
                View &amp; e-sign the report
              </Button>
            </Section>
          ) : null}
          <Text style={small}>
            This link expires in 7 days. You can accept or dispute the report — no account required.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    `Action required: review the move-in report for ${data.address || 'your rental'}`,
  displayName: 'Landlord review request',
  previewData: {
    address: '1420 E Camelback Rd Unit 3',
    reportNumber: 'DEP-000123',
    customMessage: 'Please review the move-in condition report for the unit.',
    link: 'https://myazdepositportal.live/verify/example-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Helvetica, Arial, sans-serif', color: '#111111' }
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
  border: '1px solid #EAE9E5',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
}
const brand = { fontSize: '20px', letterSpacing: '-0.02em', margin: '0 0 20px', color: '#111111' }
const h1 = { fontSize: '20px', lineHeight: '1.35', margin: '0 0 16px', color: '#111111' }
const p = { fontSize: '14px', lineHeight: '1.65', margin: '0 0 14px', color: '#111111' }
const small = { fontSize: '12px', lineHeight: '1.6', margin: '24px 0 0', color: '#6b675f' }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  borderRadius: '999px',
  padding: '12px 22px',
  fontSize: '14px',
  textDecoration: 'none',
}

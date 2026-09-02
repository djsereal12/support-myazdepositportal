import * as React from 'react'
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
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface ReportReadyEmailProps {
  reportNumber?: string
  reportType?: string
  address?: string
  photoCount?: number
  hash?: string
  reportId?: string
  appUrl?: string
}

const ReportReadyEmail = ({
  reportNumber,
  reportType,
  address,
  photoCount,
  hash,
  reportId,
  appUrl = 'https://myazdepositportal.live',
}: ReportReadyEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {reportType ?? 'inspection'} report is sealed and ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>deposit</Text>
        <Heading style={h1}>Your report is sealed</Heading>
        <Text style={text}>
          Report <strong>{reportNumber ?? ''}</strong>
          {address ? ` for ${address}` : ''} is finalized. Every photo is timestamped and
          fingerprinted, so it can be verified later without altering the originals.
        </Text>
        <Section style={card}>
          <Text style={cardText}>
            {reportType ? `Type: ${reportType}\n` : ''}
            {typeof photoCount === 'number' ? `Evidence items: ${photoCount}\n` : ''}
            {hash ? `Verification hash: ${hash.slice(0, 24)}…` : ''}
          </Text>
        </Section>
        <Button style={button} href={reportId ? `${appUrl}/reports/${reportId}` : `${appUrl}/dashboard`}>
          View report
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Next step: send it to your landlord for e-signature so both sides agree on the
          condition of the unit.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReportReadyEmail,
  subject: (data: Record<string, any>) =>
    `Report ${data['reportNumber'] ?? ''} is sealed and ready`.replace('  ', ' ').trim(),
  displayName: 'Report ready',
  previewData: {
    reportNumber: 'DEP-1042',
    reportType: 'Move-in',
    address: '1200 E Camelback Rd, Unit 4',
    photoCount: 38,
    hash: 'a83c19f2b7d4e5a6c1908b7f2d3e4a5b',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = {
  fontSize: '13px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#8b857e',
  margin: '0 0 18px',
}
const h1 = { fontSize: '24px', color: '#111111', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#44413d', lineHeight: '1.6', margin: '0 0 22px' }
const card = {
  backgroundColor: '#F8F7F5',
  border: '1px solid #EAE9E5',
  borderRadius: '16px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
const cardText = { fontSize: '14px', color: '#55524d', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' as const }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '12px 22px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#EAE9E5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#8b857e', lineHeight: '1.6', margin: 0 }

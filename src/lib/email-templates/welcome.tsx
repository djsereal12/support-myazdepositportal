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

interface WelcomeEmailProps {
  name?: string
  role?: string
  appUrl?: string
}

const WelcomeEmail = ({ name, role, appUrl = 'https://myazdepositportal.live' }: WelcomeEmailProps) => {
  const isLandlord = role === 'landlord'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your deposit account is ready — start documenting in minutes</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>deposit</Text>
          <Heading style={h1}>Welcome{name ? `, ${name}` : ''}</Heading>
          <Text style={text}>
            Your account is ready. deposit helps Arizona renters and landlords keep
            tamper-evident move-in and move-out documentation — timestamped photos,
            GPS data, and a cryptographic hash for every report.
          </Text>
          <Section style={card}>
            <Text style={cardTitle}>{isLandlord ? 'Get started as a landlord' : 'Get started as a tenant'}</Text>
            <Text style={cardText}>
              {isLandlord
                ? '1. Review reports shared with you\n2. Accept and e-sign, or file a dispute note\n3. Reply to tenants directly from your portal'
                : '1. Add your rental property\n2. Capture a move-in report room by room\n3. Send it to your landlord for e-signature'}
            </Text>
          </Section>
          <Button style={button} href={isLandlord ? `${appUrl}/landlord-access` : `${appUrl}/dashboard`}>
            {isLandlord ? 'Open landlord portal' : 'Open your dashboard'}
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            deposit is documentation software, not legal advice. Arizona deposit rules
            are covered by A.R.S. §33-1321.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to deposit',
  displayName: 'Welcome email',
  previewData: { name: 'Jordan', role: 'tenant' },
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
const h1 = { fontSize: '26px', color: '#111111', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#44413d', lineHeight: '1.6', margin: '0 0 22px' }
const card = {
  backgroundColor: '#F8F7F5',
  border: '1px solid #EAE9E5',
  borderRadius: '16px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
const cardTitle = { fontSize: '14px', color: '#111111', fontWeight: 'bold' as const, margin: '0 0 8px' }
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

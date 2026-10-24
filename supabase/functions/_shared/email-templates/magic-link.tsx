/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Your sign-in link for The Tiny Japanese Toolkit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Tap the button below to sign in to The Tiny Japanese Toolkit by The
          Tiny Wisdom. Your practice progress and picture diary sync across all
          your devices. This link expires shortly and works only once.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Sign me in
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Helvetica, Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#ed612b',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #ed612b',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ed612b !important; color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ed612b !important; color: #ffffff !important; }
  [data-ogsb] .dm-btn { background-color: #ed612b !important; color: #ffffff !important; }
`

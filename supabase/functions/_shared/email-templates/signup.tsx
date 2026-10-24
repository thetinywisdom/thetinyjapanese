/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirm your email to start practising Japanese</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to The Tiny Japanese Toolkit</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>The Tiny Japanese Toolkit</strong>
          </Link>{' '}
          by The Tiny Wisdom. Confirm {recipient} and your kanji practice,
          conjugations and picture diary will follow you to every device.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirm my email
        </Button>
        <Text style={footer}>
          If you didn't sign up, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'inherit', textDecoration: 'underline' }
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

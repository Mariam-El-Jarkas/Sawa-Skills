import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const LAST_UPDATED = 'May 24, 2026';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
          <ArrowLeft size={22} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Introduction">
          <Body>
            Sawa Skills ("we", "us", or "our") is committed to protecting your personal
            information. This Privacy Policy explains what data we collect, how we use it, and your
            rights regarding that data.
          </Body>
          <Body>
            By using Sawa Skills, you agree to the collection and use of information as described
            in this policy.
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Body>We collect the following categories of personal information:</Body>
          <TableRow label="Full name" value="Required at registration" />
          <TableRow label="Email address" value="Required — used for authentication and transactional emails" />
          <TableRow label="Phone number" value="Required at registration (Lebanese format)" />
          <TableRow label="Date of birth" value="Required — used to determine eligibility and verification type" />
          <TableRow label="Gender" value="Required at registration" />
          <TableRow label="Profile photo" value="Optional — uploaded by the user" />
          <TableRow label="Location / city" value="Optional — used to personalise session listings" />
          <TableRow label="Skills & bio" value="Optional — shown on your public profile" />
          <TableRow label="Posts, comments, stories" value="Community content you choose to share" />
          <TableRow label="Verification documents" value="Government-issued ID or birth certificate, for badge verification only" />
          <TableRow label="OAuth identifiers" value="Google user ID or GitHub user ID (if you sign in via OAuth)" />
        </Section>

        <Section title="3. How We Use Your Information">
          <Body>We use your personal information to:</Body>
          <Bullet>Create and manage your account</Bullet>
          <Bullet>Facilitate skill swaps, volunteer sessions, and community features</Bullet>
          <Bullet>Send transactional emails (account confirmation, parental approval links, password resets)</Bullet>
          <Bullet>Process and decide on badge verification requests</Bullet>
          <Bullet>Display your public profile to other users</Bullet>
          <Bullet>Detect and prevent fraud, abuse, and policy violations</Bullet>
          <Bullet>Improve and maintain the platform</Bullet>
          <Body>We do not sell your personal information to third parties.</Body>
        </Section>

        <Section title="4. Service Providers">
          <Body>
            We share limited personal data with the following third-party services to operate
            the platform:
          </Body>
          <TableRow label="Resend" value="Transactional email delivery (name, email address)" />
          <TableRow label="Google OAuth" value="Sign-in only — we receive your email address and Google user ID. No passwords are stored." />
          <TableRow label="GitHub OAuth" value="Sign-in only — we receive your email address and GitHub user ID. No passwords are stored." />
          <TableRow label="Database infrastructure" value="Your data is stored on a secure, self-managed database server. We do not use a third-party cloud database provider." />
          <Body>
            We require all service providers to handle your data in accordance with applicable
            privacy laws and to use it only for the purposes of providing their service to us.
          </Body>
        </Section>

        <Section title="5. Verification Documents">
          <Body>
            Verification documents (e.g., government-issued ID, birth certificate) submitted for
            badge verification are handled with additional care:
          </Body>
          <Bullet>Documents are stored in a restricted server directory, inaccessible from the internet</Bullet>
          <Bullet>Access is limited to authorised administrators only</Bullet>
          <Bullet>Documents are permanently deleted within 90 days of a verification decision being made</Bullet>
          <Bullet>Documents are never shared with other users or third parties</Bullet>
        </Section>

        <Section title="6. Children and Minors (Under 16)">
          <Body>
            Users under 16 may register only with verified parental or guardian consent. Our Minor
            verification process sends an approval email to the parent or guardian you provide.
            Access to skill swaps, chat, and volunteer features is granted only after that consent
            is confirmed.
          </Body>
          <Body>
            Parents or guardians may contact us at{' '}
            <Highlight>privacy@sawaskills.com</Highlight> to request access to, correction of, or
            deletion of their child's personal data.
          </Body>
        </Section>

        <Section title="7. Data Retention">
          <Body>We retain your personal data for the following periods:</Body>
          <TableRow label="Account data" value="Until you delete your account" />
          <TableRow label="Posts, comments, stories" value="Until you delete them or your account is removed" />
          <TableRow label="Verification documents" value="Up to 90 days after the verification decision" />
          <TableRow label="Transactional email logs" value="Up to 30 days (held by Resend)" />
          <TableRow label="Inactive, unverified accounts" value="May be removed after a prolonged period of inactivity" />
        </Section>

        <Section title="8. Your Rights">
          <Body>
            Depending on your location, you may have the following rights regarding your personal
            data:
          </Body>
          <Bullet><Bold>Access</Bold> — request a copy of the data we hold about you</Bullet>
          <Bullet><Bold>Rectification</Bold> — request correction of inaccurate data</Bullet>
          <Bullet><Bold>Deletion</Bold> — request deletion of your account and associated data</Bullet>
          <Bullet><Bold>Portability</Bold> — request your data in a machine-readable format</Bullet>
          <Bullet><Bold>Restriction</Bold> — request that we limit processing in certain circumstances</Bullet>
          <Bullet><Bold>Objection</Bold> — object to processing based on legitimate interests</Bullet>
          <Bullet><Bold>Withdraw consent</Bold> — where processing is based on consent, withdraw it at any time</Bullet>
          <Body>
            To exercise any of these rights, email us at{' '}
            <Highlight>privacy@sawaskills.com</Highlight>. We will respond within 30 days.
          </Body>
        </Section>

        <Section title="9. Security">
          <Body>
            We take reasonable technical and organisational measures to protect your personal data,
            including:
          </Body>
          <Bullet>Passwords are stored using bcrypt hashing — we never store plaintext passwords</Bullet>
          <Bullet>Sessions are managed via short-lived JSON Web Tokens (JWT)</Bullet>
          <Bullet>API endpoints require authentication for all write and private read operations</Bullet>
          <Bullet>Rate limiting is applied to authentication and sensitive endpoints</Bullet>
          <Body>
            No method of transmission over the internet is 100% secure. If you discover a
            security vulnerability, please disclose it responsibly to{' '}
            <Highlight>security@sawaskills.com</Highlight>.
          </Body>
        </Section>

        <Section title="10. Cookies and Local Storage">
          <Body>
            The Sawa Skills mobile app does not use cookies. Your session token is stored securely
            on your device using Expo SecureStore (iOS Keychain / Android Keystore), and is cleared
            when you log out.
          </Body>
        </Section>

        <Section title="11. Third-Party Links">
          <Body>
            Our platform may contain links to external websites or resources. We are not
            responsible for the privacy practices of those third parties, and this Privacy Policy
            does not apply to them.
          </Body>
        </Section>

        <Section title="12. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. When we do, we will update the
            "Last updated" date at the top of this page and, for material changes, notify you via
            email or an in-app notice.
          </Body>
        </Section>

        <Section title="13. Contact Us">
          <Body>For general privacy enquiries:</Body>
          <Body><Highlight>privacy@sawaskills.com</Highlight></Body>
          <Body style={s.spacedBody}>For security disclosures:</Body>
          <Body><Highlight>security@sawaskills.com</Highlight></Body>
        </Section>

        <View style={s.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[s.body, style]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={s.bold}>{children}</Text>;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <Text style={s.highlight}>{children}</Text>;
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.tableRow}>
      <Text style={s.tableLabel}>{label}</Text>
      <Text style={s.tableValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#FFFFFF' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  backBtn:       { padding: 4 },
  headerTitle:   { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSpacer:  { width: 30 },
  scroll:        { flex: 1, backgroundColor: '#FFFFFF' },
  content:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  lastUpdated:   { fontSize: 12, color: '#9CA3AF', marginBottom: 24, textAlign: 'center' },
  section:       { marginBottom: 28 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#7C3AED', marginBottom: 10, letterSpacing: 0.1 },
  body:          { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 8 },
  spacedBody:    { marginTop: 8 },
  bulletRow:     { flexDirection: 'row', marginBottom: 6, paddingLeft: 4 },
  bulletDot:     { fontSize: 14, color: '#7C3AED', marginRight: 8, lineHeight: 22 },
  bulletText:    { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  bold:          { fontWeight: '700', color: '#111827' },
  highlight:     { color: '#7C3AED', fontWeight: '600' },
  tableRow:      { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 10, marginBottom: 6 },
  tableLabel:    { fontSize: 13, fontWeight: '700', color: '#5B21B6', marginBottom: 2 },
  tableValue:    { fontSize: 13, color: '#374151', lineHeight: 19 },
  footer:        { height: 40 },
});

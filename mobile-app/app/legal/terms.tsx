import React, { useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const LAST_UPDATED = 'May 24, 2026';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
          <ArrowLeft size={22} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms of Service</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Acceptance of Terms">
          <Body>
            Welcome to Sawa Skills. By creating an account or using our platform, you agree to be
            bound by these Terms of Service. If you do not agree, please do not use Sawa Skills.
          </Body>
        </Section>

        <Section title="2. Eligibility">
          <Body>
            You must be at least 13 years old to create an account. Users aged 13–15 must obtain
            verified parental or guardian consent through our Minor verification process before
            accessing skill swaps, chat, or volunteer features. Users aged 16 and over may apply
            for the Verified Adult (16+) badge.
          </Body>
          <Body>
            By registering, you confirm that all information you provide is accurate and that you
            meet the minimum age requirement.
          </Body>
        </Section>

        <Section title="3. Your Account">
          <Body>
            You are responsible for maintaining the confidentiality of your password and for all
            activity that occurs under your account. Notify us immediately at{' '}
            <Highlight>support@sawaskills.com</Highlight> if you suspect unauthorised access.
          </Body>
          <Body>
            We reserve the right to suspend or permanently remove accounts that violate these Terms,
            engage in fraud or abuse, or remain inactive and unverified for an extended period.
          </Body>
        </Section>

        <Section title="4. Skill Swaps">
          <Body>
            Sawa Skills connects users to exchange skills and services. Skill swaps are agreements
            between individual users — Sawa Skills is not a party to any swap arrangement and
            accepts no responsibility for the quality, safety, or completion of any exchanged skill
            or service.
          </Body>
          <Body>
            Creating swap listings and initiating swaps requires a Verified Adult (16+) or Verified
            Minor badge. This requirement exists to protect the safety of our community.
          </Body>
          <Body>
            <Bold>Safety reminder:</Bold> When meeting in person for a skill swap, always meet in
            a public place, avoid sharing sensitive personal information (such as your home address),
            and — if you are a minor — involve a trusted guardian. Sawa Skills is not liable for
            incidents arising from in-person meetings.
          </Body>
        </Section>

        <Section title="5. Volunteer Sessions">
          <Body>
            Volunteer sessions are community-service activities organised by Verified Volunteer
            users. Session organisers are solely responsible for the content and conduct of their
            sessions. Sawa Skills does not guarantee the quality, safety, or availability of any
            volunteer session listed on the platform.
          </Body>
          <Body>
            Applying to volunteer requires either a Verified Adult (16+) or Verified Minor badge.
            Creating a session additionally requires the Volunteer badge.
          </Body>
        </Section>

        <Section title="6. Community Content">
          <Body>
            By posting content (including posts, comments, stories, images, and documents), you
            grant Sawa Skills a non-exclusive, royalty-free, worldwide licence to display that
            content within the platform for the purpose of operating the service.
          </Body>
          <Body>You agree not to post content that:</Body>
          <Bullet>Is illegal, defamatory, harassing, or threatening</Bullet>
          <Bullet>Infringes any intellectual property right</Bullet>
          <Bullet>Contains malware, spam, or unsolicited commercial messages</Bullet>
          <Bullet>Impersonates any person or entity</Bullet>
          <Bullet>Exploits or harms minors in any way</Bullet>
          <Body>
            We reserve the right to remove any content that violates these guidelines without
            prior notice.
          </Body>
        </Section>

        <Section title="7. Verification Badges">
          <Body>
            Sawa Skills offers three optional verification badges:
          </Body>
          <Bullet><Bold>Verified Minor</Bold> — for users under 16 with parental consent</Bullet>
          <Bullet><Bold>Verified Adult (16+)</Bold> — for users aged 16 and over</Bullet>
          <Bullet><Bold>Volunteer</Bold> — for users who commit to community service</Bullet>
          <Body>
            Badges are granted at our sole discretion. We may revoke a badge if the information
            provided during verification is found to be false or outdated.
          </Body>
          <Body>
            Verification documents are stored securely and deleted within 90 days of a decision
            being made. See our Privacy Policy for details.
          </Body>
        </Section>

        <Section title="8. Prohibited Conduct">
          <Body>You agree not to:</Body>
          <Bullet>Use the platform for any unlawful purpose</Bullet>
          <Bullet>Attempt to gain unauthorised access to our systems or other users' accounts</Bullet>
          <Bullet>Scrape, mine, or harvest user data without permission</Bullet>
          <Bullet>Use bots or automated tools to interact with the platform</Bullet>
          <Bullet>Engage in any activity that disrupts or interferes with the service</Bullet>
        </Section>

        <Section title="9. Intellectual Property">
          <Body>
            The Sawa Skills name, logo, and all original platform content are the intellectual
            property of Sawa Skills and its creators. You may not copy, reproduce, or distribute
            any part of the platform without our express written permission.
          </Body>
        </Section>

        <Section title="10. Disclaimers">
          <Body>
            Sawa Skills is provided <Bold>"as is"</Bold> without warranties of any kind, express
            or implied. We do not warrant that the service will be uninterrupted, error-free, or
            free of viruses or other harmful components.
          </Body>
          <Body>
            We do not verify the skills, qualifications, or identities of users beyond the
            information collected during the badge verification process.
          </Body>
        </Section>

        <Section title="11. Limitation of Liability">
          <Body>
            To the maximum extent permitted by applicable law, Sawa Skills and its creators shall
            not be liable for any indirect, incidental, or consequential damages arising from your
            use of the platform. Our total liability to you for any claim shall not exceed the
            greater of USD 50 or the total amount you have paid us in the twelve months preceding
            the claim.
          </Body>
          <Body>
            As a community-focused platform in early operation, we strongly encourage all users to
            exercise caution, use good judgement, and report any concerns to us promptly.
          </Body>
        </Section>

        <Section title="12. Account Termination">
          <Body>
            You may delete your account at any time from your profile settings. We may suspend or
            terminate your account if you violate these Terms or if your account has been inactive
            and unverified for a prolonged period. Upon termination, your right to use the platform
            ceases immediately.
          </Body>
        </Section>

        <Section title="13. Changes to These Terms">
          <Body>
            We may update these Terms from time to time. When we do, we will update the "Last
            updated" date at the top of this page and, for material changes, notify you via email
            or an in-app notice. Continued use of the platform after changes take effect constitutes
            acceptance of the revised Terms.
          </Body>
        </Section>

        <Section title="14. Governing Law">
          <Body>
            These Terms are governed by and construed in accordance with applicable law. Any
            disputes shall be resolved in the competent courts of the jurisdiction in which Sawa
            Skills operates.
          </Body>
        </Section>

        <Section title="15. Contact Us">
          <Body>
            If you have questions about these Terms, please contact us at:
          </Body>
          <Body><Highlight>support@sawaskills.com</Highlight></Body>
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

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
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
  bulletRow:     { flexDirection: 'row', marginBottom: 6, paddingLeft: 4 },
  bulletDot:     { fontSize: 14, color: '#7C3AED', marginRight: 8, lineHeight: 22 },
  bulletText:    { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  bold:          { fontWeight: '700', color: '#111827' },
  highlight:     { color: '#7C3AED', fontWeight: '600' },
  footer:        { height: 40 },
});

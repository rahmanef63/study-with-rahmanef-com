// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
import { PublicProfileCard } from "../components/public-profile-card";
import { PublicProfileView } from "../components/public-profile-view";
import { CertificateCard } from "../components/certificate-card";
import { CertificateView } from "../components/certificate-view";
import type { Certificate, PublicProfile } from "../types";

const state = vi.hoisted(() => ({ loading: false, owner: true }));
const profile: PublicProfile = {
  username: "rahman", displayName: "Rahman Ef", bio: "Belajar AI bersama.",
  avatarUrl: "/profiles/avatar-pria-1.webp",
};
const certificate: Certificate = {
  displayName: profile.displayName, username: profile.username,
  courseTitle: "Belajar AI", tenantName: "Komunitas AI", earnedAt: Date.UTC(2026, 9, 2),
};
vi.mock("../hooks/use-public-profile", () => ({
  usePublicProfile: () => ({ profile, badges: [], isLoading: state.loading }),
}));
vi.mock("../hooks/use-current-profile", () => ({
  useCurrentProfile: () => ({ profile: state.owner ? { username: profile.username } : null }),
}));
vi.mock("../hooks/use-certificate", () => ({
  useCertificate: () => ({ certificate, isLoading: state.loading }),
}));

beforeEach(() => { state.loading = false; state.owner = true; });

test("standalone profile has one named heading, bio and copy action", () => {
  const html = renderToStaticMarkup(<PublicProfileCard profile={profile} badges={[]}
    shareValue="https://example.test/u/rahman" />);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toMatch(/<h1\b[^>]*>Rahman Ef<\/h1>/);
  expect(html).toContain("@rahman");
  expect(html.split(profile.bio!).length - 1).toBe(1);
  expect(html).toContain('aria-label="Salin tautan profil"');
});

test("empty standalone bio keeps its existing recovery copy", () => {
  for (const bio of [null, ""]) {
    const html = renderToStaticMarkup(<PublicProfileCard profile={{ ...profile, bio }} badges={[]} shareValue="@rahman" />);
    expect(html).toContain("Belum ada bio.");
  }
});

test("server heading remains the only heading/bio/share while avatar and edit stay available", () => {
  const html = renderToStaticMarkup(<>
    <header><h1>{profile.displayName}</h1><p>{profile.bio}</p><a href="#share">Bagikan profil</a></header>
    <PublicProfileCard profile={profile} badges={[]} shareValue="https://example.test/u/rahman"
      hasServerHeading editHref="/pengaturan" />
  </>);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html.split(profile.bio!).length - 1).toBe(1);
  expect(html).not.toContain('aria-label="Salin tautan profil"');
  expect(html).toContain('role="img" aria-label="Rahman Ef"');
  expect(html).toContain('href="/pengaturan"');
  expect(html).toContain("Lencana Kelas");
});

test("view forwards server presentation and keeps the edit action owner-only", () => {
  const render = () => renderToStaticMarkup(<PublicProfileView username="rahman" hasServerHeading />);
  const owner = render();
  expect(owner).not.toMatch(/<h1\b/);
  expect(owner).not.toContain(profile.bio);
  expect(owner).not.toContain('aria-label="Salin tautan profil"');
  expect(owner).toContain('href="/pengaturan"');
  state.owner = false;
  expect(render()).not.toContain('href="/pengaturan"');
});

test("loading profile retains busy state and does not duplicate server context", () => {
  state.loading = true;
  const html = renderToStaticMarkup(<PublicProfileView username="rahman" hasServerHeading />);
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toMatch(/<h1\b|bg-gradient/);
  expect(html).not.toContain('aria-label="Salin tautan profil"');
});

test("standalone certificate retains document heading and copy action", () => {
  const html = renderToStaticMarkup(<CertificateCard certificate={certificate} shareUrl="https://example.test/certificate" />);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toMatch(/<h1\b[^>]*>Sertifikat Penyelesaian<\/h1>/);
  expect(html).toContain('aria-label="Salin tautan sertifikat"');
});

test("certificate view keeps server heading/share primary and preserves document details", () => {
  const html = renderToStaticMarkup(<>
    <header><h1>{certificate.courseTitle}</h1><a href="#share">Bagikan sertifikat</a></header>
    <CertificateView completionId="completion" shareUrl="https://example.test/certificate" hasServerHeading />
  </>);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toMatch(/<h2\b[^>]*>Sertifikat Penyelesaian<\/h2>/);
  expect(html).not.toContain('aria-label="Salin tautan sertifikat"');
  expect(html).toContain(certificate.displayName);
  expect(html).toContain(certificate.tenantName);
  expect(html).toContain("2 Oktober 2026");
});

test("certificate loading state remains accessible without duplicating a share action", () => {
  state.loading = true;
  const html = renderToStaticMarkup(<CertificateView completionId="completion" hasServerHeading />);
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("Memuat sertifikat");
  expect(html).not.toMatch(/<h1\b/);
  expect(html).not.toContain('aria-label="Salin tautan sertifikat"');
});

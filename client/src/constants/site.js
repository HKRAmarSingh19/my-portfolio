/**
 * Single source of truth for the identity/profile links that recur across the
 * portfolio (Navbar, Footer, Contact, Resume, CommandPalette, etc). Keeping them
 * here means a change lands in one place instead of a dozen scattered strings.
 *
 * The Profile API only persists name/avatar/bio — email and the social URLs have
 * no public field yet, so they live here as constants rather than being fetched.
 */
export const SITE = {
  name: 'Hkr. Amar Singh',
  email: 'hkramarsingh@gmail.com',
  socials: {
    linkedin: 'https://www.linkedin.com/in/hkr-amar-singh-270246308/',
    github: 'https://github.com/HKRAmarSingh19',
    codolio: 'https://codolio.com/profile/hkramar73',
  },
};

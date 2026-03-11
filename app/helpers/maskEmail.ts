export function maskEmail(email: string): string {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email; // invalid email fallback

    // Mask user part
    const visibleUser = user.slice(0, 2); // keep first 2 chars
    const maskedUser = visibleUser + "*".repeat(Math.max(4, user.length - 2));

    // Mask domain except TLD
    const domainParts = domain.split(".");
    if (domainParts.length < 2) return maskedUser + "@" + "*".repeat(domain.length);

    const tld = domainParts.pop(); // last part (e.g., "com", "ph")
    const domainName = domainParts.join(".");

    const visibleDomain = domainName.slice(0, 1); // keep first character only
    const maskedDomain = visibleDomain + "*".repeat(Math.max(3, domainName.length - 1));

    return `${maskedUser}@${maskedDomain}.${tld}`;
}
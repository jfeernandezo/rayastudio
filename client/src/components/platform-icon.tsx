const PLATFORM_DOMAINS: Record<string, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  linkedin: "linkedin.com",
  twitter: "twitter.com",
  tiktok: "tiktok.com",
  youtube: "youtube.com",
  pinterest: "pinterest.com",
  clickup: "clickup.com",
  meta: "business.facebook.com",
  whatsapp: "whatsapp.com",
};

export function PlatformIcon({
  platform,
  domain,
  size = 16,
  className = "",
}: {
  platform?: string;
  domain?: string;
  size?: number;
  className?: string;
}) {
  const resolved = domain ?? (platform ? PLATFORM_DOMAINS[platform.toLowerCase()] : undefined);
  if (!resolved) return null;

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${resolved}&sz=${size * 2}`}
      width={size}
      height={size}
      alt={resolved}
      className={`rounded-sm object-contain ${className}`}
      style={{ imageRendering: "auto" }}
    />
  );
}

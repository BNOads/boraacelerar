/**
 * Extrai a thumbnail de uma URL de vídeo
 * Suporta YouTube, Vimeo e Loom
 */
export function getVideoThumbnail(url: string): string | null {
  if (!url) return null;

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    // Vimeo requires API call for thumbnails, return a placeholder approach
    return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w640`;
  }

  return null;
}

/**
 * Verifica se a URL é de um vídeo suportado
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  const patterns = [
    /youtube\.com/,
    /youtu\.be/,
    /vimeo\.com/,
    /loom\.com/,
    /drive\.google\.com/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}

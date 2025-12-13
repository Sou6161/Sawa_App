/**
 * Generate default avatar as base64 data URL
 * Creates a simple SVG avatar based on gender
 */

export function generateDefaultAvatar(gender?: string | null): string {
  // Determine avatar color and icon based on gender
  const isMale = gender?.toLowerCase() === "male";
  const isFemale = gender?.toLowerCase() === "female";
  
  // Colors from the app's color palette
  const backgroundColor = isMale 
    ? "#CFC4F9" // Light purple (Primary.50)
    : isFemale
    ? "#FFD6D4" // Light coral (Third.50)
    : "#F8F5FD"; // Light lavender (Neutral.50)
  
  const iconColor = "#522EE8"; // Primary purple
  
  // Create SVG avatar
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${backgroundColor}" rx="100"/>
      <circle cx="100" cy="80" r="35" fill="${iconColor}"/>
      <path d="M 50 140 Q 50 120 100 120 Q 150 120 150 140 L 150 200 L 50 200 Z" fill="${iconColor}"/>
    </svg>
  `.trim();
  
  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}


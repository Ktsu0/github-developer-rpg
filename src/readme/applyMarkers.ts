export function applyMarkers(readme: string, sections: Record<string, string>): string {
  let output = readme;
  for (const [key, content] of Object.entries(sections)) {
    const start = `<!-- RPG:START:${key} -->`;
    const end = `<!-- RPG:END:${key} -->`;
    const startIndex = output.indexOf(start);
    const endIndex = output.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error(`Marker pair not found for section "${key}"`);
    }
    const before = output.slice(0, startIndex + start.length);
    const after = output.slice(endIndex);
    output = `${before}\n${content}\n${after}`;
  }
  return output;
}

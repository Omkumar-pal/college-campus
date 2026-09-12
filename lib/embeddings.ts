// Local nomic-like deterministic pseudo-embedding (768 dim) — no external API, no heavy model download
// For true nomic, replace with @xenova/transformers or ollama. This stub gives deterministic vectors for demo.

export async function embed(text: string): Promise<number[]> {
  const normalized = text.trim().slice(0, 8000).toLowerCase();
  // Simple hash-based PRNG to 768 dims, normalized to unit vector for cosine
  const dims = 768;
  const vec = new Array(dims).fill(0).map((_, i) => {
    let h = 0;
    for (let j = 0; j < normalized.length; j++) {
      h = (h * 31 + normalized.charCodeAt(j) + i * 997) & 0xffffffff;
    }
    // xorshift
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return ((h & 0xffff) / 0xffff) * 2 - 1;
  });
  // Normalize to unit length for cosine
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already normalized
}

export function vectorToString(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

export function stringToVector(s: string): number[] {
  try {
    return JSON.parse(s) as number[];
  } catch {
    return [];
  }
}

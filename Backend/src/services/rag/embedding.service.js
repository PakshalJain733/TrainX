import crypto from 'crypto';

const NGRAM_SIZES = [3, 4];
const VECTOR_DIM = 384;
const MAX_TOKENS = 20000;
const BUCKET = 0xffffffff;

function hashInt(str) {
  const h = crypto.createHash('md5').update(str).digest();
  return h.readUInt32LE(0);
}

function hashSigned(hash) {
  const bucket = hash % (BUCKET + 1);
  return (bucket / (BUCKET / 2)) - 1;
}

function tokenize(text) {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return cleaned.split(/\s+/).filter(Boolean).slice(0, MAX_TOKENS);
}

function generateNGrams(tokens) {
  const grams = new Set();
  for (const size of NGRAM_SIZES) {
    for (let i = 0; i <= tokens.length - size; i++) {
      grams.add(tokens.slice(i, i + size).join(' '));
    }
  }
  return Array.from(grams);
}

export const embedText = (text) => {
  const tokens = tokenize(text || '');
  const grams = generateNGrams(tokens);
  const vector = new Float32Array(VECTOR_DIM);

  for (const gram of grams) {
    const idx = hashInt(gram) % VECTOR_DIM;
    vector[idx] += hashSigned(hashInt(`w:${gram}`));
  }

  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < VECTOR_DIM; i++) vector[i] /= norm;
  return Array.from(vector);
};

export const cosineSimilarity = (a, b) => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};
import { embedText, cosineSimilarity } from './embedding.service.js';

class InMemoryVectorStore {
  constructor() {
    this.documents = [];
    this.byOwner = new Map();
  }

  add({ id, text, metadata = {}, owner = 'global' }) {
    const vector = embedText(text);
    const doc = { id, text, metadata, owner, vector };

    this.documents.push(doc);

    if (!this.byOwner.has(owner)) this.byOwner.set(owner, []);
    this.byOwner.get(owner).push(doc);

    return doc;
  }

  search(query, { owner = 'global', topK = 5, minScore = 0.05 } = {}) {
    const queryVector = embedText(query);
    const corpus = owner ? (this.byOwner.get(owner) || []) : this.documents;

    const scored = corpus.map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored
      .filter((d) => d.score >= minScore)
      .slice(0, topK)
      .map(({ id, text, metadata, score }) => ({ id, text, metadata, score }));
  }

  deleteByOwner(owner) {
    const entries = this.byOwner.get(owner) || [];
    const ids = new Set(entries.map((d) => d.id));
    this.byOwner.delete(owner);
    this.documents = this.documents.filter((d) => !ids.has(d.id));
    return ids.size;
  }

  stats(owner = null) {
    const corpus = owner ? (this.byOwner.get(owner) || []) : this.documents;
    return { totalChunks: corpus.length, owners: this.byOwner.size };
  }
}

export const vectorStore = new InMemoryVectorStore();
import { vectorStore } from './vectorStore.service.js';
import crypto from 'crypto';

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 120;

function splitIntoChunks(text) {
  const clean = (text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}|\r{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];

  for (const para of paragraphs) {
    if (para.length <= CHUNK_SIZE) {
      chunks.push(para);
      continue;
    }

    let start = 0;
    while (start < para.length) {
      const end = Math.min(start + CHUNK_SIZE, para.length);
      chunks.push(para.slice(start, end));
      if (end >= para.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }

  return chunks.map((c) => c.trim()).filter(Boolean);
}

/**
 * Ingest a knowledge document into the in-memory vector store.
 * @param {string} text raw document text
 * @param {object} options { owner, title, source }
 */
export const ingestDocument = async ({ text, owner = 'global', title = 'Untitled', source = 'text' }) => {
  const chunks = splitIntoChunks(text);
  const inserted = [];

  for (const chunkText of chunks) {
    const id = crypto.randomUUID();
    vectorStore.add({
      id,
      text: chunkText,
      metadata: { title, source, owner },
      owner,
    });
    inserted.push({ id, text: chunkText });
  }

  return { ingested: inserted.length, chunks: inserted };
};

/**
 * Retrieve relevant knowledge context for grounding an AI interview.
 */
export const retrieveContext = async ({ query, owner = 'global', topK = 4 }) => {
  const results = vectorStore.search(query, { owner, topK });
  return results;
};

export const clearOwnerKnowledge = async (owner) => vectorStore.deleteByOwner(owner);

export const getKnowledgeStats = async (owner = null) => vectorStore.stats(owner);

export const chunkText = splitIntoChunks;
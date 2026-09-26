import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import {
  generateOpeningQuestion,
  generateFollowUpQuestion,
  evaluateAnswer,
  generateScorecard,
} from '../ai/interview.ai.js';
import { ingestDocument, clearOwnerKnowledge } from '../services/rag/rag.service.js';
import { createInterviewSessionModel } from '../models/interview.model.js';

const activeSessions = new Map();

function normalizeSessionId(id) {
  return String(id || '').trim();
}

function getOrCreateSession(sessionId, payload) {
  const key = normalizeSessionId(sessionId);
  const existing = activeSessions.get(key);
  // Never let a session created by one user be reused by another user.
  if (existing && payload?.userId && existing.userId && existing.userId !== payload.userId) {
    activeSessions.delete(key);
  }
  if (!activeSessions.has(key)) {
    activeSessions.set(key, {
      id: key,
      userId: null,
      role: null,
      topic: null,
      difficulty: 'Medium',
      totalQuestions: 12,
      askedTopics: [],
      priorQa: [],
      evaluationHistory: [],
      currentIndex: 0,
      status: 'in_progress',
      owner: null,
      startedAt: Date.now(),
      endedAt: null,
    });
  }
  const session = activeSessions.get(key);
  if (payload) {
    session.role = payload.role || session.role;
    session.topic = payload.topic || session.topic;
    session.difficulty = payload.difficulty || session.difficulty;
    session.userId = payload.userId || session.userId;
    session.totalQuestions = Number(payload.totalQuestions) || session.totalQuestions || 12;
    session.owner = payload.owner || session.owner;
  }
  return session;
}

async function finalizeSession(io, socket, session, reason = 'completed') {
  if (session.status === 'completed' || session.status === 'ended') {
    socket.emit('interview:error', { message: 'This interview has already ended.' });
    return null;
  }
  session.status = reason === 'ended' ? 'ended' : 'completed';
  session.endedAt = Date.now();

  const scorecard = await generateScorecard({
    role: session.role,
    topic: session.topic,
    evaluationHistory: session.evaluationHistory,
  });

  let finalReport;
  if (scorecard) {
    finalReport = scorecard;
  } else {
    const avg = session.evaluationHistory.length
      ? session.evaluationHistory.reduce((a, e) => a + (e.score || 0), 0) / session.evaluationHistory.length
      : 0;
    finalReport = {
      source: 'computed-fallback',
      overallScore: Math.round(avg * 10),
      technical: Math.round(avg * 10),
      communication: Math.round(avg * 10),
      problemSolving: 0,
      grade: avg >= 8 ? 'Excellent' : avg >= 6 ? 'Good' : avg >= 4 ? 'Average' : 'Needs Improvement',
      feedback: 'Interview completed.',
      strengths: [],
      improvementAreas: [],
      recommendedTopics: [],
      readiness: '',
    };
  }

  const durationSeconds = Math.max(0, Math.round((session.endedAt - session.startedAt) / 1000));
  const summary = {
    sessionId: session.id,
    durationSeconds,
    questionsAnswered: session.evaluationHistory.length,
    scorecard: finalReport,
    evaluationHistory: session.evaluationHistory,
  };

  socket.emit('interview:complete', summary);

  try {
    await createInterviewSessionModel({
      user_id: session.userId,
      interview_type: session.topic || 'Technical Mock',
      overall_score: finalReport.overallScore,
      grade: finalReport.grade || 'Average',
      feedback: finalReport.feedback || '',
      status: 'Completed',
      details: {
        role: session.role,
        topic: session.topic,
        difficulty: session.difficulty,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationSeconds,
        questionsAnswered: session.evaluationHistory.length,
        questions: session.evaluationHistory.map((e) => e.question),
        answers: session.evaluationHistory.map((e) => e.answer),
        questionScores: session.evaluationHistory.map((e) => e.score),
        overallScore: finalReport.overallScore,
        technical: finalReport.technical,
        communication: finalReport.communication,
        problemSolving: finalReport.problemSolving,
        strengths: finalReport.strengths,
        weaknesses: finalReport.improvementAreas,
        skillGaps: finalReport.recommendedTopics,
        recommendations: finalReport.improvementAreas,
        feedback: finalReport.feedback,
        evaluationHistory: session.evaluationHistory,
      },
    });
  } catch (err) {
    console.warn(`[Interview Socket] Could not persist session ${session.id}: ${err.message}`);
  }

  return summary;
}

export function initInterviewSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        const allowed = new Set([
          (config.frontendUrl || '').replace(/\/$/, ''),
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
          'http://localhost:3000',
        ]);
        if (allowed.has(cleanOrigin)) return cb(null, true);
        if (config.nodeEnv !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/.test(cleanOrigin)) {
          return cb(null, true);
        }
        return cb(new Error('Origin not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  const interviews = io.of('/interviews');

  interviews.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        '';
      if (!token) return next(new Error('Authentication token required'));

      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.secret);
      } catch (err) {
        return next(new Error(err?.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid or expired token'));
      }
      const userId = decoded.userId || decoded.id;
      const role = decoded.role;
      if (!userId) return next(new Error('Malformed token'));

      socket.data.user = {
        userId,
        role,
        name: decoded.name || 'Candidate',
        email: decoded.email || '',
      };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  interviews.on('connection', (socket) => {
    const { userId } = socket.data.user;

    socket.emit('interview:connected', {
      userId,
      activeSessions: countActiveForUser(userId),
    });

    socket.on('interview:start', async (payload = {}) => {
      try {
        const sessionId = normalizeSessionId(payload.sessionId || `${userId}-${Date.now()}`);
        const owner = String(`${userId}-${sessionId}`);
        const session = getOrCreateSession(sessionId, {
          userId,
          role: payload.role,
          topic: payload.topic,
          difficulty: payload.difficulty,
          totalQuestions: payload.totalQuestions,
          owner,
        });

        // Fresh interview — reset runtime state
        session.askedTopics = [];
        session.priorQa = [];
        session.evaluationHistory = [];
        session.currentIndex = 0;
        session.status = 'in_progress';
        session.startedAt = Date.now();
        session.endedAt = null;

        socket.join(sessionId);

        if (payload.knowledge && String(payload.knowledge).trim()) {
          await clearOwnerKnowledge(session.owner);
          await ingestDocument({
            text: String(payload.knowledge).trim(),
            owner: session.owner,
            title: payload.topic || 'Interview Knowledge',
            source: 'student-upload',
          });
        }

        const opening = await generateOpeningQuestion({
          role: session.role,
          topic: session.topic,
          difficulty: session.difficulty,
          owner: session.owner,
          sessionId: session.id,
        });

        if (!opening) {
          socket.emit('interview:error', {
            message: 'Could not generate an interview question. Please try again.',
          });
          return;
        }

        session.priorQa.push({ question: opening.question, answer: null, score: null });
        session.askedTopics.push(opening.topic);

        socket.emit('interview:question', {
          sessionId: session.id,
          index: 1,
          total: session.totalQuestions,
          question: opening.question,
          topic: opening.topic,
          hint: opening.hint,
        });
      } catch (err) {
        socket.emit('interview:error', { message: `Interview start failed: ${err.message}` });
      }
    });

    socket.on('interview:answer', async ({ sessionId, answer = '' } = {}) => {
      try {
        const key = normalizeSessionId(sessionId);
        const session = activeSessions.get(key);
        if (!session) {
          socket.emit('interview:error', { message: 'Session not found. Please restart.' });
          return;
        }
        if (session.status !== 'in_progress') {
          socket.emit('interview:error', { message: 'This interview has already ended.' });
          return;
        }

        const qa = session.priorQa[session.priorQa.length - 1];

        const evaluation = await evaluateAnswer({
          role: session.role,
          topic: session.topic,
          question: qa.question,
          answer,
          difficulty: session.difficulty,
          owner: session.owner,
        });

        const score = evaluation?.score ?? 0;
        qa.answer = answer;
        qa.score = score;
        qa.topic = session.askedTopics[session.askedTopics.length - 1] || session.topic;

        session.evaluationHistory.push({
          question: qa.question,
          answer,
          topic: qa.topic,
          score,
          feedback: evaluation?.feedback || 'No feedback generated.',
          modelAnswer: evaluation?.modelAnswer || '',
        });

        socket.emit('interview:feedback', {
          sessionId: session.id,
          index: session.evaluationHistory.length,
          score,
          feedback: evaluation?.feedback || 'Answer recorded.',
          evaluation: evaluation || null,
        });

        session.currentIndex += 1;

        if (session.currentIndex >= session.totalQuestions) {
          await finalizeSession(io, socket, session, 'completed');
          return;
        }

        const followUp = await generateFollowUpQuestion({
          role: session.role,
          topic: session.topic,
          difficulty: session.difficulty,
          owner: session.owner,
          priorQa: session.priorQa,
          askedTopics: session.askedTopics,
          sessionId: session.id,
        });

        if (!followUp) {
          socket.emit('interview:error', {
            message: 'Could not generate the next question. Ending the interview with your results so far.',
          });
          await finalizeSession(io, socket, session, 'completed');
          return;
        }

        session.priorQa.push({ question: followUp.question, answer: null, score: null });
        session.askedTopics.push(followUp.topic);

        socket.emit('interview:question', {
          sessionId: session.id,
          index: session.evaluationHistory.length + 1,
          total: session.totalQuestions,
          question: followUp.question,
          topic: followUp.topic,
          hint: followUp.hint,
        });
      } catch (err) {
        socket.emit('interview:error', { message: `Answer processing failed: ${err.message}` });
      }
    });

    socket.on('interview:end', async ({ sessionId } = {}) => {
      try {
        const key = normalizeSessionId(sessionId);
        const session = activeSessions.get(key);
        if (!session) {
          socket.emit('interview:error', { message: 'Session not found. Please restart.' });
          return;
        }
        await finalizeSession(io, socket, session, 'ended');
      } catch (err) {
        socket.emit('interview:error', { message: `Failed to end interview: ${err.message}` });
      }
    });

    socket.on('interview:restart', ({ sessionId } = {}) => {
      const key = normalizeSessionId(sessionId);
      const session = activeSessions.get(key);
      if (session) {
        session.askedTopics = [];
        session.priorQa = [];
        session.evaluationHistory = [];
        session.currentIndex = 0;
        session.status = 'in_progress';
        session.startedAt = Date.now();
        session.endedAt = null;
      }
      socket.emit('interview:restarted', { sessionId: key });
    });

    socket.on('disconnect', () => {
      // Room state is cleaned when the socket leaves; completed sessions stay
      // in memory for result retrieval until process restart.
    });
  });

  return interviews;
}

function countActiveForUser(userId) {
  let count = 0;
  for (const session of activeSessions.values()) {
    if (session.userId === userId && session.status === 'in_progress') count++;
  }
  return count;
}

export { activeSessions };
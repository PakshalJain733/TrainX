import React from 'react';
import { mentorLeaderboard } from '../../../data/mentorMockData';
import { Trophy, Award, Flame, Star } from 'lucide-react';

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-600" />
            <span>Batch Leaderboard & Rankings</span>
          </h2>
          <p className="text-xs text-slate-500">Student coding points, solved problem counts, and active streaks</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Cohort</th>
                <th className="px-5 py-3">Coding Points</th>
                <th className="px-5 py-3">Solved Problems</th>
                <th className="px-5 py-3">Active Streak</th>
                <th className="px-5 py-3">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mentorLeaderboard.map((lb) => (
                <tr key={lb.rank} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">#{lb.rank}</td>
                  <td className="px-5 py-3.5 font-bold text-indigo-600">{lb.name}</td>
                  <td className="px-5 py-3.5 text-slate-700">{lb.batch}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{lb.points} pts</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{lb.solved}</td>
                  <td className="px-5 py-3.5 text-amber-600 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" /> {lb.streak}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {lb.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

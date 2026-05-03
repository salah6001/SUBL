import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAppState } from '@/hooks/useAppState';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardStats } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const GAUGE_COLORS = ['#e76f51', '#f4a261', '#74c69d'];
const DEFAULT_STRESS_SCORE = 50; // neutral midpoint shown before real data loads

/** Derive gauge segments from a 0-100 stress score: high/medium/low proportions */
function deriveGaugeData(score: number) {
  const high = Math.round(score * 0.4);
  const medium = Math.round(score * 0.35);
  const low = 100 - high - medium;
  return [
    { name: 'High', value: high },
    { name: 'Medium', value: medium },
    { name: 'Low', value: low },
  ];
}

type Range = 'today' | 'week' | 'month';

export default function Dashboard() {
  const { currentUser, assessmentScore, emotionalState, setEmotionalState } = useAppState();
  const [timeRange, setTimeRange] = useState<Range>('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setFetchError(false);
    dashboardApi.getStats(timeRange)
      .then((data) => {
        setStats(data);
        setEmotionalState(data.emotional_state);
      })
      .catch(() => setFetchError(true));
  }, [timeRange, setEmotionalState]);

  const sessionData = stats?.session_data ?? [];
  const typingData = stats?.typing_data ?? [];
  const score = stats?.stress_score ?? assessmentScore ?? DEFAULT_STRESS_SCORE;
  const gaugeData = deriveGaugeData(score);
  const displayEmotionalState = stats?.emotional_state ?? emotionalState;

  return (
    <AppLayout>
      {fetchError && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          Could not refresh data. Showing cached results.
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-subl-grey-900">
          Good morning, {currentUser?.name?.split(' ')[0] || 'User'} 👋
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-lg font-semibold text-subl-green-500">{displayEmotionalState}</span>
          <span className="text-sm text-subl-grey-500">Your Overview Emotional Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Session Duration */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-subl-grey-800">Session Duration</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as Range)}
              className="appearance-none bg-subl-grey-50 border border-subl-grey-100 rounded-lg px-3 py-1.5 text-xs text-subl-grey-600 pr-8 focus:outline-none focus:ring-2 focus:ring-subl-blue-200"
            >
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {sessionData.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Real Time Statistics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-subl-grey-800">Real Time Statistics</h3>
            <span className="text-xs text-subl-grey-500 capitalize">{timeRange}</span>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-10">
              <p className="text-sm font-medium text-subl-grey-800">{stats?.stress_label ?? (score > 50 ? 'Medium' : 'Normal')}</p>
              <p className="text-2xl font-bold text-subl-grey-900">{score}%</p>
            </div>
            <div className="flex gap-4 mt-4">
              {gaugeData.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GAUGE_COLORS[i] }} />
                  <span className="text-xs text-subl-grey-500">{g.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Typing Speed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-subl-grey-800">Typing Speed</h3>
          <span className="text-xs text-subl-grey-500 capitalize">{timeRange}</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={typingData}>
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3578FF" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3578FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="speed" stroke="#3578FF" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}

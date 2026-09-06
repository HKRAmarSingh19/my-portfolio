import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  Eye, Users, Activity, MousePointerClick, RefreshCw,
} from 'lucide-react';
import { analyticsApi } from '../../api/client';
import SEO from '../../components/common/SEO';

const RANGES = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

// Recharts palette matching the indigo admin theme.
const PALETTE = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#4f46e5', '#4338ca', '#3730a3'];

const tooltipStyle = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #262626',
  borderRadius: '12px',
  color: '#e5e5e5',
  fontSize: '12px',
};

const Panel = ({ title, children, className = '' }) => (
  <div className={`bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4 ${className}`}>
    <h3 className="font-sans font-bold text-base text-white">{title}</h3>
    {children}
  </div>
);

const StatCard = ({ label, value, subtext, icon: Icon, color }) => (
  <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">{label}</span>
      <div className={`p-2 rounded-xl bg-neutral-950 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <div className="text-3xl font-sans font-bold text-white">{value}</div>
      <div className="text-xs font-mono text-neutral-500 mt-1">{subtext}</div>
    </div>
  </div>
);

const ListBar = ({ rows }) => {
  if (!rows?.length) return <p className="text-xs text-neutral-500 py-6 text-center">No data yet.</p>;
  const max = rows[0].count || 1;
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-neutral-300 truncate pr-2">{row.label}</span>
            <span className="font-mono text-neutral-500">{row.count}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500/80"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyChart = ({ name }) => (
  <div className="h-64 flex items-center justify-center text-xs font-mono text-neutral-500">
    {name} chart needs data — visit the site to start tracking.
  </div>
);

export const Analytics = () => {
  const [range, setRange] = useState('7d');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['analytics', range],
    queryFn: () => analyticsApi.getOverview(range),
  });

  const a = data?.data?.data || {};

  const mostVisited = a.topPages?.[0];
  const deviceRows = a.devices || [];

  return (
    <div className="space-y-8">
      <SEO title="Analytics" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Visitor Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Sites Visited
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1 gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  range === r.key
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-300">
          Failed to load analytics. Make sure you're signed in as admin.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={isLoading ? '…' : a.totalViews ?? 0}
          subtext="Pageviews in range"
          icon={Eye}
          color="text-indigo-400"
        />
        <StatCard
          label="Unique Visitors"
          value={isLoading ? '…' : a.uniqueVisitors ?? 0}
          subtext="Distinct devices"
          icon={Users}
          color="text-blue-400"
        />
        <StatCard
          label="Most Visited Page"
          value={mostVisited?.label ?? '—'}
          subtext={mostVisited ? `${mostVisited.count} views` : 'No views yet'}
          icon={MousePointerClick}
          color="text-purple-400"
        />
        <StatCard
          label="Views Today"
          value={isLoading ? '…' : a.viewsToday ?? 0}
          subtext="Since midnight local"
          icon={Activity}
          color="text-amber-400"
        />
      </div>

      {/* Views over time */}
      <Panel title="Views Over Time">
        {isLoading ? (
          <EmptyChart name="Loading" />
        ) : a.viewsByDay?.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={a.viewsByDay} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#a1a1aa' }} />
              <Area type="monotone" dataKey="count" name="Views" stroke="#818cf8" strokeWidth={2} fill="url(#viewsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart name="Views" />
        )}
      </Panel>

      {/* Top pages + referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Top Pages">
          <ListBar rows={a.topPages} />
        </Panel>
        <Panel title="Top Referrers">
          <ListBar rows={a.topReferrers} />
        </Panel>
      </div>

      {/* Devices + browsers/OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Devices">
          {isLoading ? (
            <EmptyChart name="Devices" />
          ) : deviceRows.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={deviceRows}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {deviceRows.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(value) => <span style={{ color: '#a1a1aa', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart name="Devices" />
          )}
        </Panel>
        <Panel title="Browsers & OS">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">Browser</h4>
              <ListBar rows={a.browsers} />
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">Operating System</h4>
              <ListBar rows={a.osBreakdown} />
            </div>
          </div>
        </Panel>
      </div>

      {/* Region + time-of-day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Views by Hour of Day">
          {isLoading || !a.viewsByHour?.length ? (
            <EmptyChart name="Hour" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={a.viewsByHour} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: '#737373', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(h) => `${h}h`}
                />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#262626' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title="Top Regions">
          <ListBar rows={(a.regions || []).slice(0, 8)} />
          {!a.regions?.length && (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Region is derived from the visitor's browser timezone — no IP geolocation.
            </p>
          )}
        </Panel>
      </div>

      <p className="text-[11px] font-mono text-neutral-600 leading-relaxed">
        Data is self-hosted in your MongoDB. No cookies, no IPs, no third-party trackers. Regions
        come from the visitor's browser timezone as a privacy-safe stand-in.
      </p>
    </div>
  );
};

export default Analytics;
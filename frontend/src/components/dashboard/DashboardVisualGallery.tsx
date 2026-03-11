import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { KPI, DashboardSummary as DashboardSummaryType } from '../../types';
import { formatValue } from '../../utils/formatters';

interface DashboardVisualGalleryProps {
  kpis: KPI[];
  summary: DashboardSummaryType;
}

const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

export const DashboardVisualGallery: React.FC<DashboardVisualGalleryProps> = ({ kpis, summary }) => {
  const topKpis = kpis.slice(0, 12);

  const numericValues = topKpis.map((k) => k.currentValue);
  const minVal = Math.min(...numericValues, 0);
  const maxVal = Math.max(...numericValues, 1);

  const enrollment = topKpis.filter((k) => k.category === 'enrollment');
  const financial = topKpis.filter((k) => k.category === 'financial');
  const academic = topKpis.filter((k) => k.category === 'academic');

  const firstWithHistory = topKpis.find((k) => (k.history || []).length >= 4);
  const historyValues = firstWithHistory?.history?.map((h) => h.value) ?? [];

  const radarKpis = topKpis.slice(0, 6);
  const navigate = useNavigate();

  return (
    <section className="space-y-4 relative overflow-hidden rounded-2xl border border-sky-900/10 bg-slate-950/90 bg-[radial-gradient(circle_at_top,_#0ea5e95c,_transparent_55%),radial-gradient(circle_at_bottom,_#3b82f67a,_transparent_55%)] dark:bg-slate-950/95 p-5">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:80px_80px] opacity-70" />

      <div className="relative grid gap-4 xl:grid-cols-3 lg:grid-cols-2 grid-cols-1">
        {/* 1. Dial / Gauge for overall health */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Overall KPI Health (Gauge)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Proportion of KPIs that are currently on target.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <svg viewBox="0 0 120 70" className="w-full max-w-xs">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97373" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={12}
                strokeLinecap="round"
              />
              {(() => {
                const pct =
                  summary.totalKPIs > 0
                    ? summary.kpisOnTarget / summary.totalKPIs
                    : 0;
                const angle = -180 + pct * 180;
                const rad = (angle * Math.PI) / 180;
                const cx = 60 + Math.cos(rad) * 40;
                const cy = 60 + Math.sin(rad) * 40;
                return (
                  <>
                    <line
                      x1={60}
                      y1={60}
                      x2={cx}
                      y2={cy}
                      stroke="#0f172a"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <circle cx={60} cy={60} r={3.5} fill="#0f172a" />
                    <circle cx={cx} cy={cy} r={4} fill="#0f172a" />
                    <text
                      x={60}
                      y={58}
                      textAnchor="middle"
                      className="fill-gray-900 dark:fill-gray-100 text-sm font-semibold"
                    >
                      {Math.round(pct * 100)}%
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* 2. Combo chart: Enrollment vs Financial over last history points */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Combo: Enrollment vs Financial Trend
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Enrollment KPIs (line) compared to financial KPIs (bars), normalized.
          </p>
          <div className="h-48">
            <svg viewBox="0 0 200 140" className="w-full h-full">
              <rect x={0} y={0} width={200} height={140} fill="transparent" />
              {[1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1={20}
                  x2={190}
                  y1={20 + i * 22}
                  y2={20 + i * 22}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                />
              ))}
              {(() => {
                const points = 8;
                const enrollSeries = Array.from({ length: points }).map((_, i) => {
                  const k = enrollment[i % Math.max(enrollment.length || 1, 1)];
                  return k ? k.currentValue : 0;
                });
                const finSeries = Array.from({ length: points }).map((_, i) => {
                  const k = financial[i % Math.max(financial.length || 1, 1)];
                  return k ? k.currentValue : 0;
                });
                const localMin = Math.min(...enrollSeries, ...finSeries, 0);
                const localMax = Math.max(...enrollSeries, ...finSeries, 1);
                const w = 170;
                const h = 110;
                const x0 = 20;
                const y0 = 120;

                const enrollPoints = enrollSeries.map((v, i) => {
                  const x = x0 + (i / (points - 1)) * w;
                  const y = y0 - normalize(v, localMin, localMax) * h;
                  return [x, y] as const;
                });
                const path =
                  enrollPoints.length > 1
                    ? enrollPoints
                        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
                        .join(' ')
                    : '';

                return (
                  <>
                    {finSeries.map((v, i) => {
                      const norm = normalize(v, localMin, localMax);
                      const x = x0 + (i / points) * w + 4;
                      const barH = norm * h;
                      return (
                        <rect
                          key={`b-${i}`}
                          x={x}
                          y={y0 - barH}
                          width={w / points - 8}
                          height={barH}
                          fill="#0ea5e9"
                          fillOpacity={0.4}
                        />
                      );
                    })}
                    {path && (
                      <path
                        d={path}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* 3. Donut chart: KPI status composition */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            KPI Status Composition (Donut)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            On target vs at risk vs below target.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-40 h-40">
              {(() => {
                // Derive counts directly from KPI data to avoid any summary mismatch
                const statusCounts = kpis.reduce(
                  (acc, k) => {
                    if (k.status === 'on_target') acc.on += 1;
                    else if (k.status === 'at_risk') acc.risk += 1;
                    else if (k.status === 'below_target') acc.below += 1;
                    return acc;
                  },
                  { on: 0, risk: 0, below: 0 }
                );

                const segments = [
                  { value: statusCounts.on, color: '#22c55e' },
                  { value: statusCounts.risk, color: '#facc15' },
                  { value: statusCounts.below, color: '#f97373' },
                ];
                const rawTotal = segments.reduce((sum, seg) => sum + seg.value, 0);
                const total = rawTotal > 0 ? rawTotal : 1;
                let startAngle = -90;
                const radius = 40;
                const cx = 60;
                const cy = 60;

                if (rawTotal <= 0) {
                  // No status data: render a subtle neutral ring
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth={10}
                      strokeDasharray="4 6"
                    />
                  );
                }

                return segments
                  .filter((seg) => seg.value > 0)
                  .map((seg, idx) => {
                  const angle = (seg.value / total) * 360;
                  if (!Number.isFinite(angle) || angle <= 0) {
                    return null;
                  }
                  const endAngle = startAngle + angle;
                  const largeArc = angle > 180 ? 1 : 0;
                  const rad1 = (Math.PI * startAngle) / 180;
                  const rad2 = (Math.PI * endAngle) / 180;
                  const x1 = cx + radius * Math.cos(rad1);
                  const y1 = cy + radius * Math.sin(rad1);
                  const x2 = cx + radius * Math.cos(rad2);
                  const y2 = cy + radius * Math.sin(rad2);
                  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  startAngle = endAngle;
                  return <path key={idx} d={d} fill={seg.color} fillOpacity={0.9} />;
                });
              })()}
              <circle cx={60} cy={60} r={24} fill="white" className="dark:fill-gray-900" />
              <text
                x={60}
                y={58}
                textAnchor="middle"
                className="fill-gray-900 dark:fill-gray-100 text-sm font-semibold"
              >
                {summary.totalKPIs}
              </text>
              <text
                x={60}
                y={72}
                textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-400 text-[10px]"
              >
                KPIs
              </text>
            </svg>
          </div>
        </div>

        {/* 4. Area chart for a single KPI's history */}
        <div
          className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            if (firstWithHistory) {
              navigate(`/kpis/${firstWithHistory.kpiId}`);
            }
          }}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            KPI History (Area)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Smoothed performance over time for a representative KPI.
          </p>
          <div className="h-48">
            <svg viewBox="0 0 200 140" className="w-full h-full">
              {historyValues.length >= 2 && (() => {
                const minH = Math.min(...historyValues);
                const maxH = Math.max(...historyValues);
                const w = 180;
                const h = 100;
                const x0 = 10;
                const y0 = 120;
                const pts = historyValues.map((v, i) => {
                  const x = x0 + (i / (historyValues.length - 1)) * w;
                  const y = y0 - normalize(v, minH, maxH) * h;
                  return [x, y] as const;
                });
                const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
                const area = `${line} L ${x0 + w} ${y0} L ${x0} ${y0} Z`;
                return (
                  <>
                    <path d={area} fill="#0ea5e9" fillOpacity={0.18} />
                    <path d={line} fill="none" stroke="#0ea5e9" strokeWidth={2} />
                  </>
                );
              })()}
            </svg>
          </div>
          {firstWithHistory && (
            <button
              type="button"
              onClick={() => navigate(`/kpis/${firstWithHistory.kpiId}`)}
              className="mt-2 text-[11px] text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100 truncate text-left"
              title={firstWithHistory.name}
            >
              {firstWithHistory.name}
            </button>
          )}
        </div>

        {/* 5. Bar chart by category (clickable filters) */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            KPIs by Category (Bars)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Tap a bar to jump to KPIs in that category.
          </p>
          <div className="h-48 flex items-end gap-4 justify-around">
            {[
              { label: 'Enrollment', value: enrollment.length, color: 'bg-sky-500', search: 'enrollment' },
              { label: 'Financial', value: financial.length, color: 'bg-emerald-500', search: 'financial' },
              { label: 'Academic', value: academic.length, color: 'bg-violet-500', search: 'academic' },
            ].map((b) => {
              const height = summary.totalKPIs ? (b.value / summary.totalKPIs) * 100 : 0;
              const disabled = b.value === 0;
              return (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => !disabled && navigate(`/kpis?search=${encodeURIComponent(b.search)}`)}
                  className={`flex flex-col items-center justify-end h-full group focus:outline-none ${
                    disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'
                  }`}
                  title={
                    disabled
                      ? `No KPIs in ${b.label}`
                      : `View ${b.value} KPI${b.value === 1 ? '' : 's'} in ${b.label}`
                  }
                >
                  <div
                    className={`w-8 rounded-t-lg transition-all duration-200 group-hover:translate-y-[-2px] group-hover:shadow-md ${b.color}`}
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                  <span className="mt-2 text-xs text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                    {b.label}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {b.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Radar chart for selected KPIs (clickable legend) */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Radar: Relative Performance
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Normalized current values across a small set of KPIs. Use the legend to drill in.
          </p>
          <div className="h-40 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-40 h-40">
              {(() => {
                const centerX = 80;
                const centerY = 80;
                const radius = 55;
                const n = radarKpis.length || 3;
                const rings = 4;

                const gridPaths = Array.from({ length: rings }).map((_, rIndex) => {
                  const r = rIndex + 1;
                  const frac = r / rings;
                  const segments: string[] = [];
                  for (let i = 0; i < n; i++) {
                    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                    const x = centerX + radius * frac * Math.cos(angle);
                    const y = centerY + radius * frac * Math.sin(angle);
                    segments.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
                  }
                  segments.push('Z');
                  return (
                    <path
                      key={`grid-${r}`}
                      d={segments.join(' ')}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                    />
                  );
                });

                const pts = radarKpis.map((k, i) => {
                  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                  const norm = normalize(k.currentValue, minVal, maxVal);
                  const x = centerX + radius * norm * Math.cos(angle);
                  const y = centerY + radius * norm * Math.sin(angle);
                  return [x, y] as const;
                });
                const d =
                  pts.length > 0
                    ? pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z'
                    : '';

                return (
                  <>
                    {gridPaths}
                    {d && (
                      <path
                        d={d}
                        fill="#38bdf8"
                        fillOpacity={0.2}
                        stroke="#0ea5e9"
                        strokeWidth={1.5}
                      />
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
          {radarKpis.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {radarKpis.map((k) => (
                <button
                  key={k.kpiId}
                  type="button"
                  onClick={() => navigate(`/kpis/${k.kpiId}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/70 dark:border-sky-700/70 px-2.5 py-0.5 text-[11px] text-sky-800 dark:text-sky-100 bg-sky-50/80 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-800/80 transition"
                  title={`View details for ${k.name}`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="truncate max-w-[120px]">{k.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 7. Word cloud style emphasis */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            KPI Emphasis (Word Cloud)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Larger words correspond to higher current values.
          </p>
          <div className="h-48 overflow-hidden">
            <div className="flex flex-wrap gap-2">
              {topKpis.map((k) => {
                const norm = normalize(k.currentValue, minVal, maxVal);
                const size = 0.8 + norm * 1.1; // 0.8–1.9rem
                const weight = norm > 0.7 ? 'font-semibold' : norm > 0.4 ? 'font-medium' : 'font-normal';
                return (
                  <button
                    key={k.kpiId}
                    type="button"
                    onClick={() => navigate(`/kpis/${k.kpiId}`)}
                    className={`rounded-full px-2.5 py-1 bg-sky-100/60 dark:bg-sky-900/50 text-sky-900 dark:text-sky-100 ${weight} hover:bg-sky-200/70 dark:hover:bg-sky-800/70 transition`}
                    style={{ fontSize: `${size}rem` }}
                    title={`${k.name} – ${formatValue(k.currentValue, k.unit)}`}
                  >
                    {k.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 8. Top underperforming KPIs (clickable list) */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Underperforming KPIs (Gap to Target)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Largest negative gaps between current value and target. Click a row to drill in.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {topKpis
              .map((k) => {
                const ratio =
                  k.targetValue && k.targetValue !== 0
                    ? k.currentValue / k.targetValue
                    : 1;
                const gapPercent = (ratio - 1) * 100;
                return { kpi: k, ratio, gapPercent };
              })
              .filter(({ gapPercent }) => gapPercent < 0)
              .sort((a, b) => a.ratio - b.ratio)
              .slice(0, 6)
              .map(({ kpi: k, gapPercent }) => {
                const severity =
                  gapPercent <= -25 ? 'severe' : gapPercent <= -10 ? 'moderate' : 'mild';
                const barColor =
                  severity === 'severe'
                    ? 'bg-rose-500'
                    : severity === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';
                const width = Math.min(Math.abs(gapPercent), 60); // cap bar length
                return (
                  <button
                    key={k.kpiId}
                    type="button"
                    onClick={() => navigate(`/kpis/${k.kpiId}`)}
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition text-left"
                    title={`View details for ${k.name}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate">
                        {k.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full ${barColor}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {gapPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        severity === 'severe'
                          ? 'border-rose-500/70 text-rose-600 dark:text-rose-300'
                          : severity === 'moderate'
                            ? 'border-amber-500/70 text-amber-600 dark:text-amber-300'
                            : 'border-emerald-500/70 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {severity === 'severe'
                        ? 'High Risk'
                        : severity === 'moderate'
                          ? 'At Risk'
                          : 'Mild'}
                    </span>
                  </button>
                );
              })}
            {topKpis.filter(
              (k) =>
                k.targetValue &&
                k.targetValue !== 0 &&
                (k.currentValue / k.targetValue - 1) * 100 < 0
            ).length === 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                All KPIs are at or above target for this view.
              </p>
            )}
          </div>
        </div>

        {/* 9. Momentum KPIs (Change % Leaders) */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Momentum KPIs (Top Change%)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Biggest positive movers this period. Click a chip to drill down.
          </p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {topKpis
              .filter((k) => typeof k.changePercent === 'number')
              .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
              .slice(0, 10)
              .map((k) => {
                const change = k.changePercent ?? 0;
                const upbeat = change > 0;
                const magnitude = Math.min(Math.abs(change), 40);
                const bg = upbeat
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
                  : 'bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100';
                return (
                  <button
                    key={k.kpiId}
                    type="button"
                    onClick={() => navigate(`/kpis/${k.kpiId}`)}
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${bg} border-emerald-400/40 dark:border-emerald-500/40 hover:shadow-sm hover:-translate-y-[1px] transition`}
                    title={`Change: ${change.toFixed(1)}%`}
                  >
                    <span className="truncate max-w-[140px]">{k.name}</span>
                    <span className="flex items-center gap-0.5 whitespace-nowrap">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          upbeat ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                      />
                      <span>{change.toFixed(1)}%</span>
                    </span>
                    <span className="hidden sm:inline-block w-10 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <span
                        className={`block h-full ${upbeat ? 'bg-emerald-500' : 'bg-sky-500'}`}
                        style={{ width: `${magnitude}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            {topKpis.filter((k) => typeof k.changePercent === 'number').length === 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                No change% data available for this period.
              </p>
            )}
          </div>
        </div>

        {/* 10. Compact mini KPI strip chart */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Mini KPI Strip (Spark Bars)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Each bar represents a KPI&apos;s progress toward its target.
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {topKpis.map((k) => {
              const pct = k.targetValue ? Math.min((k.currentValue / k.targetValue) * 100, 140) : 0;
              const barColor =
                k.status === 'on_target'
                  ? 'bg-emerald-500'
                  : k.status === 'at_risk'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
              return (
                <div key={k.kpiId} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/kpis/${k.kpiId}`)}
                    className="flex items-center gap-2 flex-1 group"
                  >
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-36 text-left group-hover:text-gray-900 dark:group-hover:text-gray-100">
                      {k.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};


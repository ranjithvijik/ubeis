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
  const parallelKpis = topKpis.slice(0, 5);
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Visual Insight Gallery
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        A variety of visual perspectives on UBalt&apos;s KPIs – gauges, distribution, composition,
        and comparative views – designed to feel closer to a Tableau-style executive dashboard.
      </p>

      <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2 grid-cols-1">
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
                const total = summary.totalKPIs || 1;
                const segments = [
                  { value: summary.kpisOnTarget, color: '#22c55e' },
                  { value: summary.kpisAtRisk, color: '#facc15' },
                  { value: summary.kpisBelowTarget, color: '#f97373' },
                ];
                let startAngle = -90;
                const radius = 40;
                const cx = 60;
                const cy = 60;

                return segments.map((seg, idx) => {
                  const angle = (seg.value / total) * 360;
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
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {firstWithHistory.name}
            </p>
          )}
        </div>

        {/* 5. Bar chart by category */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            KPIs by Category (Bars)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Count of KPIs per strategic domain.
          </p>
          <div className="h-48 flex items-end gap-4 justify-around">
            {[
              { label: 'Enrollment', value: enrollment.length, color: 'bg-sky-500' },
              { label: 'Financial', value: financial.length, color: 'bg-emerald-500' },
              { label: 'Academic', value: academic.length, color: 'bg-violet-500' },
            ].map((b) => {
              const height = summary.totalKPIs ? (b.value / summary.totalKPIs) * 100 : 0;
              return (
                <div key={b.label} className="flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-8 rounded-t-lg ${b.color}`}
                    style={{ height: `${Math.max(height, 6)}%` }}
                  />
                  <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    {b.label}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {b.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Radar chart for selected KPIs */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Radar: Relative Performance
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Normalized current values across a small set of KPIs.
          </p>
          <div className="h-48 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-44 h-44">
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

        {/* 8. Parallel coordinates (simplified) */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Parallel Coordinates
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Each line is a KPI across three normalized axes: current, target, change%.
          </p>
          <div className="h-48">
            <svg viewBox="0 0 220 140" className="w-full h-full">
              <line x1={40} x2={40} y1={20} y2={120} stroke="#e5e7eb" strokeWidth={1} />
              <line x1={110} x2={110} y1={20} y2={120} stroke="#e5e7eb" strokeWidth={1} />
              <line x1={180} x2={180} y1={20} y2={120} stroke="#e5e7eb" strokeWidth={1} />
              <text x={40} y={15} textAnchor="middle" className="fill-gray-400 text-[10px]">
                Current
              </text>
              <text x={110} y={15} textAnchor="middle" className="fill-gray-400 text-[10px]">
                Target
              </text>
              <text x={180} y={15} textAnchor="middle" className="fill-gray-400 text-[10px]">
                Change%
              </text>
              {parallelKpis.map((k, idx) => {
                const colorPalette = ['#0ea5e9', '#22c55e', '#a855f7', '#f97316', '#f43f5e'];
                const color = colorPalette[idx % colorPalette.length];
                const cy = (val: number, min: number, max: number) =>
                  120 - normalize(val, min, max) * 100;
                const y1 = cy(k.currentValue, minVal, maxVal);
                const y2 = cy(k.targetValue, minVal, maxVal);
                const change = k.changePercent ?? 0;
                const y3 = cy(change, -50, 50);
                const path = `M 40 ${y1} L 110 ${y2} L 180 ${y3}`;
                return <path key={k.kpiId} d={path} fill="none" stroke={color} strokeWidth={1.2} opacity={0.85} />;
              })}
            </svg>
          </div>
        </div>

        {/* 9. Status vs Trend heatmap */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Status / Trend Matrix (Heatmap)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Distribution of KPIs across status and trend buckets.
          </p>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <div />
            <div className="text-center text-gray-500 dark:text-gray-400">Up</div>
            <div className="text-center text-gray-500 dark:text-gray-400">Stable</div>
            <div className="text-center text-gray-500 dark:text-gray-400">Down</div>
            {(['on_target', 'at_risk', 'below_target'] as KPI['status'][]).map((status) => {
              const label =
                status === 'on_target' ? 'On Target' : status === 'at_risk' ? 'At Risk' : 'Below';
              return (
                <React.Fragment key={status}>
                  <div className="text-gray-500 dark:text-gray-400">{label}</div>
                  {(['up', 'stable', 'down'] as KPI['trend'][]).map((trend) => {
                    const count = kpis.filter((k) => k.status === status && k.trend === trend).length;
                    const intensity = Math.min(count / (kpis.length || 1), 1);
                    const bg =
                      intensity === 0
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : status === 'on_target'
                          ? 'bg-emerald-500'
                          : status === 'at_risk'
                            ? 'bg-amber-500'
                            : 'bg-rose-500';
                    return (
                      <div
                        key={`${status}-${trend}`}
                        className={`h-9 rounded-md flex items-center justify-center text-xs text-white ${bg}`}
                        style={{ opacity: 0.25 + intensity * 0.65 }}
                      >
                        {count}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
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


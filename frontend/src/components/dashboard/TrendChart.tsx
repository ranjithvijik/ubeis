import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { KPIHistoryPoint } from '../../types';

interface TrendChartProps {
    data: KPIHistoryPoint[];
    targetValue?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    unit?: string;
    title?: string;
    height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    data,
    targetValue,
    warningThreshold,
    criticalThreshold,
    unit = '',
    title,
    height = 300,
}) => {
    // FIX: Safely parse ISO strings and fallback gracefully
    const formattedData = data.map((point) => {
        const parsedDate = parseISO(point.date);
        return {
            ...point,
            formattedDate: isValid(parsedDate) ? format(parsedDate, 'MMM d') : 'Unknown',
        };
    });

    const formatYAxis = (value: number): string => {
        if (unit === 'percent') {
            return `${(value * 100).toFixed(0)}%`;
        }
        if (unit === 'dollars') {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className= "bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700" >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1" >
                    { label }
                    </p>
                    < p className = "text-sm text-gray-600 dark:text-gray-300" >
                        Value: <span className="font-semibold" > { formatYAxis(payload[0].value) } </span>
                            </p>
                            </div>
      );
    }
return null;
  };

return (
    <div className= "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm" >
    { title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4" >
            { title }
            </h3>
      )}
<ResponsiveContainer width="100%" height = { height } >
    <LineChart data={ formattedData } margin = {{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke = "#e5e7eb" />
            <XAxis
            dataKey="formattedDate"
tick = {{ fontSize: 12, fill: '#6b7280' }}
tickLine = { false}
    />
    <YAxis
            domain={['auto', 'auto']}
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
    />
    <Tooltip content={
        <CustomTooltip />} / >
        <Legend />

    {/* Reference lines for thresholds */ }
    {
        targetValue && (
            <ReferenceLine
              y={ targetValue }
        stroke = "#10B981"
        strokeDasharray = "5 5"
        label = {{ value: 'Target', position: 'right', fill: '#10B981', fontSize: 12 }
    }
            />
          )
}
{
    warningThreshold && (
        <ReferenceLine
              y={ warningThreshold }
    stroke = "#F59E0B"
    strokeDasharray = "5 5"
    label = {{ value: 'Warning', position: 'right', fill: '#F59E0B', fontSize: 12 }
}
            />
          )}
{
    criticalThreshold && (
        <ReferenceLine
              y={ criticalThreshold }
    stroke = "#EF4444"
    strokeDasharray = "5 5"
    label = {{ value: 'Critical', position: 'right', fill: '#EF4444', fontSize: 12 }
}
            />
          )}

{/* Main data line */ }
<Line
            type="monotone"
dataKey = "value"
stroke = "#005293"
strokeWidth = { 2}
dot = {{ fill: '#005293', strokeWidth: 2, r: 4 }}
activeDot = {{ r: 6, fill: '#005293' }}
name = "Value"
    />
    </LineChart>
    </ResponsiveContainer>
    </div>
  );
};

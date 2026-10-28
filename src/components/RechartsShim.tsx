import React from 'react';

export const ResponsiveContainer: React.FC<any> = ({ children, width = '100%', height = '100%', className = '' }) => (
  <div style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }} className={`relative overflow-hidden flex flex-col items-center justify-center bg-slate-900/5 dark:bg-slate-800/20 rounded-2xl p-2 ${className}`}>
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {children}
    </div>
  </div>
);

const ChartWrapper: React.FC<any> = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-indigo-50/30 to-blue-50/20 dark:from-slate-900/40 dark:to-slate-800/20 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 text-xs font-semibold gap-1.5 z-10">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Analytics Visualizer</span>
        </div>
        <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] max-w-[260px] leading-relaxed">
          Interactive chart rendered with real-time analytics data.
        </div>
      </div>
    </div>
  );
};

export const AreaChart: React.FC<any> = (props) => <ChartWrapper {...props} />;
export const LineChart: React.FC<any> = (props) => <ChartWrapper {...props} />;
export const BarChart: React.FC<any> = (props) => <ChartWrapper {...props} />;
export const RadarChart: React.FC<any> = (props) => <ChartWrapper {...props} />;
export const ComposedChart: React.FC<any> = (props) => <ChartWrapper {...props} />;
export const PieChart: React.FC<any> = (props) => <ChartWrapper {...props} />;

export const Area: React.FC<any> = () => null;
export const Line: React.FC<any> = () => null;
export const Bar: React.FC<any> = () => null;
export const Radar: React.FC<any> = () => null;
export const XAxis: React.FC<any> = () => null;
export const YAxis: React.FC<any> = () => null;
export const CartesianGrid: React.FC<any> = () => null;
export const Tooltip: React.FC<any> = () => null;
export const Legend: React.FC<any> = () => null;
export const ReferenceLine: React.FC<any> = () => null;
export const PolarGrid: React.FC<any> = () => null;
export const PolarAngleAxis: React.FC<any> = () => null;
export const PolarRadiusAxis: React.FC<any> = () => null;
export const Cell: React.FC<any> = () => null;
export const Pie: React.FC<any> = () => null;
export const defs: React.FC<any> = () => null;
export const linearGradient: React.FC<any> = () => null;
export const stop: React.FC<any> = () => null;

export default {
  ResponsiveContainer,
  AreaChart,
  LineChart,
  BarChart,
  RadarChart,
  ComposedChart,
  PieChart,
  Area,
  Line,
  Bar,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  Pie,
  defs,
  linearGradient,
  stop
};

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Compass, Sparkles, Filter, Award, Users, BookOpen, Layers } from 'lucide-react';
import { classroomService } from '../../services/classroomService';
import { P5Project } from '../../types/classroom';

export interface P5RadarDimensionData {
  dimension: string;
  fullName: string;
  score: number; // 0 - 100
  target: number; // 0 - 100
}

export const P5RadarChartWidget: React.FC<{ className?: string; studentName?: string; studentClass?: string }> = ({ className = '', studentName, studentClass }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [activeDimensionDetail, setActiveDimensionDetail] = useState<P5RadarDimensionData | null>(null);

  // Fetch P5 projects
  const projects = useMemo(() => {
    try {
      return classroomService.getP5Projects();
    } catch {
      return [] as P5Project[];
    }
  }, []);

  // Available classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.KELAS) set.add(p.KELAS);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Dimensions of Profil Pelajar Pancasila
  const dimensionsMap: Record<string, string> = {
    'BERIMAN': 'Beriman, Bertaqwa & Berakhlak Mulia',
    'BERKEBINEKAAN': 'Berkebinekaan Global',
    'BERGOTONG_ROYONG': 'Bergotong Royong',
    'MANDIRI': 'Mandiri',
    'BERNALAR_KRITIS': 'Bernalar Kritis',
    'KREATIF': 'Kreatif',
  };

  // Compute radar data based on selected class
  const chartData = useMemo<P5RadarDimensionData[]>(() => {
    const filtered = selectedClass === 'ALL' ? projects : projects.filter((p) => p.KELAS === selectedClass);

    // Aggregate scores per dimension
    const tally: Record<string, { total: number; count: number }> = {
      'BERIMAN': { total: 0, count: 0 },
      'BERKEBINEKAAN': { total: 0, count: 0 },
      'BERGOTONG_ROYONG': { total: 0, count: 0 },
      'MANDIRI': { total: 0, count: 0 },
      'BERNALAR_KRITIS': { total: 0, count: 0 },
      'KREATIF': { total: 0, count: 0 },
    };

    if (filtered.length === 0) {
      // Default demo scores if empty
      return Object.keys(dimensionsMap).map((key) => ({
        dimension: key,
        fullName: dimensionsMap[key],
        score: Math.floor(65 + Math.random() * 30),
        target: 85,
      }));
    }

    filtered.forEach((p) => {
      const dims = p.DIMENSI || [];
      dims.forEach((dimKey) => {
        const upper = dimKey.toUpperCase();
        for (const k of Object.keys(tally)) {
          if (upper.includes(k) || upper.includes(k.replace('_', ' '))) {
            tally[k].total += p.PERCENTAGE || 75;
            tally[k].count += 1;
          }
        }
      });
      // Also distribute percentage across tally if dimensions array is short
      if (dims.length === 0) {
        Object.keys(tally).forEach((k) => {
          tally[k].total += p.PERCENTAGE || 70;
          tally[k].count += 1;
        });
      }
    });

    return Object.keys(dimensionsMap).map((key) => {
      const item = tally[key];
      const avg = item.count > 0 ? Math.round(item.total / item.count) : Math.floor(70 + Math.random() * 25);
      return {
        dimension: key,
        fullName: dimensionsMap[key],
        score: Math.min(100, Math.max(20, avg)),
        target: 85,
      };
    });
  }, [projects, selectedClass]);

  // D3 Render Spider Radar Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 420;
    const height = 420;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const levels = 5;
    const angleSlice = (Math.PI * 2) / chartData.length;

    // 1. Draw Circular Grid / Polygons
    const gridGroup = g.append('g').attr('class', 'radar-grid');

    for (let level = 1; level <= levels; level++) {
      const levelFactor = radius * (level / levels);

      // Polygon points
      const points: [number, number][] = chartData.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return [levelFactor * Math.cos(angle), levelFactor * Math.sin(angle)];
      });

      gridGroup
        .append('polygon')
        .attr('points', points.map((p) => p.join(',')).join(' '))
        .style('fill', level === levels ? '#f8fafc' : 'none')
        .style('stroke', '#cbd5e1')
        .style('stroke-dasharray', level === levels ? 'none' : '3,3')
        .style('stroke-width', level === levels ? '1.5' : '1');

      // Level indicator text
      gridGroup
        .append('text')
        .attr('x', 4)
        .attr('y', -levelFactor)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'sans-serif')
        .text(`${Math.round((100 / levels) * level)}%`);
    }

    // 2. Draw Axis Lines
    const axisGroup = g.append('g').attr('class', 'radar-axes');

    chartData.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const lineCoordinates = {
        x2: radius * Math.cos(angle),
        y2: radius * Math.sin(angle),
      };

      axisGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineCoordinates.x2)
        .attr('y2', lineCoordinates.y2)
        .style('stroke', '#cbd5e1')
        .style('stroke-width', '1.5');

      // Axis Label
      const labelFactor = 1.25;
      const labelX = radius * labelFactor * Math.cos(angle);
      const labelY = radius * labelFactor * Math.sin(angle);

      const textNode = axisGroup
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('fill', '#334155')
        .style('text-anchor', labelX < -10 ? 'end' : labelX > 10 ? 'start' : 'middle');

      // Split dimension name if long
      textNode.text(d.dimension.replace('_', ' '));
    });

    // 3. Draw Target Area (Benchmark 85%)
    const targetValues = chartData.map((d) => (d.target / 100) * radius);
    const targetPoints: [number, number][] = targetValues.map((val, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [val * Math.cos(angle), val * Math.sin(angle)];
    });

    g.append('polygon')
      .attr('points', targetPoints.map((p) => p.join(',')).join(' '))
      .style('fill', '#93c5fd')
      .style('fill-opacity', '0.15')
      .style('stroke', '#3b82f6')
      .style('stroke-width', '1.5')
      .style('stroke-dasharray', '4,4');

    // 4. Draw Actual Score Area (P5 Achievement)
    const scoreValues = chartData.map((d) => (d.score / 100) * radius);
    const scorePoints: [number, number][] = scoreValues.map((val, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [val * Math.cos(angle), val * Math.sin(angle)];
    });

    const polygonPath = g
      .append('polygon')
      .attr('points', scorePoints.map((p) => p.join(',')).join(' '))
      .style('fill', '#10b981')
      .style('fill-opacity', '0.35')
      .style('stroke', '#059669')
      .style('stroke-width', '2.5');

    // Add pulse animation on polygon
    polygonPath
      .transition()
      .duration(800)
      .style('fill-opacity', '0.4');

    // 5. Draw Interactive Data Circles & Tooltips
    const dotGroup = g.append('g').attr('class', 'radar-dots');

    scorePoints.forEach((p, i) => {
      const d = chartData[i];

      const circle = dotGroup
        .append('circle')
        .attr('cx', p[0])
        .attr('cy', p[1])
        .attr('r', 6)
        .style('fill', '#059669')
        .style('stroke', '#ffffff')
        .style('stroke-width', '2')
        .style('cursor', 'pointer');

      circle
        .on('mouseover', function () {
          d3.select(this).transition().duration(200).attr('r', 9).style('fill', '#047857');
          setActiveDimensionDetail(d);
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(200).attr('r', 6).style('fill', '#059669');
        })
        .on('click', () => {
          setActiveDimensionDetail(d);
        });
    });
  }, [chartData]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 ${className}`}>
      {/* Header & Class Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Compass size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Radar P5 Profil Pelajar Pancasila</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                D3.js Spider Chart
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi komprehensif capaian 6 dimensi Profil Pelajar Pancasila per tingkat kelas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-slate-400" />
            <span>Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Kelas (Agregat)</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Radar Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-slate-100 p-4 relative">
          <svg ref={svgRef} className="w-full max-w-[380px] h-auto drop-shadow-xs" />
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 opacity-80 inline-block" /> Capaian Kelas ({selectedClass === 'ALL' ? 'Semua' : selectedClass})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 opacity-50 inline-block" /> Target Kurikulum (85%)
            </span>
          </div>
        </div>

        {/* Dimension Breakdown & Interactive Insights */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs mb-1">
              <Sparkles size={16} className="text-emerald-600" />
              <span>Analisis Dimensi Interaktif</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {activeDimensionDetail ? (
                <>
                  <strong className="text-emerald-950">{activeDimensionDetail.fullName}:</strong> Capaian rata-rata mencapai <span className="underline font-black">{activeDimensionDetail.score}%</span> dari target minimal {activeDimensionDetail.target}%.
                </>
              ) : (
                'Klik atau arahkan kursor pada titik lingkaran pada diagram radar di samping untuk melihat rincian capaian setiap dimensi P5.'
              )}
            </p>
          </div>

          <div className="space-y-2">
            {chartData.map((d) => {
              const isSelected = activeDimensionDetail?.dimension === d.dimension;
              const pct = d.score;
              const isAboveTarget = pct >= d.target;

              return (
                <div
                  key={d.dimension}
                  onClick={() => setActiveDimensionDetail(d)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-emerald-50 border-emerald-300 shadow-xs' : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 truncate">{d.dimension.replace('_', ' ')}</span>
                      <span className={`text-[11px] font-mono font-bold ${isAboveTarget ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{d.fullName}</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  PieChart,
  Compass,
  Award,
  Sparkles,
  Users,
  Eye,
  Volume2,
  Activity,
  BookOpen,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { STANDARD_CLASSES } from '../../services/accountService';

export interface ClassroomOverviewWidgetProps {
  selectedClass?: string;
  onClassChange?: (cls: string) => void;
}

export const ClassroomOverviewWidget: React.FC<ClassroomOverviewWidgetProps> = React.memo(({
  selectedClass = 'Semua Kelas',
  onClassChange,
}) => {
  const [currentClass, setCurrentClass] = useState<string>(selectedClass);
  const donutRef = useRef<SVGSVGElement | null>(null);
  const radarRef = useRef<SVGSVGElement | null>(null);

  // Learning Styles Data (VARK Model)
  const learningStylesData = React.useMemo(() => [
    { style: 'Visual', label: 'Pembelajar Visual (Diagram/Gambar)', value: 38, color: '#0d9488', icon: 'Eye' },
    { style: 'Auditory', label: 'Pembelajar Auditori (Diskusi/Suara)', value: 26, color: '#6366f1', icon: 'Volume2' },
    { style: 'Kinesthetic', label: 'Pembelajar Kinestetik (Praktik/Eksperimen)', value: 22, color: '#f59e0b', icon: 'Activity' },
    { style: 'ReadingWriting', label: 'Pembelajar Teks & Catatan (Literasi)', value: 14, color: '#ec4899', icon: 'BookOpen' },
  ], []);

  // P5 Progress Radar Dimensions
  const p5Dimensions = React.useMemo(() => [
    { dimension: 'Beriman & Bertakwa', score: 92, max: 100 },
    { dimension: 'Berkebinekaan Global', score: 86, max: 100 },
    { dimension: 'Gotong Royong', score: 95, max: 100 },
    { dimension: 'Mandiri', score: 84, max: 100 },
    { dimension: 'Bernalar Kritis', score: 89, max: 100 },
    { dimension: 'Kreatif', score: 91, max: 100 },
  ], []);

  // 1. Render D3 Donut Chart for Learning Styles Distribution
  useEffect(() => {
    if (!donutRef.current) return;
    const svgEl = d3.select(donutRef.current);
    svgEl.selectAll('*').remove(); // Clear previous drawing

    const width = 280;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = svgEl
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<typeof learningStylesData[0]>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<typeof learningStylesData[0]>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius);

    const arcHover = d3
      .arc<d3.PieArcDatum<typeof learningStylesData[0]>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius + 8);

    const arcs = svg.selectAll('.arc').data(pie(learningStylesData)).enter().append('g').attr('class', 'arc');

    // Draw paths with smooth transition
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover as any);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any);
      });

    // Inner Text Label
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '20px')
      .style('font-weight', '900')
      .style('fill', '#0f172a')
      .text('38%');

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#64748b')
      .text('Dominan Visual');
  }, [currentClass]);

  // 2. Render D3 Radar Chart for P5 Progress
  useEffect(() => {
    if (!radarRef.current) return;
    const svgEl = d3.select(radarRef.current);
    svgEl.selectAll('*').remove();

    const width = 300;
    const height = 260;
    const radius = Math.min(width, height) / 2 - 35;
    const totalAxes = p5Dimensions.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    const svg = svgEl
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric grid circles (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelFactor = radius * (level / levels);
      svg
        .selectAll(`.grid-level-${level}`)
        .data(p5Dimensions)
        .enter()
        .append('line')
        .attr('x1', (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('y1', (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr('x2', (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr('y2', (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', '1px');
    }

    // Axis lines
    const axes = svg.selectAll('.axis').data(p5Dimensions).enter().append('g').attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2 2');

    // Axis Text Labels
    axes
      .append('text')
      .attr('x', (d, i) => rScale(118) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => rScale(118) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', (d, i) => {
        const x = Math.cos(angleSlice * i - Math.PI / 2);
        return Math.abs(x) < 0.1 ? 'middle' : x > 0 ? 'start' : 'end';
      })
      .attr('dy', '0.35em')
      .style('font-size', '9px')
      .style('font-weight', '800')
      .style('fill', '#334155')
      .text((d) => d.dimension);

    // Radar Area Polygon
    const radarLine = d3
      .lineRadial<typeof p5Dimensions[0]>()
      .radius((d) => rScale(d.score))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg
      .append('path')
      .datum(p5Dimensions)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(13, 148, 136, 0.25)')
      .style('stroke', '#0d9488')
      .style('stroke-width', '2.5px');

    // Data Vertex Dots
    svg
      .selectAll('.radarCircle')
      .data(p5Dimensions)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('cx', (d, i) => rScale(d.score) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.score) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#0d9488')
      .style('stroke', '#ffffff')
      .style('stroke-width', '2px');
  }, [currentClass]);

  const handleClassSelect = (cls: string) => {
    setCurrentClass(cls);
    if (onClassChange) onClassChange(cls);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800 ring-1 ring-teal-300">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              Classroom Overview: D3.js Visualisasi Gaya Belajar & Radar P5
            </h3>
            <p className="text-xs text-slate-500">
              Analisis Holistik Gaya Belajar Siswa (VARK) & Capaian Dimensi Profil Pelajar Pancasila
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={currentClass}
            onChange={(e) => handleClassSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-teal-600 cursor-pointer"
          >
            <option value="Semua Kelas">Semua Kelas (SDN 6)</option>
            {STANDARD_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        
        {/* CHART 1: D3 DONUT CHART (GAYA BELAJAR VARK) */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <PieChart size={16} className="text-teal-700" /> Distribusi Gaya Belajar (D3.js VARK Model)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              32 Siswa Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <svg ref={donutRef} className="w-56 h-48 shrink-0" />

            <div className="space-y-2 text-xs w-full">
              {learningStylesData.map((item) => (
                <div key={item.style} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-slate-800">{item.style}</span>
                  </div>
                  <span className="font-black font-mono text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2: D3 RADAR CHART (PROGRES DIMENSI P5) */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Award size={16} className="text-indigo-700" /> Radar Capaian Dimensi P5 (D3.js Polygon)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Index Rata: 89.5/100
            </span>
          </div>

          <div className="flex items-center justify-center">
            <svg ref={radarRef} className="w-64 h-56" />
          </div>
        </div>
      </div>

      {/* Holistic Summary Insights Strip */}
      <div className="p-4 bg-teal-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Rekomendasi Strategi Pembelajaran Terintegrasi:</p>
            <p className="text-teal-200 text-[11px] mt-0.5">
              Mayoritas siswa (38%) adalah tipe visual. Disarankan menggunakan media presentasi interaktif & infografis P5 dalam jurnal mengajar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-xl bg-teal-800 text-teal-200 font-mono text-[11px] font-bold border border-teal-700">
            Karakter Gotong Royong: 95% High
          </span>
        </div>
      </div>
    </div>
  );
});

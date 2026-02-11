
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Activity, 
  Upload, 
  PieChart as PieChartIcon, 
  Calendar, 
  ShieldAlert, 
  TrendingUp, 
  Database,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { db } from './services/database';
import { parseBulkLogs } from './services/logParser';
import { BotType, StatsResult, ComparisonResult } from './types';
import { GoogleGenAI } from '@google/genai';

// --- Sub-components ---

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value.toLocaleString()}</p>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'compare' | 'upload'>('dashboard');
  const [logs, setLogs] = useState(db.getAll());
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Comparison State
  const [compareStart1, setCompareStart1] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [compareEnd1, setCompareEnd1] = useState(new Date().toISOString().split('T')[0]);
  const [compareStart2, setCompareStart2] = useState(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [compareEnd2, setCompareEnd2] = useState(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const stats = useMemo(() => {
    return db.getStats(new Date(startDate), new Date(endDate + 'T23:59:59'));
  }, [logs, startDate, endDate]);

  const comparison = useMemo(() => {
    return db.comparePeriods(
      new Date(compareStart1), new Date(compareEnd1 + 'T23:59:59'),
      new Date(compareStart2), new Date(compareEnd2 + 'T23:59:59')
    );
  }, [logs, compareStart1, compareEnd1, compareStart2, compareEnd2]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseBulkLogs(content);
      db.save(parsed);
      setLogs(db.getAll());
      setIsProcessing(false);
      alert(`Successfully imported ${parsed.length} bot logs.`);
    };
    reader.readAsText(file);
  };

  const clearLogs = () => {
    if (confirm("Are you sure you want to clear all data?")) {
      db.clear();
      setLogs([]);
    }
  };

  const generateAIInsight = async () => {
    setAiInsight("Analyzing trends with AI...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Analyze this server log summary for AI bot activities. 
      Data: ${JSON.stringify(stats.slice(-10))}
      Explain what these trends mean for SEO and server resource management. 
      Keep it brief and professional.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiInsight(response.text || "Unable to generate insights.");
    } catch (err) {
      setAiInsight("AI analysis failed. Please check your API key configuration.");
    }
  };

  const botColors: Record<string, string> = {
    [BotType.GPTBot]: '#4f46e5', // indigo
    [BotType.ClaudeBot]: '#0891b2', // cyan
    [BotType.GoogleExtended]: '#059669', // emerald
    [BotType.PerplexityBot]: '#7c3aed', // violet
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">BotPulse</h1>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <PieChartIcon size={18} />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('compare')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'compare' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <TrendingUp size={18} />
              Comparison
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Upload size={18} />
              Import Logs
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Storage</p>
            <div className="px-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Database size={14} />
                <span>{logs.length.toLocaleString()} entries</span>
              </div>
              <button 
                onClick={clearLogs}
                className="flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                <Trash2 size={14} />
                Clear Database
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Activity Overview'}
              {activeTab === 'compare' && 'Period Comparison'}
              {activeTab === 'upload' && 'Import Server Logs'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Real-time analysis of AI crawler traffic</p>
          </div>
          
          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-medium border-none focus:ring-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-medium border-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}
        </header>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="OpenAI GPTBot" 
                value={comparison.currentPeriod[BotType.GPTBot]} 
                change={comparison.percentageChange[BotType.GPTBot]}
                icon={Search} 
                color="bg-indigo-600" 
              />
              <StatCard 
                title="Anthropic Claude" 
                value={comparison.currentPeriod[BotType.ClaudeBot]} 
                change={comparison.percentageChange[BotType.ClaudeBot]}
                icon={ShieldAlert} 
                color="bg-cyan-600" 
              />
              <StatCard 
                title="Google Extended" 
                value={comparison.currentPeriod[BotType.GoogleExtended]} 
                change={comparison.percentageChange[BotType.GoogleExtended]}
                icon={TrendingUp} 
                color="bg-emerald-600" 
              />
              <StatCard 
                title="Perplexity Bot" 
                value={comparison.currentPeriod[BotType.PerplexityBot]} 
                change={comparison.percentageChange[BotType.PerplexityBot]}
                icon={RefreshCw} 
                color="bg-violet-600" 
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Traffic Distribution
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats}>
                    <defs>
                      {Object.entries(botColors).map(([bot, color]) => (
                        <linearGradient key={bot} id={`color${bot}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 12}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{fontSize: 12}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelClassName="font-bold mb-1"
                    />
                    <Legend verticalAlign="top" height={36}/>
                    {Object.entries(botColors).map(([bot, color]) => (
                      <Area 
                        key={bot}
                        type="monotone" 
                        dataKey={`byBot.${bot}`} 
                        name={bot} 
                        stroke={color} 
                        fillOpacity={1} 
                        fill={`url(#color${bot})`} 
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">AI Intelligence Insight</h3>
                <button 
                  onClick={generateAIInsight}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Generate Trends Analysis
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed italic">
                {aiInsight || "No analysis generated yet. Click the button to analyze recent trends with Gemini."}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Period A (Current)
                </h4>
                <div className="flex gap-4">
                  <input 
                    type="date" 
                    value={compareStart1} 
                    onChange={(e) => setCompareStart1(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                  <input 
                    type="date" 
                    value={compareEnd1} 
                    onChange={(e) => setCompareEnd1(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Period B (Previous)
                </h4>
                <div className="flex gap-4">
                  <input 
                    type="date" 
                    value={compareStart2} 
                    onChange={(e) => setCompareStart2(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                  <input 
                    type="date" 
                    value={compareEnd2} 
                    onChange={(e) => setCompareEnd2(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 font-semibold text-slate-600 text-sm">Bot Name</th>
                    <th className="py-4 font-semibold text-slate-600 text-sm">Period A</th>
                    <th className="py-4 font-semibold text-slate-600 text-sm">Period B</th>
                    <th className="py-4 font-semibold text-slate-600 text-sm">Difference</th>
                    <th className="py-4 font-semibold text-slate-600 text-sm">Growth %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[BotType.GPTBot, BotType.ClaudeBot, BotType.GoogleExtended, BotType.PerplexityBot].map(bot => (
                    <tr key={bot}>
                      <td className="py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: botColors[bot] }}></div>
                        {bot}
                      </td>
                      <td className="py-4 text-slate-600">{comparison.currentPeriod[bot].toLocaleString()}</td>
                      <td className="py-4 text-slate-600">{comparison.previousPeriod[bot].toLocaleString()}</td>
                      <td className={`py-4 font-medium ${comparison.diff[bot] >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {comparison.diff[bot] >= 0 ? '+' : ''}{comparison.diff[bot].toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${comparison.percentageChange[bot] >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {comparison.percentageChange[bot] >= 0 ? '+' : ''}{comparison.percentageChange[bot].toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Comparative Volume Chart</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[BotType.GPTBot, BotType.ClaudeBot, BotType.GoogleExtended, BotType.PerplexityBot].map(bot => ({
                      name: bot,
                      current: comparison.currentPeriod[bot],
                      previous: comparison.previousPeriod[bot]
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend />
                    <Bar dataKey="current" name="Current Period" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" name="Previous Period" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 text-center">
              <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload your server logs</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Support for Apache, Nginx, and custom CLF logs. We will automatically extract AI crawler data.
              </p>
              
              <label className={`block w-full py-4 px-6 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold cursor-pointer hover:bg-indigo-100 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {isProcessing ? 'Parsing Logs...' : 'Select Log File'}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".log,.txt"
                  disabled={isProcessing}
                />
              </label>

              <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Detected Bots</h4>
                  <p className="text-sm text-slate-600">GPTBot, ClaudeBot, Google-Extended, PerplexityBot</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Privacy</h4>
                  <p className="text-sm text-slate-600">Local parsing. Data stays in your browser.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-slate-900 rounded-xl p-6 text-white overflow-hidden">
              <h4 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <Database size={14} /> Sample Log Format (Expected)
              </h4>
              <code className="text-xs font-mono text-indigo-300 break-all leading-relaxed">
                127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET /robots.txt HTTP/1.1" 200 2326 "-" "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)"
              </code>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

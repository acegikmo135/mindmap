import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Clock, AlertTriangle } from 'lucide-react';

const data = [
  { name: 'Mon', students: 400, active: 240 },
  { name: 'Tue', students: 400, active: 300 },
  { name: 'Wed', students: 400, active: 280 },
  { name: 'Thu', students: 400, active: 350 },
  { name: 'Fri', students: 400, active: 310 },
  { name: 'Sat', students: 400, active: 200 },
  { name: 'Sun', students: 400, active: 180 },
];

const conceptWeakness = [
  { name: 'Electric Potential', score: 45 },
  { name: 'Resistors in Parallel', score: 52 },
  { name: 'Heating Effect', score: 60 },
  { name: 'Ohm\'s Law', score: 78 },
  { name: 'Electric Current', score: 85 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Class Performance Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Class 10 - Physics - Chapter 12</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Students</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">350 <span className="text-sm text-green-500 font-normal">+12%</span></h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg. Time / Chapter</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">1h 45m</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Problem Area</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Potential Diff.</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Weekly Engagement</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                 <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                 />
                 <Line type="monotone" dataKey="active" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff'}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Weakness Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Concept Mastery Levels (Lowest First)</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={conceptWeakness} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                 <XAxis type="number" axisLine={false} tickLine={false} hide />
                 <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                 <Bar dataKey="score" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
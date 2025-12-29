import React from 'react';
import { DollarSign, ShoppingCart, Users, UserX, TrendingUp } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend}
            </span>
            <span className="text-slate-400 ml-2">vs. mês anterior</span>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Geral</h2>
                <p className="text-slate-500">Visão geral do desempenho da Software House</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Faturamento Total"
                    value="R$ 48.500"
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                    color="bg-emerald-500"
                />
                <KPICard
                    title="Vendas Hoje"
                    value="8"
                    icon={ShoppingCart}
                    trend="+4"
                    trendUp={true}
                    color="bg-blue-500"
                />
                <KPICard
                    title="Clientes Ativos"
                    value="142"
                    icon={Users}
                    trend="+8.2%"
                    trendUp={true}
                    color="bg-indigo-500"
                />
                <KPICard
                    title="Clientes Bloqueados"
                    value="3"
                    icon={UserX}
                    trend="-1"
                    trendUp={true} // Good that blocked went down/stable
                    color="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Crescimento de Vendas</h3>
                        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ver Relatório</button>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-l border-slate-200 pb-2 relative">
                        {/* Fake Chart Bars with Trend Line */}
                        {[40, 65, 45, 78, 55, 80, 95, 70, 85, 100, 90, 110].map((h, i) => (
                            <div key={i} className="w-full relative group">
                                <div
                                    className="bg-indigo-500/10 hover:bg-indigo-500/80 transition-colors w-full rounded-t-sm"
                                    style={{ height: `${h}%` }}
                                ></div>
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    R$ {h}k
                                </div>
                            </div>
                        ))}

                        {/* Fake overlay for a "line" feel */}
                        <TrendingUp className="absolute top-4 right-4 text-indigo-200 opacity-20" size={200} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
                        <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
                        <span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
                    </div>
                </div>

                {/* Quick Actions / Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Atividade Recente</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                    JS
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">João Silva</p>
                                    <p className="text-xs text-slate-500">Nova assinatura Premium</p>
                                </div>
                                <span className="ml-auto text-xs text-slate-400">2h atrás</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

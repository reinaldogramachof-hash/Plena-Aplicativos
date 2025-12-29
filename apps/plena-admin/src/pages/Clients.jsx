import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, MoreVertical, Shield, ShieldOff, CheckCircle, XCircle } from 'lucide-react';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for initial display if DB is empty, or fetch real data
    const fetchClients = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "clients"));
            const clientsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (clientsList.length > 0) {
                setClients(clientsList);
            } else {
                // Fallback mock data for demonstration if Firestore is empty
                setClients([
                    { id: '1', name: 'João Batista', email: 'joao@loja.com', product: 'Restaurante App', status: 'active', joined: '12/10/2025' },
                    { id: '2', name: 'Maria Oliveira', email: 'maria@salao.com', product: 'Beleza App', status: 'active', joined: '15/10/2025' },
                    { id: '3', name: 'Carlos Souza', email: 'carlos@mecanica.com', product: 'Oficina Pro', status: 'blocked', joined: '01/11/2025' },
                ]);
            }
        } catch (error) {
            console.error("Error fetching clients: ", error);
            // Fallback mock data on error (e.g. permission issues)
            setClients([
                { id: '1', name: 'João Batista', email: 'joao@loja.com', product: 'Restaurante App', status: 'active', joined: '12/10/2025' },
                { id: '2', name: 'Maria Oliveira', email: 'maria@salao.com', product: 'Beleza App', status: 'active', joined: '15/10/2025' },
                { id: '3', name: 'Carlos Souza', email: 'carlos@mecanica.com', product: 'Oficina Pro', status: 'blocked', joined: '01/11/2025' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const toggleStatus = async (client) => {
        const newStatus = client.status === 'active' ? 'blocked' : 'active';

        // Optimistic update
        setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));

        try {
            const clientRef = doc(db, 'clients', client.id);
            await updateDoc(clientRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            // Revert if failed
            // In production we would show a toast error
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Clientes (CRM)</h2>
                    <p className="text-slate-500">Gerencie o acesso e status dos assinantes.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Novo Cliente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Data Início</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-800">{client.name}</p>
                                            <p className="text-xs text-slate-400">{client.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded text-xs font-medium">
                                            {client.product}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {client.joined}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {client.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <CheckCircle size={14} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <XCircle size={14} /> Bloqueado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Toggle Switch Logic */}
                                            <button
                                                onClick={() => toggleStatus(client)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${client.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                                                    }`}
                                                title={client.status === 'active' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                                            >
                                                <span
                                                    className={`${client.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </button>

                                            <button className="text-slate-400 hover:text-indigo-600 p-1">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

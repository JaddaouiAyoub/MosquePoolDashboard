import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import {
    AlertTriangle,
    Send,
    X,
    ShieldAlert
} from 'lucide-react';

const ReportsManager = ({ userDetails }) => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState({});
    const [selectedReport, setSelectedReport] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (userDetails?.role === 'mosque_admin' && userDetails?.mosqueId) {
                docs = docs.filter(r => r.mosqueId === userDetails.mosqueId);
            }
            setReports(docs);
        });

        return unsubscribe;
    }, [userDetails]);

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                usersMap[doc.id] = `${data.firstName} ${data.lastName}`;
            });
            setUsers(usersMap);
        });
        return unsubUsers;
    }, []);

    const handleSendAlert = async (e) => {
        e.preventDefault();
        if (!selectedReport || !alertMessage.trim()) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'reports', selectedReport.id), {
                status: 'alerted',
                adminComment: alertMessage,
                respondedAt: new Date(),
                isRead: false
            });

            setSelectedReport(null);
            setAlertMessage('');
            alert('Alerte envoyée avec succès.');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'envoi de l\'alerte.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold">Signalements Utilisateurs</h1>
                <p className="text-slate-500">Gérez les alertes et les comportements signalés</p>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Signalé par</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Utilisateur visé</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Raison</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Date</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6 font-medium text-slate-700">{users[r.reporterId] || 'Inconnu'}</td>
                                <td className="px-8 py-6">
                                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                                        {users[r.reportedUserId] || 'Inconnu'}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-slate-600 max-w-xs truncate">{r.reason}</td>
                                <td className="px-8 py-6 text-slate-400 text-sm">{formatDate(r.createdAt)}</td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {r.status === 'alerted' ? (
                                            <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                                                Alerté ✅
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedReport(r)}
                                                className="opacity-0 group-hover:opacity-100 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <AlertTriangle size={16} />
                                                Alerter
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reports.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <ShieldAlert size={48} className="mx-auto text-slate-200" />
                        <p className="text-slate-400 font-medium">Aucun signalement en attente.</p>
                    </div>
                )}
            </div>

            {selectedReport && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Envoyer un avertissement</h2>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 hover:bg-white rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSendAlert} className="p-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Signalement original</p>
                                <p className="text-slate-700 italic">"{selectedReport.reason}"</p>
                                <p className="text-xs text-slate-400 mt-2">Cible: {users[selectedReport.reportedUserId]}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Message d'avertissement</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                                    placeholder="Expliquez à l'utilisateur pourquoi il reçoit cet avertissement..."
                                    value={alertMessage}
                                    onChange={(e) => setAlertMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Envoi...' : 'Envoyer l\'alerte'}
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsManager;

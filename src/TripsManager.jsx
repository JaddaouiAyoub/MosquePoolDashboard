import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Car, Trash2, Calendar, MapPin, User, Users } from 'lucide-react';

const TripsManager = ({ userDetails }) => {
    const [trips, setTrips] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (userDetails?.role === 'mosque_admin' && userDetails?.mosqueId) {
                docs = docs.filter(t => t.mosqueId === userDetails.mosqueId);
            }
            setTrips(docs);
        });
        return unsubscribe;
    }, [userDetails]);

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de trajet ? Cette action est irréversible.')) {
            await deleteDoc(doc(db, 'trips', id));
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Suivi des trajets</h1>
                    <p className="text-slate-500">Aperçu de tous les trajets et covoiturages actifs</p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Conducteur</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Itinéraire</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Heure</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Places</th>
                            <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {trips.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primaryGreen/10 flex items-center justify-center text-primaryGreen font-bold">
                                            {t.driverName ? t.driverName[0] : 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{t.driverName || 'Anonyme'}</p>
                                            <p className="text-xs text-slate-400">ID: {t.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            <span className="font-medium">{t.departurePoint}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-primaryGreen">
                                            <CheckCircle2 size={14} />
                                            <span>{t.mosqueName}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>{t.departureTime}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[...Array(Math.min(3, t.interestedUsers?.length || 0))].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">
                                            {t.seatsAvailable} restantes
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="opacity-0 group-hover:opacity-100 p-3 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {trips.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <Car size={48} className="mx-auto text-slate-200" />
                        <p className="text-slate-400 font-medium">Aucun trajet enregistré pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckCircle2 = ({ size }) => (
    <div style={{ width: size, height: size }} className="bg-primaryGreen rounded-full flex items-center justify-center p-0.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
);

export default TripsManager;

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, MapPin, X, Save } from 'lucide-react';

const MosquesManager = () => {
    const [mosques, setMosques] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '', lat: '', lng: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'mosques'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMosques(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                name: formData.name,
                address: formData.address,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng)
            };

            if (editingId) {
                await updateDoc(doc(db, 'mosques', editingId), data);
            } else {
                await addDoc(collection(db, 'mosques'), data);
            }
            setIsModalOpen(false);
            setFormData({ name: '', address: '', lat: '', lng: '' });
            setEditingId(null);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement de la mosquée');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mosquée ?')) {
            await deleteDoc(doc(db, 'mosques', id));
        }
    };

    const startEdit = (m) => {
        setEditingId(m.id);
        setFormData({ name: m.name, address: m.address, lat: m.lat.toString(), lng: m.lng.toString() });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des mosquées</h1>
                    <p className="text-slate-500">Gérer les lieux de prière disponibles</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ name: '', address: '', lat: '', lng: '' }); setIsModalOpen(true); }}
                    className="bg-primaryGreen text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nouvelle mosquée
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mosques.map((m) => (
                    <div key={m.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-primaryGreen/10 p-4 rounded-2xl text-primaryGreen">
                                <MapPin size={24} />
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(m)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primaryGreen">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{m.name}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{m.address}</p>
                        <div className="pt-4 border-t border-slate-50 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>LAT: {m.lat.toFixed(4)}</span>
                            <span>LNG: {m.lng.toFixed(4)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">{editingId ? 'Modifier la mosquée' : 'Ajouter une mosquée'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nom de la mosquée</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
                                    placeholder="e.g., Al-Farooq Mosque"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Adresse complète</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
                                    placeholder="123 Prayer Ave, City"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Latitude</label>
                                    <input
                                        type="number" step="any" required
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
                                        placeholder="21.4225"
                                        value={formData.lat}
                                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Longitude</label>
                                    <input
                                        type="number" step="any" required
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
                                        placeholder="39.8262"
                                        value={formData.lng}
                                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primaryGreen text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primaryGreen/20"
                            >
                                <Save size={20} />
                                {loading ? 'Enregistrement...' : 'Enregistrer la mosquée'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MosquesManager;

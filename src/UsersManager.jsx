import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { Users, Search, Trash2, Mail, Phone, Calendar, UserPlus, X } from 'lucide-react';
import { initializeApp, deleteApp} from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from './firebase';

const UsersManager = ({ userDetails }) => {
    const [users, setUsers] = useState([]);
    const [mosques, setMosques] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '', mosqueId: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (userDetails?.role === 'mosque_admin' && userDetails?.mosqueId) {
                docs = docs.filter(u => u.mosqueId === userDetails.mosqueId);
            }
            setUsers(docs);
            setLoading(false);
        });

        // Fetch mosques for the dropdown
        const fetchMosques = async () => {
            const mSnap = await getDocs(collection(db, 'mosques'));
            setMosques(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchMosques();

        return unsubscribe;
    }, [userDetails]);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            // Secondary app instance to avoid logging out current admin
            const secondaryConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            };
            const secondaryApp = initializeApp(secondaryConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                newAdmin.email,
                newAdmin.password
            );

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: newAdmin.email,
                role: 'mosque_admin',
                mosqueId: newAdmin.mosqueId,
                firstName: 'Mosque',
                lastName: 'Admin',
                createdAt: new Date(),
            });

            // Cleanup secondary app
            await deleteApp(secondaryApp);

            setShowAddModal(false);
            setNewAdmin({ email: '', password: '', mosqueId: '' });
            alert('Compte Mosque Admin créé avec succès !');
        } catch (err) {
            console.error(err);
            alert('Erreur: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            try {
                await deleteDoc(doc(db, 'users', userId));
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    const filteredUsers = users.filter(user =>
        (user.firstName?.toLowerCase() + ' ' + user.lastName?.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
                    <p className="text-slate-500">Visualiser et gérer les membres de la communauté</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {userDetails?.role === 'global_admin' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primaryGreen text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                        >
                            <UserPlus size={20} />
                            Ajouter un Admin
                        </button>
                    )}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Nouvel Admin Mosquée</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAdmin} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primaryGreen"
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primaryGreen"
                                    value={newAdmin.password}
                                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mosquée associée</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primaryGreen bg-white"
                                    value={newAdmin.mosqueId}
                                    onChange={e => setNewAdmin({ ...newAdmin, mosqueId: e.target.value })}
                                >
                                    <option value="">Sélectionner une mosquée</option>
                                    {mosques.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full bg-primaryGreen text-white py-4 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                            >
                                {isCreating ? 'Création...' : 'Créer le compte'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-primaryGreen/20 border-t-primaryGreen rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Utilisateur</th>
                                    <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Contact</th>
                                    <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Date d'inscription</th>
                                    <th className="px-8 py-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primaryGreen/10 group-hover:text-primaryGreen transition-colors">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail size={14} className="text-slate-400" />
                                                    <span>{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <span>{user.phone || 'Non renseigné'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span>{formatDate(user.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="opacity-0 group-hover:opacity-100 p-3 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                                                title="Supprimer l'utilisateur"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <Users size={48} className="mx-auto text-slate-200" />
                            <h3 className="text-xl font-bold text-slate-900">Aucun utilisateur trouvé</h3>
                            <p className="text-slate-400 font-medium">Essayez d'ajuster vos critères de recherche.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UsersManager;

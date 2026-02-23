import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  onSnapshot,
  where,
  query,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3,
  MapPin,
  Car,
  Users,
  LogOut,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

import MosquesManager from './MosquesManager';
import TripsManager from './TripsManager';
import UsersManager from './UsersManager';


// -------------------- LOGIN --------------------

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Identifiants invalides ou accès refusé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-primaryGreen p-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">LiftMosque</h1>
          <p className="text-white/70">Console d'Administration</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Adresse E-mail
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primaryGreen outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primaryGreen text-white py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Authentification...' : 'Se connecter'}
            <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};


// -------------------- DASHBOARD --------------------

const DashboardHome = ({ userDetails }) => {
  const [counts, setCounts] = useState({
    users: 0,
    trips: 0,
    mosques: 0
  });

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const tripsRef = collection(db, 'trips');
    const mosquesRef = collection(db, 'mosques');

    const usersQuery =
      userDetails?.role === 'mosque_admin' && userDetails?.mosqueId
        ? query(usersRef, where('mosqueId', '==', userDetails.mosqueId))
        : usersRef;

    const tripsQuery =
      userDetails?.role === 'mosque_admin' && userDetails?.mosqueId
        ? query(tripsRef, where('mosqueId', '==', userDetails.mosqueId))
        : tripsRef;

    const unsubUsers = onSnapshot(usersQuery, (snap) =>
      setCounts((c) => ({ ...c, users: snap.size }))
    );

    const unsubTrips = onSnapshot(tripsQuery, (snap) =>
      setCounts((c) => ({ ...c, trips: snap.size }))
    );

    const unsubMosques = onSnapshot(mosquesRef, (snap) =>
      setCounts((c) => ({ ...c, mosques: snap.size }))
    );

    return () => {
      unsubUsers();
      unsubTrips();
      unsubMosques();
    };
  }, [userDetails]);

  const stats = [
    {
      label: 'Utilisateurs totaux',
      value: counts.users,
      icon: <Users className="text-blue-600" />,
      trend: '+12%',
      color: 'bg-blue-50'
    },
    {
      label: 'Trajets actifs',
      value: counts.trips,
      icon: <Car className="text-emerald-600" />,
      trend: '+5%',
      color: 'bg-emerald-50'
    },
    {
      label: 'Mosquées totales',
      value: counts.mosques,
      icon: <MapPin className="text-orange-600" />,
      trend: 'Stable',
      color: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Vue d'ensemble du tableau de bord
        </h1>
        <p className="text-slate-500">
          Bon retour, Administrateur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`${s.color} p-4 rounded-2xl`}>
                {s.icon}
              </div>
              <div className="text-emerald-500 font-bold flex items-center gap-1 text-sm">
                <TrendingUp size={16} />
                {s.trend}
              </div>
            </div>

            <h3 className="text-slate-500 font-medium mb-1">
              {s.label}
            </h3>
            <p className="text-4xl font-bold">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};


// -------------------- LAYOUT --------------------

const MainLayout = ({ children, user }) => {
  const handleSignOut = () => signOut(auth);

  const menuItems = [
    { label: "Vue d'ensemble", icon: <BarChart3 size={20} />, path: '/' },
    { label: 'Mosquées', icon: <MapPin size={20} />, path: '/mosques' },
    { label: 'Trajets', icon: <Car size={20} />, path: '/trips' },
    { label: 'Utilisateurs', icon: <Users size={20} />, path: '/users' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0">
        <div className="p-10">
          <div className="flex items-center gap-3 text-primaryGreen mb-10">
            <div className="bg-primaryGreen p-2 rounded-xl text-white">
              <Car size={32} />
            </div>
            <span className="text-2xl font-black">
              LiftMosque Admin
            </span>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-600 font-bold hover:bg-primaryGreen hover:text-white transition-all"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10">
          <div className="bg-slate-50 p-6 rounded-3xl mb-6">
            <p className="text-xs text-slate-400 uppercase mb-2">
              Connected as
            </p>
            <p className="font-bold truncate">
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-80 flex-1 p-12">
        {children}
      </main>
    </div>
  );
};


// -------------------- APP ROOT --------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          setUserDetails({ role: 'global_admin' });
        }
      } else {
        setUserDetails(null);
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primaryGreen">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/*"
        element={
          user ? (
            <MainLayout user={user}>
              <Routes>
                <Route path="/" element={<DashboardHome userDetails={userDetails} />} />
                <Route path="/mosques" element={<MosquesManager userDetails={userDetails} />} />
                <Route path="/trips" element={<TripsManager userDetails={userDetails} />} />
                <Route path="/users" element={<UsersManager userDetails={userDetails} />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
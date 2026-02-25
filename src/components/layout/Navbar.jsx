import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogIn, LogOut, Mail, Lock, Loader2, X, MessageSquare, Hand } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function Navbar({ session, searchQuery, setSearchQuery }) {
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const modalRef = useRef(null);

    // Close modal on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                setShowAuthModal(false);
                resetForm();
            }
        };
        if (showAuthModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showAuthModal]);

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setError('');
        setSuccess('');
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // If Supabase returned a session directly, we're done
                if (data?.session) {
                    setShowAuthModal(false);
                    resetForm();
                    return;
                }

                // Otherwise, wait briefly then auto-sign-in
                await new Promise(resolve => setTimeout(resolve, 500));

                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!signInError) {
                    setShowAuthModal(false);
                    resetForm();
                } else {
                    setSuccess('Account created! Check your email to confirm, then sign in.');
                    setIsSignUp(false);
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setShowAuthModal(false);
                resetForm();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) setError(error.message);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifCount, setNotifCount] = useState(0);
    const notifRef = useRef(null);

    // Close notifications on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications (claims + comments on user's posts)
    const fetchNotifications = async () => {
        if (!session?.user?.id) return;

        try {
            // Get claims on user's posts
            const { data: claims } = await supabase
                .from('claims')
                .select('*, posts!inner(title, user_id), profiles:profiles!claims_claimer_id_fkey(full_name)')
                .eq('posts.user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            // Get comments on user's posts
            const { data: comments } = await supabase
                .from('comments')
                .select('*, posts!inner(title, user_id), profiles:profiles!comments_profiles_fk(full_name)')
                .eq('posts.user_id', session.user.id)
                .neq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            const allNotifs = [
                ...(claims || []).map(c => ({
                    id: 'claim-' + c.id,
                    type: 'claim',
                    text: `${c.profiles?.full_name || 'Someone'} responded to your post "${c.posts?.title}"`,
                    time: c.created_at,
                })),
                ...(comments || []).map(c => ({
                    id: 'comment-' + c.id,
                    type: 'comment',
                    text: `${c.profiles?.full_name || 'Someone'} commented on "${c.posts?.title}"`,
                    time: c.created_at,
                })),
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);

            setNotifications(allNotifs);
            setNotifCount(allNotifs.length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const toggleNotifications = () => {
        if (!showNotifications) fetchNotifications();
        setShowNotifications(!showNotifications);
    };

    // Handle search
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (window.location.pathname !== '/') {
            navigate('/');
        }
    };

    return (
        <>
            <nav className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 transition-all duration-300">
                <div className="glass-card rounded-2xl border border-slate-200 px-4 sm:px-6">
                    <div className="flex justify-between h-16 items-center">

                        {/* Logo & Main Nav */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center transition-all duration-300">
                                    <span className="text-white font-black text-xl">F</span>
                                </div>
                                <span className="font-extrabold text-2xl text-slate-800 tracking-tight">Findlyfy</span>
                            </Link>

                            <div className="hidden md:flex space-x-6">
                                <Link to="/" className="text-brand-600 font-bold hover:text-brand-700 transition">Home</Link>
                                <Link to="/post" className="text-slate-600 hover:text-slate-900 font-medium transition">Post</Link>
                                <Link to="/my-posts" className="text-slate-600 hover:text-slate-900 font-medium transition">Post History</Link>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-lg mx-8 hidden lg:block">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-100/50 border border-slate-200/60 rounded-xl leading-5 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                                    placeholder="Search for items, buildings..."
                                />
                            </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-4">
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={toggleNotifications}
                                    className="text-slate-500 hover:text-slate-700 relative p-2 transition"
                                >
                                    <Bell className="h-5 w-5" />
                                    {session && notifCount > 0 && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {!session ? (
                                                <p className="text-sm text-slate-400 text-center py-6">Sign in to see notifications</p>
                                            ) : notifications.length === 0 ? (
                                                <p className="text-sm text-slate-400 text-center py-6">No notifications yet</p>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div key={notif.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notif.type === 'claim' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'
                                                            }`}>
                                                            {notif.type === 'claim' ? <Hand className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-slate-700 leading-snug">{notif.text}</p>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                {formatDistanceToNow(new Date(notif.time), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {session ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-slate-500 hover:text-rose-600 transition"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                    <div className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 bg-white/50">
                                        <div className="h-8 w-8 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
                                            <User className="h-5 w-5 text-brand-600" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                            {session.user.email?.split('@')[0]}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center gap-2 p-2 px-5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 font-bold transition-all"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span>Sign In</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Auth Modal Overlay */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-up">
                    <div ref={modalRef} className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4 p-8 relative">
                        <button
                            onClick={() => { setShowAuthModal(false); resetForm(); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-white font-black text-2xl">F</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {isSignUp ? 'Sign up to start posting lost & found items' : 'Sign in to your Findlyfy account'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-medium">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@college.edu"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none text-sm text-slate-900 placeholder-slate-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none text-sm text-slate-900 placeholder-slate-400 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    isSignUp ? 'Create Account' : 'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-xs font-medium text-slate-400 uppercase">or</span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>

                        {/* Google Sign-In */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                                className="text-sm text-brand-600 hover:text-brand-700 font-semibold transition"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

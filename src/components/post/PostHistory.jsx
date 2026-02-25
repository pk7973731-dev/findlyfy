import { useState, useEffect } from 'react';
import { Loader2, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PostHistory({ session }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session?.user) return;

        const fetchMyPosts = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data || []);
            } catch (error) {
                console.error('Error fetching my posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyPosts();
    }, [session]);

    const handleDelete = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const handleToggleStatus = async (postId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'resolved' : 'active';
        try {
            const { error } = await supabase
                .from('posts')
                .update({ status: newStatus })
                .eq('id', postId);

            if (error) throw error;
            setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                <p className="font-medium">Loading your posts...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full mx-auto space-y-6 animate-fade-up">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                    Post History
                </h1>
                <p className="text-slate-500 text-sm">
                    Manage all the items you've posted.
                </p>
            </div>

            {posts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No posts yet</h3>
                    <p>You haven't posted any lost or found items.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
                            {/* Image thumbnail */}
                            {post.image_url && (
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                                />
                            )}

                            {/* Post info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${post.type === 'lost'
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {post.type}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${post.status === 'active'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {post.status}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 truncate">{post.title}</h3>
                                <p className="text-sm text-slate-500 truncate">{post.location} • {post.category}</p>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(post.created_at)}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleToggleStatus(post.id, post.status)}
                                    className={`p-2 rounded-lg transition-colors ${post.status === 'active'
                                            ? 'text-emerald-600 hover:bg-emerald-50'
                                            : 'text-slate-400 hover:bg-slate-50'
                                        }`}
                                    title={post.status === 'active' ? 'Mark as Resolved' : 'Reopen'}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete post"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

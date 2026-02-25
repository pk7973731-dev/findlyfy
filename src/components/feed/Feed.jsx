import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PostCard from './PostCard';

export default function Feed({ activeCategory = 'all', session }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, profiles(full_name, avatar_url)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data || []);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();

        // Listen for real-time insert/update/delete on posts table
        const channel = supabase.channel('feed-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const filteredPosts = activeCategory === 'all'
        ? posts
        : posts.filter(post => post.category === activeCategory);

    return (
        <div className="flex-1 w-full mx-auto space-y-6 animate-fade-up">

            {/* Clean Professional Header */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        Campus Feed
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Find lost items or return found belongings to the community.
                    </p>
                </div>

                {/* Filters */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/60 self-start sm:self-auto">
                    <button className="px-4 py-1.5 rounded-md bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/50 text-sm transition-all">
                        All
                    </button>
                    <button className="px-4 py-1.5 rounded-md text-slate-600 hover:text-slate-900 font-medium text-sm transition-all hover:bg-slate-200/50">
                        Lost
                    </button>
                    <button className="px-4 py-1.5 rounded-md text-slate-600 hover:text-slate-900 font-medium text-sm transition-all hover:bg-slate-200/50">
                        Found
                    </button>
                </div>
            </div>

            {/* Post List */}
            <div className="space-y-6 flex flex-col pb-24">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                        <p className="font-medium">Loading campus feed...</p>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={session?.user?.id}
                        />
                    ))
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No items found</h3>
                        <p>We couldn't find any items matching this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

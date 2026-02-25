import { useState, useEffect } from 'react';
import { Link as LinkIcon, AlertCircle, MessageSquare, Send, CheckCircle2, Loader2, Hand, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';

export default function PostCard({ post, currentUserId }) {
    const isOwner = currentUserId === post.user_id;
    const [claimed, setClaimed] = useState(false);
    const [claimCount, setClaimCount] = useState(0);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comment_count || 0);

    const getAvatarFallback = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // Check if user already claimed this post on load
    useEffect(() => {
        if (!currentUserId || isOwner) return;

        const checkExistingClaim = async () => {
            try {
                // Check if current user already claimed
                const { data: myClaim } = await supabase
                    .from('claims')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('claimer_id', currentUserId)
                    .maybeSingle();

                if (myClaim) setClaimed(true);

                // Get total claim count
                const { count } = await supabase
                    .from('claims')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                setClaimCount(count || 0);

                // Get comment count
                const { count: cCount } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                setCommentCount(cCount || 0);
            } catch (error) {
                console.error('Error checking claim status:', error);
            }
        };

        checkExistingClaim();
    }, [currentUserId, post.id, isOwner]);

    // Handle "I Found This" / "This is Mine" claim
    const handleClaim = async () => {
        if (!currentUserId) return alert('Please sign in first!');
        if (claimed) return; // Already claimed

        try {
            const { error } = await supabase
                .from('claims')
                .insert({
                    post_id: post.id,
                    claimer_id: currentUserId,
                    message: post.type === 'lost'
                        ? 'I found this item!'
                        : 'This is my item!',
                });

            if (error) {
                if (error.code === '23505') {
                    setClaimed(true); // Already claimed, just update UI
                    return;
                }
                throw error;
            }

            setClaimed(true);
            setClaimCount(prev => prev + 1);
        } catch (error) {
            console.error('Error submitting claim:', error);
            alert('Failed to submit claim. Please try again.');
        }
    };

    // Copy link to clipboard
    const handleCopyLink = async () => {
        const url = `${window.location.origin}/?post=${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    // Load comments
    const loadComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }

        setShowComments(true);
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, profiles:profiles!comments_profiles_fk(full_name, avatar_url)')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    // Post a comment
    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId) return;

        setPostingComment(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: post.id,
                    user_id: currentUserId,
                    content: newComment.trim(),
                })
                .select('*, profiles:profiles!comments_profiles_fk(full_name, avatar_url)')
                .single();

            if (error) throw error;
            setComments([...comments, data]);
            setNewComment('');
            setCommentCount(prev => prev + 1);
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment.');
        } finally {
            setPostingComment(false);
        }
    };

    return (
        <div className="glass-card rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">

            {/* Image if available */}
            {post.image_url && (
                <div className="relative h-64 w-full bg-slate-100">
                    <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${post.type === 'lost'
                            ? 'bg-rose-500/90 text-white border border-rose-400/50 shadow-rose-500/30'
                            : 'bg-emerald-500/90 text-white border border-emerald-400/50 shadow-emerald-500/30'
                            }`}>
                            {post.type} ITEM
                        </span>
                    </div>
                </div>
            )}

            <div className="p-5 sm:p-6">
                {/* Header without image */}
                {!post.image_url && (
                    <div className="mb-5">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md inline-block ${post.type === 'lost'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                            {post.type} ITEM
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                        {post.type === 'lost' ? 'Lost' : 'Found'}: {post.title}
                    </h2>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(post.created_at || new Date()), { addSuffix: true })}
                    </span>
                </div>

                {/* Location */}
                {post.location && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{post.location}</span>
                    </div>
                )}

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {post.description}
                </p>

                {/* Footer — User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                        {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-medium text-slate-500">
                                {getAvatarFallback(post.profiles?.full_name)}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                        {post.profiles?.full_name || 'Anonymous User'}
                    </span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-3 gap-2">

                    {/* Claim Button — I Found This / This is Mine */}
                    {!isOwner && (
                        <button
                            onClick={handleClaim}
                            disabled={claimed}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${claimed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : post.type === 'lost'
                                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/20 hover:-translate-y-0.5'
                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5'
                                }`}
                        >
                            {claimed ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{post.type === 'lost' ? 'Reported Found' : 'Claimed'}</span>
                                    {claimCount > 0 && <span className="text-xs opacity-75">({claimCount})</span>}
                                </>
                            ) : (
                                <>
                                    {post.type === 'lost' ? <Hand className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                    <span>{post.type === 'lost' ? 'I Found This!' : 'This is Mine!'}</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Owner sees claim count */}
                    {isOwner && claimCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold flex-1 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            {claimCount} {claimCount === 1 ? 'person' : 'people'} responded
                        </div>
                    )}

                    {/* Comment Button */}
                    <button
                        onClick={loadComments}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showComments
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>{commentCount > 0 ? commentCount : ''}</span>
                    </button>

                    {/* Share / Copy Link Button */}
                    <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${linkCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                            }`}
                    >
                        {linkCopied ? (
                            <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                        ) : (
                            <><LinkIcon className="w-4 h-4" /> Share</>
                        )}
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                        {loadingComments ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <>
                                {/* Comment list */}
                                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first!</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="flex gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-medium text-slate-500">
                                                    {getAvatarFallback(comment.profiles?.full_name)}
                                                </div>
                                                <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-semibold text-slate-800">
                                                            {comment.profiles?.full_name || 'Anonymous'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Comment input */}
                                {currentUserId ? (
                                    <form onSubmit={handlePostComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim() || postingComment}
                                            className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {postingComment ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <p className="text-sm text-slate-400 text-center">Sign in to comment</p>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

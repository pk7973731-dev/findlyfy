import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/layout/Navbar';
import Feed from './components/feed/Feed';
import CreatePostForm from './components/post/CreatePostForm';
import PostHistory from './components/post/PostHistory';

function App() {
  const [session, setSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-400/10 blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-accent-400/10 blur-[120px] -z-10 pointer-events-none"></div>

        <Navbar session={session} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
          <Routes>
            <Route path="/" element={<Feed session={session} searchQuery={searchQuery} />} />
            <Route
              path="/post"
              element={session ? <CreatePostForm session={session} /> : <Navigate to="/" />}
            />
            <Route
              path="/my-posts"
              element={session ? <PostHistory session={session} /> : <Navigate to="/" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

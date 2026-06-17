import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export function AuthView() {
  const [isLogin, setIsLogin] = useState(false); // Sign up view first
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emailForAuth = username.includes('@')
        ? username.trim()
        : `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@littlecorner.app`;
        
      if (isLogin) {
        await signInWithEmailAndPassword(auth, emailForAuth, password);
      } else {
        await createUserWithEmailAndPassword(auth, emailForAuth, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect username or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This cute username or email is already taken. Try another!');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8f2] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_100%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border-2 border-[#d8b792] p-8 rounded-2xl shadow-xl relative z-10"
      >
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-[#8c5737] rounded-full flex items-center justify-center mb-4 shadow-sm border-2 border-[#61361c]">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-script text-4xl text-[#4d2b18]">Little Corner</h1>
          <p className="font-sans text-sm text-[#4d2b18]/60 mt-1">
            {isLogin ? 'Welcome back to your space' : 'Create your cozy corner'}
          </p>
        </div>

        {/* Happy Highlight Banner about No Email Needed */}
        {!isLogin && (
          <div className="bg-[#f2faf0] text-[#426b38] text-xs font-sans p-3.5 rounded-xl mb-5 border border-[#a0cc94]/40 flex gap-2.5 items-start">
            <span className="text-base select-none leading-none mt-0.5">🌱</span>
            <div className="leading-relaxed">
              <span className="font-bold">No Email Required!</span> You do <span className="underline">not</span> need to use a real email address! Just pick a cute username of your choice (like <code className="bg-[#e4eedf] px-1 rounded font-mono font-bold text-[#35572c]">cozycat</code>) to sign up instantly!
            </div>
          </div>
        )}

        {isLogin && (
          <div className="bg-[#faf6ee] text-[#8c5737] text-xs font-sans p-3 rounded-xl mb-5 border border-[#ebd3b2]/60 flex gap-2.5 items-start">
            <span className="text-sm select-none">✨</span>
            <div className="leading-relaxed">
              Login with the username or email you registered with.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-sans text-xs sm:text-sm font-bold text-[#4d2b18] mb-1">
              {isLogin ? 'Username or Email' : 'Choose a Username (No Email Needed!)'}
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#fdfaf3] border-2 border-[#d8b792] rounded-lg px-4 py-2 font-sans focus:outline-none focus:border-[#4d2b18] transition-colors text-wood-dark"
              placeholder={isLogin ? "e.g. cozycat or user@example.com" : "e.g. cozycat, sweetbunny, or similar..."}
            />
            {!isLogin && (
              <p className="text-[10px] text-[#4d2b18]/50 font-sans mt-1">
                Letters and numbers only. No spaces needed!
              </p>
            )}
          </div>
          <div>
            <label className="block font-sans text-xs sm:text-sm font-bold text-[#4d2b18] mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#fdfaf3] border-2 border-[#d8b792] rounded-lg px-4 py-2 font-sans focus:outline-none focus:border-[#4d2b18] transition-colors text-wood-dark"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#8c5737] hover:bg-[#61361c] text-white font-bold font-sans py-3 rounded-lg mt-2 transition-all disabled:opacity-50 active:scale-98 shadow-sm"
          >
            {loading ? '...' : (isLogin ? 'Sign In to My Desk' : 'Create My Cozy Corner 🌱')}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d8b792]/50"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-[#4d2b18]/60 font-sans">Or continue with</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-[#4d2b18] font-bold font-sans py-3 rounded-lg border-2 border-[#d8b792] hover:bg-[#fdfaf3] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.17-.63-.17-1.37-.17-5.5.84-2.6 3.27-4.53 6.16-4.53 1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-sans text-sm text-[#8c5737] hover:underline font-bold"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

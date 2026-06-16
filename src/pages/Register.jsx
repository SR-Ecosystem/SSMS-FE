import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight, Sparkles, Code2, Layers } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('student'); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      navigate('/student'); // Redirect to student dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
      {/* LEFT PANEL - Decorative/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden isolate">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 opacity-90 mix-blend-multiply animate-gradient-slow"></div>
        
        {/* Abstract Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        {/* Branding Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 lg:p-20 text-white">
          <div className="flex items-center gap-3 animate-fade-in-down">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <Code2 size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">SSMS Platform</span>
          </div>

          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight">
              Start your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-indigo-200">
                coding journey.
              </span>
            </h1>
            <p className="text-lg text-indigo-100 max-w-md font-medium leading-relaxed">
              Join the ultimate learning management system designed for aspiring developers. Track tasks, complete quizzes, and climb the leaderboard.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <Layers className="text-teal-300" size={24} />
                <span className="font-semibold text-sm">Interactive Batches</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <Sparkles className="text-amber-300" size={24} />
                <span className="font-semibold text-sm">Gamified Learning</span>
              </div>
            </div>
          </div>
          
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-indigo-200/80">© {new Date().getFullYear()} SSMS. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        
        {/* Subtle background element for mobile */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-950"></div>

        <div className="w-full max-w-md relative z-10 animate-slide-up-fade">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Code2 size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">SSMS Platform</span>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Create Account</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Please enter your details to sign up.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-start gap-3 border border-rose-100 dark:border-rose-900/50 animate-shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-4 rounded-2xl text-base font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 hover:underline underline-offset-4 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Register;

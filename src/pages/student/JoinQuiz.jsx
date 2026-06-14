import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

const JoinQuiz = () => {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (pin.length !== 6) {
      return Swal.fire('Error', 'Please enter a valid 6-digit PIN', 'error');
    }
    navigate(`/student/play-live-quiz/${pin}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-teal-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="glass-panel w-full max-w-md p-10 relative z-10 flex flex-col items-center text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-emerald-200 dark:border-emerald-700/30">
          <Gamepad2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">Play Live Quiz</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Enter the 6-digit Game PIN provided by your instructor to join the session.</p>
        
        <form onSubmit={handleJoin} className="w-full space-y-6">
          <input
            type="text"
            className="w-full px-6 py-5 text-center text-4xl font-black tracking-[0.2em] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all dark:text-white shadow-inner uppercase"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
          
          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xl font-black rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 dark:shadow-white/20"
          >
            Enter Game <ArrowRight strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinQuiz;

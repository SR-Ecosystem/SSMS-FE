import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Send, Loader2, Hash, Users } from 'lucide-react';
import Loader from '../components/Loader';

const BatchChat = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Fetch Batches
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const { data } = await axios.get(user.role === 'admin' ? '/batches' : '/enrollments/my');
        const batchList = user.role === 'admin' ? data : data.map(e => e.batchId).filter(Boolean);
        setBatches(batchList);
        
        if (batchList.length > 0) {
          setActiveBatchId(batchList[0]._id);
        }
      } catch (error) {
        console.error('Error fetching batches for chat:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [user.role]);

  // 2. Socket Connection & Room Management
  useEffect(() => {
    if (!activeBatchId) return;

    // Connect to Socket
    socketRef.current = io(import.meta.env.VITE_API_URL || 'https://ssms-be.onrender.com', { withCredentials: true });
    const socket = socketRef.current;

    // Fetch message history for the active batch
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`/chat/${activeBatchId}`);
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      }
    };

    socket.on('connect', () => {
      socket.emit('join-batch-chat', activeBatchId);
      fetchHistory();
    });

    socket.on('chat-message-received', (msg) => {
      if (msg.batchId === activeBatchId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });

    return () => {
      socket.emit('leave-batch-chat', activeBatchId);
      socket.disconnect();
    };
  }, [activeBatchId]);



  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeBatchId || !socketRef.current) return;

    socketRef.current.emit('send-chat-message', {
      batchId: activeBatchId,
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      text: newMessage.trim()
    });

    setNewMessage('');
  };

  if (loading) return <Loader />;

  return (
    <div className="flex h-[calc(100vh-80px)] max-h-[850px] bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
      
      {/* Sidebar: Batch List */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-emerald-500" /> My Groups
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {batches.map(batch => (
            <button
              key={batch._id}
              onClick={() => setActiveBatchId(batch._id)}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${
                activeBatchId === batch._id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                activeBatchId === batch._id ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                <Hash size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{batch.batchName}</p>
                <p className={`text-sm truncate ${activeBatchId === batch._id ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-500'}`}>
                  {user.role === 'admin' ? 'Admin Access' : 'Joined'}
                </p>
              </div>
            </button>
          ))}
          {batches.length === 0 && (
            <p className="text-center text-slate-500 dark:text-slate-400 mt-8 font-medium">No batches available.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeBatchId ? (
        <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a]">
          {/* Chat Header */}
          <div className="h-20 px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-4">
              <Hash size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {batches.find(b => b._id === activeBatchId)?.batchName}
              </h3>
              <p className="text-sm text-emerald-500 font-medium">Group Chat</p>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundBlendMode: 'overlay' }}>
            {messages.map((msg, idx) => {
              const isMe = msg.senderId._id === user._id;
              const isAdmin = msg.senderId.role === 'admin';
              
              // Only show sender name if it's not me, and it's the first message in a cluster
              const showName = !isMe && (idx === 0 || messages[idx-1].senderId._id !== msg.senderId._id);

              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    
                    {showName && (
                      <span className={`text-xs font-bold mb-1 ml-1 ${isAdmin ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {msg.senderId.name} {isAdmin && ' (Admin)'}
                      </span>
                    )}
                    
                    <div className={`px-5 py-3 rounded-2xl shadow-sm relative ${
                      isMe 
                        ? 'bg-emerald-500 text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    }`}>
                      <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                      
                      <div className={`text-[10px] text-right mt-1 font-medium ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-all shadow-inner"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/30 shrink-0"
              >
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a]">
          <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Users className="w-16 h-16 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Batch Chat</h2>
          <p className="text-slate-500 mt-2">Select a batch from the sidebar to start messaging.</p>
        </div>
      )}
    </div>
  );
};

export default BatchChat;

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { 
  Server, Network, Cpu, Zap, Activity, Shield, PlusCircle, 
  Trash2, RefreshCw, Check, AlertTriangle, Settings, Power, 
  Copy, CheckCircle2, Globe, Clock, Sparkles
} from 'lucide-react';

const TrafficManagement = () => {
  const { trafficConfig, refreshTrafficConfig } = useAuth();
  const [servers, setServers] = useState([]);
  const [policy, setPolicy] = useState('failover');
  const [manualSelectedServerId, setManualSelectedServerId] = useState('');
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingBrowserPing, setIsTestingBrowserPing] = useState(false);

  // New server modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerActive, setNewServerActive] = useState(true);
  const [isAddingServer, setIsAddingServer] = useState(false);

  // Browser latency stats
  const [browserLatencies, setBrowserLatencies] = useState({});

  const fetchConfigAndServers = async () => {
    setIsRefreshing(true);
    try {
      const [serversRes, configRes] = await Promise.all([
        axios.get('/traffic/servers'),
        axios.get('/traffic/config')
      ]);
      setServers(serversRes.data);
      setPolicy(configRes.data.policy);
      setManualSelectedServerId(configRes.data.manualSelectedServerId || '');
    } catch (err) {
      console.error('Failed to load traffic config', err);
      Swal.fire({
        icon: 'error',
        title: 'Fetch Failed',
        text: err.response?.data?.message || 'Could not fetch traffic configurations.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConfigAndServers();
  }, []);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await axios.post('/traffic/config', {
        policy,
        manualSelectedServerId: policy === 'manual' ? manualSelectedServerId : null
      });
      await refreshTrafficConfig();
      await fetchConfigAndServers();
      Swal.fire({
        icon: 'success',
        title: 'Configuration Saved',
        text: 'Traffic routing policy has been successfully updated.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to update traffic configuration.'
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleToggleServer = async (server) => {
    if (server.isPrimary && server.isActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Action Denied',
        text: 'The primary backend server node cannot be deactivated.'
      });
      return;
    }
    
    try {
      await axios.put(`/traffic/servers/${server._id}`, {
        isActive: !server.isActive
      });
      setServers(prev => prev.map(s => s._id === server._id ? { ...s, isActive: !s.isActive } : s));
      await refreshTrafficConfig();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Toggle Failed',
        text: err.response?.data?.message || 'Failed to update server status.'
      });
    }
  };

  const handleDeleteServer = async (server) => {
    if (server.isPrimary) {
      Swal.fire({
        icon: 'warning',
        title: 'Action Denied',
        text: 'The primary backend server node cannot be deleted.'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will remove the backend server link "${server.name}" from rotation.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/traffic/servers/${server._id}`);
        setServers(prev => prev.filter(s => s._id !== server._id));
        await refreshTrafficConfig();
        Swal.fire('Deleted!', 'Server link has been removed.', 'success');
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to delete server.', 'error');
      }
    }
  };

  const handleAddServer = async (e) => {
    e.preventDefault();
    if (!newServerName.trim() || !newServerUrl.trim()) {
      Swal.fire('Validation Error', 'Please fill in all fields.', 'warning');
      return;
    }

    setIsAddingServer(true);
    try {
      const { data } = await axios.post('/traffic/servers', {
        name: newServerName,
        url: newServerUrl,
        isActive: newServerActive
      });
      setServers(prev => [...prev, data]);
      setShowAddModal(false);
      setNewServerName('');
      setNewServerUrl('');
      await refreshTrafficConfig();
      Swal.fire('Success', 'Backend server node added to traffic manager.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to register server.', 'error');
    } finally {
      setIsAddingServer(false);
    }
  };

  // Run backend-based ping check
  const handleBackendPing = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await axios.post('/ping');
      setServers(prev => prev.map(s => {
        const pingResult = data.find(p => p.id === s._id);
        if (pingResult) {
          return { ...s, status: pingResult.status, responseTime: pingResult.responseTime };
        }
        return s;
      }));
      await refreshTrafficConfig();
      Swal.fire({
        icon: 'success',
        title: 'Backend Health Check Complete',
        text: 'All backend server latencies have been refreshed.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run browser-based ping check
  const handleBrowserPing = async () => {
    setIsTestingBrowserPing(true);
    const activeServers = servers.filter(s => s.isActive);
    const results = {};

    for (const server of activeServers) {
      results[server._id] = 'checking';
      setBrowserLatencies({ ...results });
      
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
        
        // Ping simple public route
        await fetch(`${server.url}/api/traffic/public-config`, { 
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        const latency = Date.now() - start;
        results[server._id] = latency;
      } catch (err) {
        console.error(`Browser ping to ${server.name} failed:`, err);
        results[server._id] = 'offline';
      }
      setBrowserLatencies({ ...results });
    }
    setIsTestingBrowserPing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Copied',
      text: 'Server URL copied to clipboard',
      timer: 1000,
      showConfirmButton: false
    });
  };

  // Helper stats calculation
  const onlineCount = servers.filter(s => s.status === 'online').length;
  const offlineCount = servers.filter(s => s.status === 'offline').length;
  const activeCount = servers.filter(s => s.isActive).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 dark:bg-black/20 p-6 rounded-2xl border border-slate-200/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Network size={24} />
            </span>
            <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">Traffic Control Panel</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Register multiple backend nodes to implement high-availability clusters. Manage request distribution policies and test latency metrics directly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleBrowserPing} 
            disabled={isTestingBrowserPing || servers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white border border-sky-500/20 rounded-xl transition-all font-medium disabled:opacity-50 text-sm"
          >
            <Clock size={16} className={isTestingBrowserPing ? 'animate-spin' : ''} />
            Browser Latency Check
          </button>
          <button 
            onClick={handleBackendPing} 
            disabled={isRefreshing || servers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl transition-all font-medium disabled:opacity-50 text-sm"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Scan Node Health
          </button>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-medium text-sm"
          >
            <PlusCircle size={16} />
            Add Server URL
          </button>
        </div>
      </div>

      {/* Grid of status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all text-emerald-500">
            <Server size={64} />
          </div>
          <h3 className="text-slate-400 text-sm font-semibold">Total Nodes</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black dark:text-white">{servers.length}</span>
            <span className="text-slate-500 text-xs">{activeCount} active in rotation</span>
          </div>
        </div>

        <div className="bg-slate-900/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all text-emerald-400">
            <Activity size={64} />
          </div>
          <h3 className="text-slate-400 text-sm font-semibold">Online Nodes</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-500">{onlineCount}</span>
            <span className="text-slate-500 text-xs">responding successfully</span>
          </div>
        </div>

        <div className="bg-slate-900/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all text-rose-500">
            <AlertTriangle size={64} />
          </div>
          <h3 className="text-slate-400 text-sm font-semibold">Offline Nodes</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-rose-500">{offlineCount}</span>
            <span className="text-slate-500 text-xs">failed status scan</span>
          </div>
        </div>

        <div className="bg-slate-900/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all text-violet-500">
            <Shield size={64} />
          </div>
          <h3 className="text-slate-400 text-sm font-semibold">Cluster Health</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black ${onlineCount === servers.length && servers.length > 0 ? 'text-emerald-500' : onlineCount > 0 ? 'text-amber-500' : 'text-rose-500'}`}>
              {onlineCount === servers.length && servers.length > 0 ? 'Optimal' : onlineCount > 0 ? 'Degraded' : 'Critical'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config Panel */}
        <div className="lg:col-span-1 bg-slate-900/40 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-200/10 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200/10 pb-4">
            <Settings className="text-emerald-500" size={20} />
            <h2 className="text-xl font-bold dark:text-white">Routing Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Load Balancing Policy</label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {[
                  { id: 'failover', title: 'Active-Backup Failover', desc: 'Directs all traffic to the primary server; fallbacks to secondary backup servers if offline.' },
                  { id: 'round-robin', title: 'Round-Robin Rotation', desc: 'Distributes incoming API requests uniformly across all active nodes.' },
                  { id: 'latency', title: 'Latency-Optimized', desc: 'Routes requests to the node with the lowest connection response time.' },
                  { id: 'manual', title: 'Static Node Assign', desc: 'Manually pin all requests to a selected server node.' }
                ].map(opt => (
                  <div 
                    key={opt.id}
                    onClick={() => setPolicy(opt.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${policy === opt.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/5' : 'bg-slate-900/30 border-slate-200/5 hover:border-slate-200/10'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold dark:text-white text-sm">{opt.title}</span>
                      {policy === opt.id && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {policy === 'manual' && (
              <div className="pt-2 animate-fadeIn">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Assign Active Server</label>
                <select 
                  className="w-full bg-slate-900/50 border border-slate-200/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-emerald-500 transition-all mt-2"
                  value={manualSelectedServerId}
                  onChange={e => setManualSelectedServerId(e.target.value)}
                >
                  <option value="">Select a server node...</option>
                  {servers.filter(s => s.isActive).map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.url})</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={handleSaveConfig}
              disabled={isSavingConfig || (policy === 'manual' && !manualSelectedServerId)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/10"
            >
              {isSavingConfig ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
              Apply Routing Rules
            </button>
          </div>
        </div>

        {/* Right Column: Servers List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-200/10 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-200/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Server className="text-emerald-500" size={20} />
                <h2 className="text-xl font-bold dark:text-white">Backend Cluster Nodes</h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-200/5">
                {servers.length} Registered
              </span>
            </div>

            {servers.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="flex justify-center text-slate-600">
                  <Server size={48} />
                </div>
                <h4 className="text-slate-400 font-bold">No Backend Nodes Registered</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">Add secondary backend server links to construct a load balanced network.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {servers.map(server => {
                  const browserLatency = browserLatencies[server._id];
                  
                  return (
                    <div 
                      key={server._id} 
                      className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                        !server.isActive 
                          ? 'bg-slate-950/20 border-slate-200/5 opacity-60' 
                          : server.status === 'online' 
                            ? 'bg-slate-900/30 border-slate-200/10 hover:border-emerald-500/20' 
                            : 'bg-rose-500/5 border-rose-500/10'
                      }`}
                    >
                      {/* Latency glow effect */}
                      {server.isActive && server.status === 'online' && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                      )}

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold dark:text-white text-base">{server.name}</h4>
                            
                            {server.isPrimary && (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1">
                                <Sparkles size={8} /> Primary Node
                              </span>
                            )}
                            
                            {!server.isActive && (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-md">
                                Offline (Bypassed)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                            <code className="bg-slate-950/40 px-2 py-1 rounded text-slate-300 border border-slate-200/5 font-mono select-all">
                              {server.url}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(server.url)} 
                              className="p-1 hover:text-emerald-500 rounded transition-all" 
                              title="Copy URL"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Status elements */}
                        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                          {server.isActive && (
                            <div className="flex items-center gap-4">
                              {/* Backend health status */}
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">Node Status</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-emerald-500 animate-pulse' : server.status === 'offline' ? 'bg-rose-500' : 'bg-slate-600'}`} />
                                  <span className={`text-xs font-bold capitalize ${server.status === 'online' ? 'text-emerald-500' : server.status === 'offline' ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {server.status}
                                  </span>
                                </div>
                              </div>

                              {/* Backend latency status */}
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">Node Latency</span>
                                <span className={`text-xs font-bold mt-1 ${server.responseTime < 120 && server.responseTime > 0 ? 'text-emerald-400' : server.responseTime < 300 && server.responseTime > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {server.status === 'online' ? `${server.responseTime}ms` : '---'}
                                </span>
                              </div>

                              {/* Browser ping status */}
                              <div className="flex flex-col items-end bg-slate-900/60 border border-slate-200/5 px-2.5 py-1 rounded-xl">
                                <span className="text-[9px] text-slate-500 uppercase font-semibold">Browser Latency</span>
                                <span className="text-[11px] font-bold text-sky-400">
                                  {browserLatency === 'checking' ? (
                                    <Clock size={11} className="animate-spin text-sky-400 mt-1" />
                                  ) : browserLatency === 'offline' ? (
                                    <span className="text-rose-500">Offline</span>
                                  ) : browserLatency !== undefined ? (
                                    `${browserLatency}ms`
                                  ) : (
                                    'Not Checked'
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action tools */}
                          <div className="flex items-center gap-2 border-l border-slate-200/10 pl-4">
                            <button 
                              onClick={() => handleToggleServer(server)}
                              disabled={server.isPrimary}
                              className={`p-2 rounded-xl transition-all border ${
                                server.isActive 
                                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-500/20' 
                                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border-slate-700'
                              } disabled:opacity-40`}
                              title={server.isActive ? 'Bypass / Deactivate Server' : 'Include / Activate Server'}
                            >
                              <Power size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteServer(server)}
                              disabled={server.isPrimary}
                              className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all disabled:opacity-40"
                              title="Delete Server Link"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 dark:bg-slate-950 border border-slate-200/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200/10 pb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="text-emerald-500" size={22} />
                <h3 className="text-xl font-bold dark:text-white">Register Backend Server</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddServer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Server Friendly Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Asia-East Backup Server"
                  className="w-full bg-slate-950 border border-slate-200/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-medium text-sm"
                  value={newServerName}
                  onChange={e => setNewServerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Base HTTP URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="e.g. http://localhost:5021 or https://api.my-cluster.com"
                  className="w-full bg-slate-950 border border-slate-200/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                  value={newServerUrl}
                  onChange={e => setNewServerUrl(e.target.value)}
                />
                <p className="text-[10px] text-slate-500 mt-1">Include protocol (http/https) and port. Ensure no trailing slash.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="active_check" 
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  checked={newServerActive}
                  onChange={e => setNewServerActive(e.target.checked)}
                />
                <label htmlFor="active_check" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Activate server immediately (include in traffic rotation)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isAddingServer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/10 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  {isAddingServer ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficManagement;

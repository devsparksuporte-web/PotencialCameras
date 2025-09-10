import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useCameras } from "@/react-app/hooks/useCameras";
import { Camera, CameraFormData, Channels } from "@/shared/types";

export default function MonitoringDashboard() {
  const { cameras, loading, error, addCamera, updateCamera, deleteCamera } = useCameras();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("Todas");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [modalChannelsFor, setModalChannelsFor] = useState<Camera | null>(null);

  // derived metrics
  const metrics = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter((c) => c.status === "online").length;
    const offline = cameras.filter((c) => c.status === "offline").length;
    const aviso = cameras.filter((c) => c.status === "aviso").length;
    const reparo = cameras.filter((c) => c.status === "reparo").length;
    const erro = cameras.filter((c) => c.status === "erro").length;
    const channels = cameras.reduce(
      (acc, c) => {
        acc.total += c.channels_total;
        acc.working += c.channels_working;
        acc.blackscreen += c.channels_blackscreen;
        return acc;
      },
      { total: 0, working: 0, blackscreen: 0 }
    );
    return { total, online, offline, aviso, reparo, erro, channels };
  }, [cameras]);

  const stores = useMemo(() => ["Todas", ...new Set(cameras.map((c) => c.store))], [cameras]);

  const filtered = useMemo(() => {
    return cameras.filter((c) => {
      // Apply active filter from dashboard cards
      if (activeFilter !== "all") {
        if (activeFilter === "online" && c.status !== "online") return false;
        if (activeFilter === "offline" && c.status !== "offline") return false;
        if (activeFilter === "aviso" && c.status !== "aviso") return false;
        if (activeFilter === "reparo" && c.status !== "reparo") return false;
        if (activeFilter === "erro" && c.status !== "erro") return false;
        if (activeFilter === "working" && c.channels_working === 0) return false;
        if (activeFilter === "blackscreen" && c.channels_blackscreen === 0) return false;
      }
      
      // Apply filter from dropdown
      if (filterStatus !== "all") {
        if (filterStatus === "online" && c.status !== "online") return false;
        if (filterStatus === "offline" && c.status !== "offline") return false;
        if (filterStatus === "aviso" && c.status !== "aviso") return false;
        if (filterStatus === "erro" && c.status !== "erro") return false;
        if (filterStatus === "reparo" && c.status !== "reparo") return false;
      }
      
      if (selectedStore !== "Todas" && c.store !== selectedStore) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![c.name, c.ip, c.serial, c.location, c.store].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [cameras, filterStatus, search, selectedStore, activeFilter]);

  async function handleAddCamera(data: CameraFormData) {
    try {
      await addCamera(data);
      setShowAdd(false);
    } catch (err) {
      alert('Erro ao adicionar câmera: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  async function handleUpdateCamera(id: number, data: CameraFormData) {
    try {
      await updateCamera(id, data);
      setEditing(null);
    } catch (err) {
      alert('Erro ao atualizar câmera: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  async function handleRemove(id: number) {
    if (!confirm("Confirma remoção da câmera?")) return;
    try {
      await deleteCamera(id);
    } catch (err) {
      alert('Erro ao remover câmera: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  function exportPDF(filteredList: Camera[]) {
    // implementação simples: gera CSV-like em nova janela (no protótipo)
    const rows = [
      ["Nome", "IP", "Serial", "Localização", "Loja", "Status", "Canais Total", "Canais Funcionando", "Canais TelaPreta"],
      ...filteredList.map((c) => [
        c.name,
        c.ip,
        c.serial,
        c.location,
        c.store,
        c.status,
        c.channels_total,
        c.channels_working,
        c.channels_blackscreen,
      ]),
    ];
    const csv = rows.map((r) => r.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_cameras_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#020617] to-[#071026] text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Carregando câmeras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#020617] to-[#071026] text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar câmeras: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] to-[#071026] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-wide">CÂMERAS ONLINE</h1>
            <p className="text-sm text-slate-300">Sistema de Monitoramento</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              Adicionar Câmera
            </button>
            <button
              onClick={() => exportPDF(filtered)}
              className="px-4 py-2 rounded-md bg-transparent border border-slate-600 hover:border-slate-400"
            >
              Exportar PDF/CSV
            </button>
          </div>
        </header>

        {/* Dashboard metrics grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Total Câmeras */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "all" 
                ? "border-indigo-400 bg-[rgba(99,102,241,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-indigo-300"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Câmeras</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.total}</div>
            <div className="text-xs text-slate-500 mt-1">CÂMERAS CONFIGURADAS</div>
          </div>
          
          {/* Online */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "online" 
                ? "border-green-400 bg-[rgba(34,197,94,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-green-300"
            }`}
            onClick={() => setActiveFilter("online")}
          >
            <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Online</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.online}</div>
            <div className="text-xs text-slate-500 mt-1">SEM INTERRUPÇÕES</div>
          </div>
          
          {/* Offline */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "offline" 
                ? "border-red-400 bg-[rgba(239,68,68,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-red-300"
            }`}
            onClick={() => setActiveFilter("offline")}
          >
            <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Offline</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.offline}</div>
            <div className="text-xs text-slate-500 mt-1">CÂMERA OFFLINE</div>
          </div>
          
          {/* Aviso */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "aviso" 
                ? "border-yellow-400 bg-[rgba(251,191,36,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-yellow-300"
            }`}
            onClick={() => setActiveFilter("aviso")}
          >
            <div className="text-xs text-yellow-400 uppercase tracking-wider mb-2">Aviso</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.aviso}</div>
            <div className="text-xs text-slate-500 mt-1">SUPERFÍCIE COM PROBLEMAS</div>
          </div>
          
          {/* Total Canais */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "total" 
                ? "border-indigo-400 bg-[rgba(99,102,241,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-indigo-300"
            }`}
            onClick={() => setActiveFilter("total")}
          >
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Canais</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.channels.total}</div>
            <div className="text-xs text-slate-500 mt-1">CANAIS CONFIGURADOS</div>
          </div>
          
          {/* Canais Funcionando */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "working" 
                ? "border-green-400 bg-[rgba(34,197,94,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-green-300"
            }`}
            onClick={() => setActiveFilter("working")}
          >
            <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Canais Funcionando</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.channels.working}</div>
            <div className="text-xs text-slate-500 mt-1">FUNCIONANDO NORMALMENTE</div>
          </div>
          
          {/* Tela Preta */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "blackscreen" 
                ? "border-red-400 bg-[rgba(239,68,68,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-red-300"
            }`}
            onClick={() => setActiveFilter("blackscreen")}
          >
            <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Tela Preta</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.channels.blackscreen}</div>
            <div className="text-xs text-slate-500 mt-1">CANAIS COM TELA PRETA</div>
          </div>
          
          {/* Reparo */}
          <div 
            className={`bg-[rgba(8,20,40,0.6)] border rounded-lg p-4 text-center backdrop-blur-md cursor-pointer transition-all duration-300 select-none ${
              activeFilter === "reparo" 
                ? "border-orange-400 bg-[rgba(251,146,60,0.2)]" 
                : "border-[rgba(120,200,255,0.12)] hover:bg-[rgba(8,20,40,0.8)] hover:border-orange-300"
            }`}
            onClick={() => setActiveFilter("reparo")}
          >
            <div className="text-xs text-orange-400 uppercase tracking-wider mb-2">Reparo</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{metrics.reparo}</div>
            <div className="text-xs text-slate-500 mt-1">PRECISA DE REPARO</div>
          </div>
        </div>

        {/* Bottom sections */}
        <div className="grid grid-cols-12 gap-6">
          {/* Câmeras Recentes */}
          <div className="col-span-6 bg-[rgba(8,20,40,0.6)] border border-[rgba(120,200,255,0.12)] rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-green-400 text-sm font-medium mb-3">CÂMERAS RECENTES</h3>
            {cameras.length === 0 ? (
              <div className="text-xs text-slate-400">NENHUMA CÂMERA REGISTRADA</div>
            ) : (
              <div className="space-y-2">
                {cameras.slice(0, 3).map((camera) => (
                  <div key={camera.id} className="flex justify-between items-center p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(120,200,255,0.04)]">
                    <div>
                      <div className="text-xs font-medium text-slate-200">{camera.name}</div>
                      <div className="text-[10px] text-slate-400">{camera.store}</div>
                    </div>
                    <div className={`text-[10px] px-2 py-1 rounded ${camera.status === 'online' ? 'bg-green-900 text-green-300' : camera.status === 'offline' ? 'bg-red-900 text-red-300' : camera.status === 'reparo' ? 'bg-orange-900 text-orange-300' : 'bg-amber-900 text-amber-300'}`}>
                      {camera.status.toUpperCase()}
                    </div>
                  </div>
                ))}
                {cameras.length > 3 && (
                  <div className="text-[10px] text-slate-400 text-center">
                    +{cameras.length - 3} mais câmeras
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Distribuição por Loja */}
          <div className="col-span-6 bg-[rgba(8,20,40,0.6)] border border-[rgba(120,200,255,0.12)] rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-green-400 text-sm font-medium mb-3">DISTRIBUIÇÃO POR LOJA</h3>
            {cameras.length === 0 ? (
              <div className="text-xs text-slate-400">ADICIONE CÂMERAS PARA VER DISTRIBUIÇÃO</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  cameras.reduce((acc, camera) => {
                    acc[camera.store] = (acc[camera.store] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([store, count]) => (
                  <div key={store} className="flex justify-between items-center">
                    <div className="text-xs text-slate-200">{store}</div>
                    <div className="text-xs text-slate-400">{count} câmera{count > 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main control panel */}
        <div className="mt-6 bg-[rgba(8,20,40,0.6)] border border-[rgba(120,200,255,0.12)] rounded-xl p-6 shadow-[0_8px_30px_rgba(0,120,255,0.04)] backdrop-blur-md">
          <div className="grid grid-cols-12 gap-6">
            {/* Control panel placeholder */}
            <div className="col-span-3 space-y-4">
              <div className="p-4 rounded-lg border border-[rgba(120,200,255,0.06)]">
                <h4 className="text-sm text-slate-300">Gerenciar Câmeras</h4>
                <div className="mt-3 space-y-2">
                  <button onClick={() => { setShowAdd(true); setEditing(null); }} className="w-full text-left px-3 py-2 rounded-md border border-slate-700 hover:border-slate-500 text-sm">Adicionar Nova</button>
                  <button onClick={() => { setFilterStatus('all'); }} className="w-full text-left px-3 py-2 rounded-md border border-slate-700 hover:border-slate-500 text-sm">Editar Selecionada</button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[rgba(120,200,255,0.06)]">
                <h4 className="text-sm text-slate-300">Filtros e Busca</h4>
                <div className="mt-3 space-y-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, serial ou IP" className="w-full px-3 py-2 rounded bg-transparent border border-slate-700 text-sm" />

                  <div className="flex gap-2">
                    <select 
                      value={filterStatus} 
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setActiveFilter("all"); 
                      }} 
                      className="w-1/2 px-2 py-2 rounded bg-transparent border border-slate-700 text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="aviso">Aviso</option>
                      <option value="erro">Erro</option>
                      <option value="reparo">Reparo</option>
                    </select>
                    <select 
                      value={selectedStore} 
                      onChange={(e) => {
                        setSelectedStore(e.target.value);
                        setActiveFilter("all");
                      }} 
                      className="w-1/2 px-2 py-2 rounded bg-transparent border border-slate-700 text-sm"
                    >
                      {stores.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[rgba(120,200,255,0.06)]">
                <h4 className="text-sm text-slate-300">Relatórios</h4>
                <div className="mt-3 text-sm text-slate-400">Exporte relatórios com os filtros aplicados</div>
                <div className="mt-3">
                  <button onClick={() => exportPDF(filtered)} className="w-full px-3 py-2 rounded-md border border-slate-700 hover:border-slate-500 text-sm">Exportar CSV</button>
                </div>
              </div>
            </div>

            {/* Middle column - holographic globe / chart area */}
            <div className="col-span-9">
              <div className="h-72 rounded-lg border border-[rgba(120,200,255,0.06)] flex items-center justify-center relative overflow-hidden mb-4">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  {/* simple circular motif to mimic globe */}
                  <svg width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="160" cy="160" r="120" stroke="rgba(120,200,255,0.12)" strokeWidth="2" />
                    <circle cx="160" cy="160" r="80" stroke="rgba(120,200,255,0.08)" strokeWidth="1" />
                    <g stroke="rgba(120,200,255,0.06)">
                      <path d="M0 160 H320" />
                      <path d="M160 0 V320" />
                    </g>
                  </svg>
                </div>

                <div className="z-10 w-full h-full p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-slate-200 font-medium">Visão Global</h3>
                      <p className="text-xs text-slate-400">Status resumido e mapa de câmeras</p>
                    </div>
                    <div className="text-xs text-slate-400">Última atualização: Agora</div>
                  </div>

                  <div className="mt-6 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ name: 'Funcionando', v: metrics.channels.working }, { name: 'Total', v: metrics.channels.total }, { name: 'Tela Preta', v: metrics.channels.blackscreen }]}> 
                        <XAxis dataKey="name" stroke="#7dd3fc" />
                        <YAxis stroke="#7dd3fc" />
                        <Tooltip />
                        <Line type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Filter indicator */}
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm">
                  {activeFilter === "all" ? (
                    <span className="text-slate-300">Mostrando {filtered.length} câmeras</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">Filtrando por:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        activeFilter === "online" ? "bg-green-900 text-green-300" :
                        activeFilter === "offline" ? "bg-red-900 text-red-300" :
                        activeFilter === "aviso" ? "bg-yellow-900 text-yellow-300" :
                        activeFilter === "reparo" ? "bg-orange-900 text-orange-300" :
                        activeFilter === "working" ? "bg-green-900 text-green-300" :
                        activeFilter === "blackscreen" ? "bg-red-900 text-red-300" :
                        "bg-slate-700 text-slate-300"
                      }`}>
                        {activeFilter === "working" ? "Canais Funcionando" :
                         activeFilter === "blackscreen" ? "Tela Preta" :
                         activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                      </span>
                      <span className="text-slate-400">({filtered.length} câmeras)</span>
                    </div>
                  )}
                </div>
                {activeFilter !== "all" && (
                  <button 
                    onClick={() => setActiveFilter("all")}
                    className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400"
                  >
                    Limpar Filtro
                  </button>
                )}
              </div>

              {/* Cards list of cameras */}
              <div className="grid grid-cols-3 gap-3">
                {filtered.map((c) => (
                  <div key={c.id} data-camera-id={c.id} className="p-3 rounded-lg border border-[rgba(120,200,255,0.04)] bg-[rgba(255,255,255,0.01)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.03)]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.location} • {c.store}</div>
                      </div>
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded text-[10px] ${c.status === 'online' ? 'bg-green-900 text-green-300' : c.status === 'offline' ? 'bg-red-900 text-red-300' : c.status === 'reparo' ? 'bg-orange-900 text-orange-300' : 'bg-amber-900 text-amber-300'}`}>{c.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">IP: {c.ip}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-slate-300">Canais: {c.channels_total}</div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(c); setShowAdd(true); }} className="text-xs px-2 py-1 border rounded hover:bg-slate-800">Editar</button>
                        <button onClick={() => setModalChannelsFor(c)} className="text-xs px-2 py-1 border rounded hover:bg-slate-800">Canais</button>
                        <button onClick={() => handleRemove(c.id)} className="text-xs px-2 py-1 border rounded text-red-400 hover:bg-red-900">Excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-lg w-[720px] p-6">
              <h3 className="text-lg mb-3">{editing ? 'Editar Câmera' : 'Adicionar Câmera'}</h3>
              <CameraForm
                initial={editing}
                onCancel={() => { setShowAdd(false); setEditing(null); }}
                onSave={(data: CameraFormData) => editing ? handleUpdateCamera(editing.id, data) : handleAddCamera(data)}
              />
            </div>
          </div>
        )}

        {/* Channels modal */}
        {modalChannelsFor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-lg w-[520px] p-6">
              <h3 className="text-lg">Configurar Canais - {modalChannelsFor.name}</h3>
              <ChannelConfigurator
                camera={modalChannelsFor}
                onClose={() => setModalChannelsFor(null)}
                onSave={async (newChannels: Channels) => {
                  try {
                    await updateCamera(modalChannelsFor.id, {
                      channels_total: newChannels.total,
                      channels_working: newChannels.working,
                      channels_blackscreen: newChannels.blackscreen,
                    });
                    setModalChannelsFor(null);
                  } catch (err) {
                    alert('Erro ao atualizar canais: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CameraFormProps {
  initial: Camera | null;
  onCancel: () => void;
  onSave: (data: CameraFormData) => void;
}

function CameraForm({ initial, onCancel, onSave }: CameraFormProps) {
  const [form, setForm] = useState<CameraFormData>(
    initial ? {
      name: initial.name,
      ip: initial.ip,
      serial: initial.serial,
      location: initial.location,
      store: initial.store,
      status: initial.status,
      channels_total: initial.channels_total,
      channels_working: initial.channels_working,
      channels_blackscreen: initial.channels_blackscreen,
    } : {
      name: "",
      ip: "",
      serial: "",
      location: "",
      store: "Açaí - Mata Bil",
      status: "online",
      channels_total: 4,
      channels_working: 4,
      channels_blackscreen: 0,
    }
  );

  function change(k: keyof CameraFormData, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function changeChannels(k: 'total' | 'working' | 'blackscreen', v: number) {
    const fieldMap = {
      total: 'channels_total',
      working: 'channels_working', 
      blackscreen: 'channels_blackscreen'
    } as const;
    
    setForm((s) => ({ ...s, [fieldMap[k]]: v }));
  }

  function save() {
    // Basic validation
    if (!form.name || !form.ip) return alert("Preencha nome e IP");
    onSave(form);
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold mb-4">{initial ? 'Editar Câmera' : 'Adicionar Nova Câmera'}</div>
      <div className="text-sm text-slate-300 mb-4">Preencha as informações da câmera para {initial ? 'salvar alterações' : 'adicionar ao sistema'}.</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Nome da Câmera *</label>
          <input 
            value={form.name} 
            onChange={(e) => change('name', e.target.value)} 
            placeholder="Ex: Câmera Entrada Principal" 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Serial Cloud *</label>
          <input 
            value={form.serial} 
            onChange={(e) => change('serial', e.target.value)} 
            placeholder="Ex: ABC123456789" 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Localização *</label>
          <input 
            value={form.location} 
            onChange={(e) => change('location', e.target.value)} 
            placeholder="Ex: Entrada Principal" 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Endereço IP *</label>
          <input 
            value={form.ip} 
            onChange={(e) => change('ip', e.target.value)} 
            placeholder="192.168.1.100" 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Loja *</label>
          <select 
            value={form.store} 
            onChange={(e) => change('store', e.target.value)} 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Selecione a loja</option>
            <option value="Açaí - Mata Bil">Açaí - Mata Bil</option>
            <option value="Bradesco - Potencial Expresso">Bradesco - Potencial Expresso</option>
            <option value="Correspondente Bradesco">Correspondente Bradesco</option>
            <option value="Boa - Potencial Expresso">Boa - Potencial Expresso</option>
            <option value="Solução Embragens Bil">Solução Embragens Bil</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Status *</label>
          <select 
            value={form.status} 
            onChange={(e) => change('status', e.target.value as "online" | "offline" | "aviso" | "erro" | "reparo")} 
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Selecione o status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="aviso">Com Problemas</option>
            <option value="erro">Área Crítica</option>
            <option value="reparo">Precisa de Reparo</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-slate-300 mb-3">Configuração de Canais:</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Canais funcionando</label>
            <input 
              type="number" 
              value={form.channels_working} 
              onChange={(e) => changeChannels('working', Number(e.target.value))} 
              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white text-sm focus:border-indigo-500 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Canais com tela preta</label>
            <input 
              type="number" 
              value={form.channels_blackscreen} 
              onChange={(e) => changeChannels('blackscreen', Number(e.target.value))} 
              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white text-sm focus:border-indigo-500 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Canais total</label>
            <input 
              type="number" 
              value={form.channels_total} 
              onChange={(e) => changeChannels('total', Number(e.target.value))} 
              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white text-sm focus:border-indigo-500 focus:outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
        <button 
          onClick={onCancel} 
          className="px-6 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={save} 
          className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
        >
          {initial ? 'Salvar Alterações' : 'Adicionar Câmera'}
        </button>
      </div>
    </div>
  );
}

interface ChannelConfiguratorProps {
  camera: Camera;
  onClose: () => void;
  onSave: (channels: Channels) => void;
}

function ChannelConfigurator({ camera, onClose, onSave }: ChannelConfiguratorProps) {
  const [channels, setChannels] = useState<Channels>({
    total: camera.channels_total,
    working: camera.channels_working,
    blackscreen: camera.channels_blackscreen,
  });

  function setField(k: keyof Channels, v: string) {
    setChannels((s) => ({ ...s, [k]: Number(v) }));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-300">Total</label>
          <input type="number" value={channels.total} onChange={(e) => setField('total', e.target.value)} className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Funcionando</label>
          <input type="number" value={channels.working} onChange={(e) => setField('working', e.target.value)} className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Tela Preta</label>
          <input type="number" value={channels.blackscreen} onChange={(e) => setField('blackscreen', e.target.value)} className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white mt-1" />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-3 py-2 border border-slate-600 rounded hover:bg-slate-800">Cancelar</button>
        <button onClick={() => onSave(channels)} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">Salvar</button>
      </div>
    </div>
  );
}

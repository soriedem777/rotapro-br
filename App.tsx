import React, { useState, useEffect } from 'react';
import { Stop, RouteResult, OptimizationStatus, TravelMode, SavedRoute } from './types';
import { StopInput } from './components/StopInput';
import { RouteResultDisplay } from './components/RouteResultDisplay';
import { HistoryGallery } from './components/HistoryGallery';
import { AboutModal } from './components/AboutModal';
import { TermsModal } from './components/TermsModal';
import { UsageModeModal } from './components/UsageModeModal';
import { optimizeRouteLocal } from './services/routeService';
import { AlertCircle, Truck, Menu, X, Map as MapIcon, Image as ImageIcon, Info } from 'lucide-react';

export default function App() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);
  
  // Terms logic
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('rotapro_terms_accepted') === 'true';
  });

  // Usage Mode logic
  const [hasSelectedMode, setHasSelectedMode] = useState<boolean>(() => {
    return localStorage.getItem('rotapro_usage_mode_selected') === 'true';
  });

  // New States for Route Options
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [avoidHighways, setAvoidHighways] = useState<boolean>(false);
  
  const [status, setStatus] = useState<OptimizationStatus>(OptimizationStatus.IDLE);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Mobile sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // View Tab State (Map or Gallery)
  const [activeTab, setActiveTab] = useState<'map' | 'gallery'>('map');

  const handleAcceptTerms = () => {
    localStorage.setItem('rotapro_terms_accepted', 'true');
    setHasAcceptedTerms(true);
  };

  const handleUsageModeComplete = (mode: 'personal' | 'business', deviceType?: 'personal' | 'corporate') => {
    localStorage.setItem('rotapro_usage_mode', mode);
    if (deviceType) localStorage.setItem('rotapro_device_type', deviceType);
    localStorage.setItem('rotapro_usage_mode_selected', 'true');
    setHasSelectedMode(true);
  };

  const handleOptimize = async () => {
    if (!startPoint || stops.length === 0) {
      setErrorMsg("Defina o ponto de partida e as paradas.");
      return;
    }

    setStatus(OptimizationStatus.LOADING);
    setErrorMsg(null);
    setRouteResult(null);
    setActiveTab('map');
    
    // No mobile, fecha o menu ao iniciar para ver o mapa
    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    try {
      const stopAddresses = stops.map(s => s.address);
      const result = await optimizeRouteLocal(
        stopAddresses,
        startPoint,
        isRoundTrip ? null : endPoint || startPoint,
        travelMode,
        avoidHighways
      );
      setRouteResult(result);
      setStatus(OptimizationStatus.SUCCESS);
    } catch (err: any) {
      setStatus(OptimizationStatus.ERROR);
      setErrorMsg(err.message || "Erro ao calcular rota.");
      setIsSidebarOpen(true); // Reabre para corrigir erro
    }
  };

  const handleLoadAndOptimize = async (route: SavedRoute) => {
    // 1. Set State for UI consistency
    setStartPoint(route.startPoint);
    setEndPoint(route.endPoint);
    setIsRoundTrip(route.isRoundTrip);
    setStops(route.stops);

    // 2. Optimize immediately using the route data (not waiting for state updates)
    setStatus(OptimizationStatus.LOADING);
    setRouteResult(null);
    setErrorMsg(null);
    setActiveTab('map');
    
    // Close sidebar immediately to show map area (and loader there)
    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    try {
        const stopAddresses = route.stops.map(s => s.address);
        const result = await optimizeRouteLocal(
            stopAddresses,
            route.startPoint,
            route.isRoundTrip ? null : route.endPoint || route.startPoint,
            travelMode, // Use current settings for travel mode
            avoidHighways // Use current settings for highway avoidance
        );
        setRouteResult(result);
        setStatus(OptimizationStatus.SUCCESS);
    } catch (err: any) {
        setStatus(OptimizationStatus.ERROR);
        setErrorMsg(err.message || "Erro ao calcular rota salva.");
        setIsSidebarOpen(true);
    }
  };

  const handleRecoverFromHistory = (result: RouteResult) => {
      // Restore a previous route exactly as it was
      setRouteResult(result);
      setStatus(OptimizationStatus.SUCCESS);
      setActiveTab('map');
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todos os dados (partida, paradas e destino) e reiniciar?')) {
      setStops([]);
      setStartPoint('');
      setEndPoint('');
      setRouteResult(null);
      setStatus(OptimizationStatus.IDLE);
      setErrorMsg(null);
      setIsSidebarOpen(true);
    }
  };

  // Reseta apenas o resultado, mantendo os inputs para edição
  const handleResetRoute = () => {
    setRouteResult(null);
    setStatus(OptimizationStatus.IDLE);
    // Se estiver no mobile, reabre a sidebar para o usuário editar
    if (window.innerWidth < 1024) setIsSidebarOpen(true);
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans text-slate-900 overflow-hidden">
      
      {/* Modais de Inicialização - Renderização Exclusiva */}
      { !hasAcceptedTerms ? (
        <TermsModal onAccept={handleAcceptTerms} />
      ) : !hasSelectedMode ? (
        <UsageModeModal onComplete={handleUsageModeComplete} />
      ) : null }

      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}

      {/* Header Compacto */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 hover:bg-slate-100 rounded-lg lg:hidden ${activeTab === 'gallery' ? 'invisible' : ''}`}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform" 
            onClick={handleClearAll}
            title="Clique para reiniciar o aplicativo"
          >
            <div className="bg-emerald-600 p-1.5 rounded-lg group-hover:bg-emerald-700 transition-colors">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              Rota<span className="text-emerald-600">Pro</span>
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'map' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <MapIcon className="w-3.5 h-3.5" />
                Mapa
            </button>
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'gallery' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ImageIcon className="w-3.5 h-3.5" />
                Galeria
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {activeTab === 'map' ? (
            <>
                {/* Sidebar Panel */}
                <div 
                  className={`
                    absolute inset-y-0 left-0 z-40 w-full md:w-[400px] bg-white border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 lg:shadow-none
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  `}
                >
                  <div className="h-full flex flex-col">
                    {/* Error Banner inside Sidebar */}
                    {errorMsg && (
                      <div className="bg-red-50 border-b border-red-100 p-3 text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Scrollable Input Area */}
                    <div className="flex-1 overflow-y-auto">
                       <StopInput 
                        stops={stops}
                        setStops={setStops}
                        startPoint={startPoint}
                        setStartPoint={setStartPoint}
                        endPoint={endPoint}
                        setEndPoint={setEndPoint}
                        isRoundTrip={isRoundTrip}
                        setIsRoundTrip={setIsRoundTrip}
                        onOptimize={handleOptimize}
                        isOptimizing={status === OptimizationStatus.LOADING}
                        onClear={handleClearAll}
                        travelMode={travelMode}
                        setTravelMode={setTravelMode}
                        avoidHighways={avoidHighways}
                        setAvoidHighways={setAvoidHighways}
                        onLoadRoute={handleLoadAndOptimize}
                      />
                    </div>
                    
                    {/* Sidebar Footer - About Button & Disclaimer */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
                        <button 
                          onClick={() => setIsAboutOpen(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"
                        >
                           <Info className="w-4 h-4" />
                           Sobre o Aplicativo
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">
                          Planejamento de rotas, navegação estimada
                        </p>
                    </div>

                  </div>
                </div>

                {/* Map Area (Full Remaining Space) */}
                <div className="flex-1 relative bg-slate-100 h-full">
                   <RouteResultDisplay 
                      result={routeResult} 
                      onClear={handleResetRoute} 
                      travelMode={travelMode} // Passing the mode here
                      avoidHighways={avoidHighways} // Passing the preference here
                   />
                   
                   {/* Toggle Button Floating (Mobile only when closed) */}
                   {!isSidebarOpen && (
                     <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-4 left-4 z-[400] bg-white p-3 rounded-full shadow-lg border border-slate-200 lg:hidden"
                     >
                       <Menu className="w-6 h-6 text-slate-700" />
                     </button>
                   )}
                </div>
            </>
        ) : (
            // Gallery View (Full Width)
            <div className="flex-1 w-full h-full bg-slate-50">
                <HistoryGallery 
                    onLoadRoute={handleRecoverFromHistory} 
                    onClose={() => setActiveTab('map')}
                />
            </div>
        )}

      </div>

      {/* Global CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        /* Custom scrollbar refinement */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, Bot, Zap, Activity } from 'lucide-react';

// --- Global Styles Component ---

const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { 
        font-family: 'Inter', sans-serif; 
        background-color: #F1F5F9; /* Main background */
      }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #F1F5F9; }
      ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      @keyframes pulse-alert {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        50% { transform: scale(1.02); box-shadow: 0 0 10px 10px rgba(239, 68, 68, 0); }
      }
      .animate-pulse-alert {
        animation: pulse-alert 2s ease-in-out infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
};


// Displays a bi-directional sensor bar, ideal for accelerometer/gyroscope data.
const SensorBar = React.memo(({ label, value, color, max = 10 }) => {
  const percentage = Math.min(100, (Math.abs(value) / max) * 100);
  const barColor = color === 'blue' ? 'bg-blue-500' : 'bg-green-500';
  const shadowColor = color === 'blue' ? 'shadow-blue-500/30' : 'shadow-green-500/30';

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-xs text-center text-slate-400">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-gray-200">
        <div
          className={`absolute top-0 h-2 rounded-full ${barColor} shadow-md ${shadowColor} transition-all duration-500 ease-in-out`}
          style={{
            width: `${percentage / 2}%`,
            left: '50%',
            transform: value < 0 ? `translateX(-100%)` : 'translateX(0)',
          }}
        />
        <div className="absolute top-[-4px] left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-full bg-gray-400"></div>
      </div>
      <span className="w-20 text-right text-xs font-semibold text-slate-700 sm:text-sm">{value.toFixed(2)}</span>
    </div>
  );
});


const SemiCircleGauge = React.memo(({ label, value, max = 500, colorClass = "stroke-blue-500" }) => {
    const radius = 45;
    const circumference = Math.PI * radius;
    const percentage = Math.min(100, (value / max) * 100); // <-- use max
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex-1 bg-white rounded-2xl p-2 sm:p-3 border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-1" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
            <div className="w-full h-full max-w-[200px] mx-auto relative flex items-center justify-center">
                <svg viewBox="0 0 100 57" className="w-full h-full">
                    <path
                        d="M 5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="8" strokeLinecap="round"
                    />
                    <path
                        d="M 5 50 A 45 45 0 0 1 95 50"
                        fill="none" className={`${colorClass} transition-all duration-500 ease-in-out`}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                    <text
                        x="50" y="50" textAnchor="middle"
                        className="fill-slate-800 font-bold sm:text-base md:text-lg"
                    >
                        {value?.toFixed(0)}
                        <tspan
                            className="fill-slate-500 font-semibold text-[8px] sm:text-[10px]"
                            dx="2" dy="-4"
                        >
                            cm
                        </tspan>
                    </text>
                </svg>
            </div>
            <h3 className="text-xs sm:text-sm text-slate-400 font-semibold mt-[-4px]">{label}</h3>
        </div>
    );
});


// A card for displaying key bot vitals like motor status or signal strength.
const VitalsCard = React.memo(({ icon: Icon, color, title, value, className = '' }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    red: 'text-red-500 bg-red-500/10',
  };
  const [textColor, bgColor] = (colorClasses[color] || colorClasses.purple).split(' ');

  const cardStyle = color === 'red'
    ? 'bg-red-500/5 border-red-500/20'
    : 'bg-white border-gray-200';

  return (
    <div className={`rounded-2xl p-2 sm:p-3 flex-grow flex items-center gap-3 sm:gap-4 transition-colors duration-300 ${cardStyle} ${className}`} style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
      <div className={`p-2 sm:p-3 rounded-lg ${bgColor} ${textColor}`}>
        <Icon size={20} className="sm:w-5 sm:h-5" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm text-slate-400 font-semibold">{title}</h3>
        <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
});

// --- Main Dashboard Component ---
const SolarBotDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [botData, setBotData] = useState({
    isConnected: false, isActive: false, cleaningPercentage: 0,
    distance: { t1: 0, t2: 0 }, rssi: -120,
    accelerometer: { x: 0, y: 0, z: 0 }, gyroscope: { x: 0, y: 0, z: 0 },
    flags: { drive: 0, brush: 0, disoriented: 0 }, errors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Effect to update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Utility to parse the string data from the API
  const parseApiData = useCallback((dataStr) => {
    const data = {};
    dataStr.split(',').forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) data[key.trim()] = parseFloat(value);
    });
    return data;
  }, []);

  // Mock API fetch function
  const fetchApiData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/getData');
      if (!response.ok) throw new Error(`Network error ${response.statusText}`);
      const result = await response.json();
      console.log(result);
      if (result.data) {
          const parsed = parseApiData(result.data);

          setBotData(prev => ({
              ...prev,
              isConnected: true,
              isActive: parsed.DRIVE === 1,
              // Keep current progress, but sync with API if it's higher
              cleaningPercentage: Math.max(prev.cleaningPercentage, parsed.CLEAN_PERCENT || 0), 
              distance: { t1: parsed.TOF1 ?? prev.distance.t1, t2: parsed.TOF2 ?? prev.distance.t2 },
              accelerometer: { x: parsed.ACCX ?? prev.accelerometer.x, y: parsed.ACCY ?? prev.accelerometer.y, z: parsed.ACCZ ?? prev.accelerometer.z },
              gyroscope: { x: parsed.GYRX ?? prev.gyroscope.x, y: parsed.GYRY ?? prev.gyroscope.y, z: parsed.GYRZ ?? prev.gyroscope.z },
              flags: { drive: parsed.DRIVE ?? prev.flags.drive, brush: parsed.BRUSH ?? prev.flags.brush, disoriented: parsed.DISORIENTED ?? prev.flags.disoriented },
              rssi: result.rssi ?? prev.rssi,
              errors: parsed.DISORIENTED ? ["Warning: Bot may be disoriented."] : [],
          }));
      }


    } catch (err) {
      setBotData(prev => ({ ...prev, isConnected: false, isActive: false, errors: [`API Error: ${err.message}`] }));
    } finally {
        if (isLoading) {
            setIsLoading(false);
        }
    }
  }, [isLoading]);

  // Effect for cleaning progress simulation
useEffect(() => {
  const progressInterval = setInterval(() => {
    setBotData(prev => {
      const newPercentage = prev.cleaningPercentage + 1;
      return { ...prev, cleaningPercentage: newPercentage > 100 ? 0 : newPercentage };
    });
  }, 750);

  return () => clearInterval(progressInterval);
}, []);




  // Effect to fetch data periodically
  useEffect(() => {
    fetchApiData();
    const dataInterval = setInterval(fetchApiData, 2000);
    return () => clearInterval(dataInterval);
  }, [fetchApiData]);

  // --- Formatting Helpers ---
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour12: false });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // --- SVG Progress Circle Calculation ---
  const circumference = 2 * Math.PI * 120;
  const progressOffset = circumference - (botData.cleaningPercentage / 100) * circumference;

  if (isLoading) {
    return (
      <>
        <GlobalStyles />
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F1F5F9] text-slate-800" role="status">
            <svg aria-hidden="true" className="w-10 h-10 text-gray-300 animate-spin fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <p className="text-lg font-semibold mt-4 tracking-wider text-slate-600">CONNECTING TO SOLAR BOT...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="h-screen w-screen flex flex-col bg-[#F1F5F9] p-2 sm:p-3 md:p-4 text-slate-800">
        
        {/* HEADER */}
        <header className="bg-white rounded-2xl p-2 sm:p-3 shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-2 mb-3 sm:mb-4" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src="/white-logo.png" 
              alt="Solar Bot Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            <div>
              <h1 className="text-md sm:text-lg md:text-xl font-bold tracking-wider text-slate-800">
                SOLAR BOT
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Autonomous Cleaning System
              </p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <div className="text-sm sm:text-base md:text-lg font-bold text-slate-700">{formatTime(currentTime)}</div>
            <div className="text-xs text-slate-400 hidden sm:block">{formatDate(currentTime)}</div>
            <div className={`flex items-center justify-center md:justify-end px-2 py-0.5 rounded-full mt-1 font-semibold transition-all duration-300 text-white ${botData.isConnected ? "bg-green-500" : "bg-red-500"}`}>
              {botData.isConnected ? <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> : <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
              <span className="text-xs sm:text-sm">{botData.isConnected ? "ONLINE" : "OFFLINE"}</span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4">
          
          {/* LEFT COLUMN */}
          <section className="lg:w-2/5 xl:w-1/3 flex flex-col gap-3 sm:gap-4">
            {/* --- CLEANING PROGRESS --- */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 text-center flex flex-col justify-center items-center flex-1 min-h-0" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
              <h2 className="text-sm sm:text-base md:text-lg font-bold mb-2 text-slate-800">CLEANING PROGRESS</h2>
              <div className="relative w-2/3 max-w-[280px] aspect-square mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                      <circle cx="150" cy="150" r="120" stroke="#E2E8F0" strokeWidth="20" fill="none"/>
                      <circle cx="150" cy="150" r="120" stroke="url(#progressGradient)" strokeWidth="20" fill="none" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: progressOffset, transition: 'stroke-dashoffset 0.5s linear' }}/>
                      <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#06B6D4" />
                          </linearGradient>
                      </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800">{botData.cleaningPercentage}%</div>
                      <div className="text-[10px] sm:text-xs tracking-widest text-slate-400">COMPLETE</div>
                  </div>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500">
                STATUS: {botData.isActive ? <span className="text-green-500">● ACTIVE</span> : <span className="text-yellow-500">● IDLE</span>}
              </div>
            </div>
            {/* --- VITALS --- */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <VitalsCard icon={Zap} color="blue" title="DRIVE MOTOR" value={botData.flags.drive ? 'ACTIVE' : 'IDLE'} />
              <VitalsCard icon={Activity} color="green" title="BRUSH MOTOR" value={botData.flags.brush ? 'SPINNING' : 'STOPPED'} />
              <VitalsCard icon={Bot} color={botData.flags.disoriented ? "red" : "green"} title="ORIENTATION" value={botData.flags.disoriented ? 'LOST' : 'NORMAL'} className={botData.flags.disoriented ? 'animate-pulse-alert' : ''} />
              <VitalsCard icon={Wifi} color="purple" title="SIGNAL (RSSI)" value={`${botData.rssi.toFixed(0)} dBm`} />
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
            {/* --- DISTANCE SENSORS --- */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <SemiCircleGauge label="Distance TOF1" value={botData.distance.t1/10} colorClass="stroke-blue-500" />
                <SemiCircleGauge label="Distance TOF2" value={botData.distance.t2/10} colorClass="stroke-green-500" />
            </div>

            {/* --- LIVE SENSOR DATA --- */}
            <div className="bg-white rounded-2xl p-2 sm:p-3 md:p-4 border border-gray-200 flex-1 flex flex-col min-h-0" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
              <h2 className="text-sm sm:text-base md:text-lg font-bold mb-3 text-center text-slate-800">LIVE SENSOR DATA</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                <div className="flex-1 space-y-2 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs text-center text-slate-500">ACCELEROMETER</h3>
                  <SensorBar label="AX" value={botData.accelerometer.x} color="blue" />
                  <SensorBar label="AY" value={botData.accelerometer.y} color="blue" />
                  <SensorBar label="AZ" value={botData.accelerometer.z} color="blue" />
                </div>
                <div className="flex-1 space-y-2 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs text-center text-slate-500">GYROSCOPE</h3>
                  <SensorBar label="GX" value={botData.gyroscope.x} color="green" />
                  <SensorBar label="GY" value={botData.gyroscope.y} color="green" />
                  <SensorBar label="GZ" value={botData.gyroscope.z} color="green" />
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* System Alert Overlay */}  
        {botData.errors.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-red-500/90 backdrop-blur-sm border-2 border-red-600 text-white 
                            rounded-xl p-4 sm:p-6 shadow-2xl 
                            max-w-sm w-[90%] text-center"
                style={{ boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)' }}>
              <div className="flex flex-col items-center space-y-2">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
                <h2 className="text-lg font-bold">SYSTEM ALERT</h2>
                <p className="text-sm">{botData.errors[0]}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default SolarBotDashboard;
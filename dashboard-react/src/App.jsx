import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, Bot } from 'lucide-react';

// --- Global Styles Component ---
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; background-color: #000; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #000000; }
      ::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
};

// --- Child Components ---
const SensorBar = React.memo(({ label, value, color, max = 15 }) => {
  const percentage = Math.min(100, (Math.abs(value) / max) * 100);
  const barColor = color === 'blue' ? 'bg-cyan-400' : 'bg-lime-400';
  const shadowColor = color === 'blue' ? 'shadow-cyan-400/50' : 'shadow-lime-400/50';

  return (
    <div className="flex items-center gap-4">
      <span className="w-8 font-mono text-xs sm:text-sm text-center text-gray-400">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full relative">
        <div
          className={`absolute top-0 h-2 rounded-full ${barColor} shadow-lg ${shadowColor} transition-all duration-500 ease-in-out`}
          style={{
            width: `${percentage / 2}%`,
            left: '50%',
            transform: value < 0 ? 'translateX(-100%)' : 'translateX(0)'
          }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-[-4px] h-4 w-0.5 bg-gray-600 rounded-full"></div>
      </div>
      <span className="w-16 sm:w-20 text-right font-semibold text-xs sm:text-sm md:text-base text-white">{value.toFixed(2)}</span>
    </div>
  );
});

const SemiCircleGauge = React.memo(({ label, value, colorClass = "stroke-cyan-400" }) => {
  const safeValue = Math.min(Math.max(value, 0), 100); 
  const radius = 45;
  const circumference = Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 border border-white/10 flex flex-col items-center justify-center gap-2 flex-1">
      <div className="w-full max-w-[200px] relative">
        <svg viewBox="0 0 100 55">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none" stroke="rgba(55, 65, 81, 0.5)"
            strokeWidth="10" strokeLinecap="round"
          />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none" className={`${colorClass} transition-all duration-500 ease-in-out`}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <text
            x="50" y="45" textAnchor="middle"
            className="fill-white font-bold text-xs sm:text-sm md:text-base lg:text-xl"
          >
            {safeValue.toFixed(1)}%
          </text>
        </svg>
      </div>
      <h3 className="text-xs sm:text-sm text-gray-400 font-semibold mt-[-6px]">{label}</h3>
    </div>
  );
});

const VitalsCard = React.memo(({ icon: Icon, color, title, value }) => {
  const iconColor = `text-${color}-400`;
  const bgColor = `bg-${color}-500/10`;

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 border border-white/10 flex-grow flex items-center gap-3 sm:gap-4">
      <div className={`p-2 sm:p-3 rounded-lg ${bgColor} ${iconColor}`}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm text-gray-400 font-semibold">{title}</h3>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
});

// --- Main Dashboard Component ---
const SolarBotDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [botData, setBotData] = useState({
    isConnected: false, isActive: false, cleaningPercentage: 70, batteryLevel: 85,
    powerGeneration: 0, temperature: { t1: 0, t2: 0 }, rssi: -120,
    accelerometer: { x: 0, y: 0, z: 0 }, gyroscope: { x: 0, y: 0, z: 0 }, errors: [],
  });

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const parseApiData = useCallback((dataStr) => {
    const data = {};
    dataStr.split(' ').forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) data[key] = parseFloat(value);
    });
    return data;
  }, []);

  const fetchApiData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/getData');
      if (!response.ok) throw new Error(`Network error ${response.status}`);
      const result = await response.json(); 
      if (result.data) {
        const parsed = parseApiData(result.data);
        setBotData(prev => ({
          ...prev, isConnected: true, isActive: true,
          powerGeneration: 3.2 + (Math.random() - 0.5),
          temperature: { t1: parsed.T1 ?? prev.temperature.t1, t2: parsed.T2 ?? prev.temperature.t2 },
          accelerometer: { x: parsed.AX ?? prev.accelerometer.x, y: parsed.AY ?? prev.accelerometer.y, z: parsed.AZ ?? prev.accelerometer.z },
          gyroscope: { x: parsed.GX ?? prev.gyroscope.x, y: parsed.GY ?? prev.gyroscope.y, z: parsed.GZ ?? prev.gyroscope.z },
          rssi: result.rssi ?? prev.rssi, errors: [],
        }));
      }
    } catch (err) {
      setBotData(prev => ({ ...prev, isConnected: false, isActive: false, errors: [`API Error: ${err.message}`] }));
    }
  }, [parseApiData]);

  useEffect(() => {
    if (botData.isConnected && botData.isActive) {
      const progressInterval = setInterval(() => {
        setBotData(prev => {
          if (prev.cleaningPercentage < 100) return { ...prev, cleaningPercentage: prev.cleaningPercentage + 1 };
          clearInterval(progressInterval);
          return prev;
        });
      }, 750);
      return () => clearInterval(progressInterval);
    }
  }, [botData.isConnected, botData.isActive]);

  useEffect(() => {
    fetchApiData();
    const dataInterval = setInterval(fetchApiData, 2000);
    return () => clearInterval(dataInterval);
  }, [fetchApiData]);

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour12: false });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const circumference = 2 * Math.PI * 120;
  const progressOffset = circumference - (botData.cleaningPercentage / 100) * circumference;

  return (
    <>
      <GlobalStyles />
      <div className="
        min-h-screen md:h-screen 
        flex flex-col 
        bg-black bg-gradient-to-br from-black via-gray-900/30 to-black 
        p-2 sm:p-4 md:p-6 
        text-white 
        overflow-auto
      ">
        {/* HEADER */}
        <header className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12">
              <img src="/my-logo.png" alt="Company Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wider">SOLAR BOT</h1>
              <p className="text-xs sm:text-sm text-gray-400">Autonomous Cleaning System</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-base sm:text-lg md:text-xl font-bold">{formatTime(currentTime)}</div>
            <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">{formatDate(currentTime)}</div>
            <div className={`flex items-center justify-center md:justify-end px-2 sm:px-3 py-1 rounded-full mt-2 font-semibold transition-all duration-300 ${botData.isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {botData.isConnected ? <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> : <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
              <span className="text-xs sm:text-sm">{botData.isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 min-h-0 flex flex-col-reverse lg:flex-row gap-4 sm:gap-6">
          {/* LEFT */}
          <div className="lg:w-1/3 flex flex-col gap-4 sm:gap-6">
            <SemiCircleGauge label="SENSOR T1" value={botData.temperature.t1} colorClass="stroke-cyan-400" />
            <SemiCircleGauge label="SENSOR T2" value={botData.temperature.t2} colorClass="stroke-lime-400" />

            {/* Centered Signal Card */}
            <div className="flex justify-center">
              <VitalsCard 
                icon={Wifi} 
                color="indigo" 
                title="SIGNAL (RSSI)" 
                value={`${botData.rssi} dBm`} 
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:w-2/3 flex flex-col gap-4 sm:gap-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 md:p-6 border border-white/10 text-center flex-1 flex flex-col justify-center items-center">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">CLEANING PROGRESS</h2>
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 mx-auto mb-3 sm:mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="120" stroke="rgba(55, 65, 81, 0.5)" strokeWidth="20" fill="none"/>
                  <circle cx="150" cy="150" r="120" stroke="url(#progressGradient)" strokeWidth="20" fill="none" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: progressOffset, transition: 'stroke-dashoffset 0.5s linear' }}/>
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-bold">{botData.cleaningPercentage}%</div>
                  <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-300 tracking-widest">COMPLETE</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-300">
                STATUS: {botData.isActive ? <span className="text-green-400">● ACTIVE</span> : <span className="text-orange-400">● PAUSED</span>}
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 md:p-6 border border-white/10">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 text-center">LIVE SENSOR DATA</h2>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                <div className="flex-1 space-y-3 sm:space-y-5 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs sm:text-sm text-center text-gray-300">ACCELEROMETER (m/s²)</h3>
                  <SensorBar label="AX" value={botData.accelerometer.x} color="blue" />
                  <SensorBar label="AY" value={botData.accelerometer.y} color="blue" />
                  <SensorBar label="AZ" value={botData.accelerometer.z} color="blue" />
                </div>
                <div className="flex-1 space-y-3 sm:space-y-5 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs sm:text-sm text-center text-gray-300">GYROSCOPE (°/s)</h3>
                  <SensorBar label="GX" value={botData.gyroscope.x} color="green" />
                  <SensorBar label="GY" value={botData.gyroscope.y} color="green" />
                  <SensorBar label="GZ" value={botData.gyroscope.z} color="green" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {botData.errors.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 z-50">
            <div className="bg-red-600/80 backdrop-blur-sm border-2 border-red-400 rounded-xl p-3 sm:p-4 shadow-2xl">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white mr-2 sm:mr-3" />
                <div>
                  <h2 className="text-sm sm:text-md font-bold">SYSTEM ALERT</h2>
                  <p className="text-xs sm:text-sm">{botData.errors[0]}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SolarBotDashboard;

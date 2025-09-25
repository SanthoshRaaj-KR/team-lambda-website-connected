import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, Bot, Zap, Activity } from 'lucide-react';

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
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-xs text-center text-gray-400">{label}</span>
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
      <span className="w-20 text-right font-semibold text-xs sm:text-sm text-white">{value.toFixed(2)}</span>
    </div>
  );
});

const SemiCircleGauge = React.memo(({ label, value, colorClass = "stroke-cyan-400" }) => {
  const radius = 60;
  const circumference = Math.PI * radius;

  // Calculate offset proportionally but don’t clamp value
  const percentage = (value / 200) * 100;  // assume 200cm is full arc, you can adjust
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-white/10 flex flex-col items-center justify-center gap-1 flex-1">
      <div className="w-full max-w-[160px] relative">
        <svg viewBox="0 0 100 55">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none" stroke="rgba(55, 65, 81, 0.5)"
            strokeWidth="8" strokeLinecap="round"
          />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none" className={`${colorClass} transition-all duration-500 ease-in-out`}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <text
            x="50" y="45" textAnchor="middle"
            className="fill-white font-bold sm:text-base md:text-lg"
          >
            {value?.toFixed(0)}cm
          </text>
        </svg>
      </div>
      <h3 className="text-xs sm:text-sm text-gray-400 font-semibold mt-[-4px]">{label}</h3>
    </div>
  );
});


const VitalsCard = React.memo(({ icon: Icon, color, title, value }) => {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    lime: 'text-lime-400 bg-lime-500/10',
    indigo: 'text-indigo-400 bg-indigo-500/10',
    red: 'text-red-400 bg-red-500/10',
    green: 'text-green-400 bg-green-500/10',
  };
  const [textColor, bgColor] = (colorClasses[color] || colorClasses.indigo).split(' ');

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-white/10 flex-grow flex items-center gap-3 sm:gap-4">
      <div className={`p-2 sm:p-3 rounded-lg ${bgColor} ${textColor}`}>
        <Icon size={20} className="sm:w-5 sm:h-5" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm text-gray-400 font-semibold">{title}</h3>
        <p className="text-base sm:text-lg md:text-xl font-bold">{value}</p>
      </div>
    </div>
  );
});

// --- Main Dashboard Component ---
const SolarBotDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [botData, setBotData] = useState({
    isConnected: false, isActive: false, cleaningPercentage: 70,
    distance: { t1: 0, t2: 0 }, rssi: -120,
    accelerometer: { x: 0, y: 0, z: 0 }, gyroscope: { x: 0, y: 0, z: 0 },
    flags: { drive: 0, brush: 0, disoriented: 0 }, errors: [],
  });

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const parseApiData = useCallback((dataStr) => {
    const data = {};
    dataStr.split(',').forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) data[key.trim()] = parseFloat(value);
    });
    return data;
  }, []);

  const fetchApiData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/getData');
      if (!response.ok) throw new Error(`Network error ${response.status}`);
      const result = await response.json(); 
      console.log(result);
      if (result.data) {
        const parsed = parseApiData(result.data);
        setBotData(prev => ({
          ...prev, isConnected: true, 
          isActive: parsed.DRIVE === 1,
          distance: { t1: parsed.TOF1 ?? prev.distance.t1, t2: parsed.TOF2 ?? prev.distance.t2 },
          accelerometer: { x: parsed.ACCX ?? prev.accelerometer.x, y: parsed.ACCY ?? prev.accelerometer.y, z: parsed.ACCZ ?? prev.accelerometer.z },
          gyroscope: { x: parsed.GYRX ?? prev.gyroscope.x, y: parsed.GYRY ?? prev.gyroscope.y, z: parsed.GYRZ ?? prev.gyroscope.z },
          flags: {
              drive: parsed.DRIVE ?? prev.flags.drive,
              brush: parsed.BRUSH ?? prev.flags.brush,
              disoriented: parsed.DISORIENTED ?? prev.flags.disoriented,
          },
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
        p-2 sm:p-3 md:p-4 
        text-white 
        overflow-hidden
      ">
{/* HEADER */}
<header className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
  <div className="flex items-center space-x-3 sm:space-x-4">
    {/* Logo Image (no background / border) */}
    <img 
      src="/my-logo.png"   // <-- place your logo inside public/
      alt="Solar Bot Logo"
      className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
    />
    <div>
      <h1 className="text-md sm:text-lg md:text-xl font-bold tracking-wider">SOLAR BOT</h1>
      <p className="text-xs sm:text-sm text-gray-400">Autonomous Cleaning System</p>
    </div>
  </div>
  <div className="text-center md:text-right">
    <div className="text-sm sm:text-base md:text-lg font-bold">{formatTime(currentTime)}</div>
    <div className="text-xs text-gray-400 hidden sm:block">{formatDate(currentTime)}</div>
    <div
      className={`flex items-center justify-center md:justify-end px-2 py-0.5 rounded-full mt-1 font-semibold transition-all duration-300 ${
        botData.isConnected ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {botData.isConnected ? (
        <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
      ) : (
        <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
      )}
      <span className="text-xs sm:text-sm">{botData.isConnected ? "ONLINE" : "OFFLINE"}</span>
    </div>
  </div>
</header>


        {/* MAIN */}
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* LEFT */}
          <div className="lg:w-1/3 flex flex-col gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                <VitalsCard icon={Zap} color="cyan" title="DRIVE MOTOR" value={botData.flags.drive ? 'ACTIVE' : 'IDLE'} />
                <VitalsCard icon={Activity} color="lime" title="BRUSH MOTOR" value={botData.flags.brush ? 'SPINNING' : 'STOPPED'} />
                <VitalsCard icon={Bot} color={botData.flags.disoriented ? "red" : "green"} title="ORIENTATION" value={botData.flags.disoriented ? 'LOST' : 'NORMAL'} />
                <VitalsCard icon={Wifi} color="indigo" title="SIGNAL (RSSI)" value={`${botData.rssi} dBm`} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:w-2/3 flex flex-col gap-3 sm:gap-4">
            <div className="min-h-0 flex flex-col xl:flex-row gap-3 sm:gap-4">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-white/10 text-center flex flex-col justify-center items-center xl:w-2/3">
                <h2 className="text-sm sm:text-base md:text-lg font-bold mb-2">CLEANING PROGRESS</h2>
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-34 lg:h-34 mx-auto mb-2">
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
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{botData.cleaningPercentage}%</div>
                    <div className="text-[10px] sm:text-xs tracking-widest">COMPLETE</div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-300">
                  STATUS: {botData.isActive ? <span className="text-green-400">● ACTIVE</span> : <span className="text-orange-400">● IDLE</span>}
                </div>
              </div>
              <div className='flex-1 flex flex-col gap-3 sm:gap-4'>
                <SemiCircleGauge label="Distance TOF1" value={botData.distance.t1} colorClass="stroke-cyan-400" />
                <SemiCircleGauge label="Distance TOF2" value={botData.distance.t2} colorClass="stroke-lime-400" />
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 border border-white/10 flex-1 flex flex-col">
              <h2 className="text-sm sm:text-base md:text-lg font-bold mb-3 text-center">LIVE SENSOR DATA</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                <div className="flex-1 space-y-2 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs text-center text-gray-300">ACCELEROMETER</h3>
                  <SensorBar label="AX" value={botData.accelerometer.x} color="blue" />
                  <SensorBar label="AY" value={botData.accelerometer.y} color="blue" />
                  <SensorBar label="AZ" value={botData.accelerometer.z} color="blue" />
                </div>
                <div className="flex-1 space-y-2 flex flex-col justify-around">
                  <h3 className="font-semibold text-xs text-center text-gray-300">GYROSCOPE</h3>
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


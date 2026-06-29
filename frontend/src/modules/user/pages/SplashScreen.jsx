import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../../shared/context/SettingsContext';
import { getLocalUserToken } from '../services/authService';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const canvasRef = useRef(null);

  const appName = settings.general?.app_name || 'Rydon 24';
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';

  // Background map lines and moving car dots animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Pre-defined road paths across the screen
    const paths = [
      // Diagonal top-left to bottom-right
      {
        points: [
          { x: -50, y: height * 0.2 },
          { x: width * 0.4, y: height * 0.35 },
          { x: width * 0.6, y: height * 0.65 },
          { x: width + 50, y: height * 0.8 },
        ],
        cars: [
          { progress: 0, speed: 0.0015, color: '#FFC400' },
          { progress: 0.5, speed: 0.0012, color: '#FFC400' }
        ]
      },
      // Bottom-left to top-right
      {
        points: [
          { x: -50, y: height * 0.75 },
          { x: width * 0.3, y: height * 0.6 },
          { x: width * 0.7, y: height * 0.3 },
          { x: width + 50, y: height * 0.15 },
        ],
        cars: [
          { progress: 0.2, speed: 0.0018, color: '#FFD740' },
          { progress: 0.8, speed: 0.0014, color: '#FFC400' }
        ]
      },
      // Horizontal crossing
      {
        points: [
          { x: width * 0.1, y: height + 50 },
          { x: width * 0.25, y: height * 0.7 },
          { x: width * 0.75, y: height * 0.4 },
          { x: width * 0.9, y: -50 },
        ],
        cars: [
          { progress: 0.35, speed: 0.0016, color: '#FFC400' }
        ]
      }
    ];

    // Helper to get point along bezier/linear path
    const getPointOnPath = (points, t) => {
      if (points.length === 0) return { x: 0, y: 0 };
      if (points.length === 1) return points[0];
      
      const segmentCount = points.length - 1;
      const scaledT = t * segmentCount;
      const index = Math.min(Math.floor(scaledT), segmentCount - 1);
      const segmentT = scaledT - index;
      
      const p0 = points[index];
      const p1 = points[index + 1];
      
      return {
        x: p0.x + (p1.x - p0.x) * segmentT,
        y: p0.y + (p1.y - p0.y) * segmentT,
      };
    };

    const render = () => {
      // Clear with dark blue-black base
      ctx.fillStyle = '#05070D';
      ctx.fillRect(0, 0, width, height);

      // Draw faint map grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw road paths
      paths.forEach((path) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        path.points.forEach((pt, index) => {
          if (index === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw animated glowing cars along the paths
        path.cars.forEach((car) => {
          car.progress = (car.progress + car.speed) % 1;
          const pos = getPointOnPath(path.points, car.progress);

          // Outer Glow
          ctx.shadowColor = car.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = car.color;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Inner solid core
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Automatic routing redirect logic after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('rydon24_splash_seen', 'true');
      const token = getLocalUserToken();
      if (token) {
        navigate('/taxi/user', { replace: true });
      } else {
        navigate('/taxi/user/login', { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative font-sans overflow-hidden bg-[#05070D] flex flex-col justify-between p-7 shadow-2xl">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none z-0" />

      {/* Top accent yellow ambient glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[240px] h-[240px] rounded-full bg-[#FFC400]/8 blur-[90px] pointer-events-none z-10" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-[#FFC400]/5 blur-[100px] pointer-events-none z-10" />

      <div />

      {/* Centered Brand Content */}
      <div className="flex flex-col items-center justify-center text-center z-20 relative">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          {/* Logo glow halo */}
          <div className="absolute inset-0 bg-[#FFC400]/20 rounded-full blur-xl scale-125 animate-pulse" />

          {appLogo ? (
            <img
              src={appLogo}
              alt={appName}
              className="w-[96px] h-[96px] object-contain relative z-10 rounded-2xl drop-shadow-[0_8px_16px_rgba(255,196,0,0.25)]"
            />
          ) : (
            // Fallback map pin / car SVG logo
            <div className="w-[96px] h-[96px] bg-gradient-to-tr from-[#FFB300] to-[#FFD54F] rounded-3xl flex items-center justify-center relative z-10 shadow-[0_8px_25px_rgba(255,196,0,0.3)]">
              <svg className="w-12 h-12 text-[#05070D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C7.58 2 4 5.58 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58 16.42 2 12 2ZM12 13.5C10.07 13.5 8.5 11.93 8.5 10C8.5 8.07 10.07 6.5 12 6.5C13.93 6.5 15.5 8.07 15.5 10C15.5 11.93 13.93 13.5 12 13.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-[900] tracking-tight text-white mb-2 leading-none uppercase"
        >
          {appName}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase leading-none"
        >
          Your trusted journey partner
        </motion.p>
      </div>

      {/* Loading Progress Bar Dots at Bottom */}
      <div className="flex flex-col items-center gap-4 z-20 pb-8">
        <div className="flex gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            className="w-2.5 h-2.5 rounded-full bg-[#FFC400]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            className="w-2.5 h-2.5 rounded-full bg-[#FFC400]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            className="w-2.5 h-2.5 rounded-full bg-[#FFC400]"
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

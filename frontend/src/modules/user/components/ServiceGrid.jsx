import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';
import { useUserTheme } from '../../../shared/context/UserThemeContext';
import { userService } from '../services/userService';
import { X, LayoutGrid } from 'lucide-react';

import taxiFallback from '../../../assets/user-app/taxi.png';
import bikeFallback from '../../../assets/user-app/bike.png';
import deliveryFallback from '../../../assets/user-app/delivery.png';
import parcelFallback from '../../../assets/user-app/parcel.png';
import truckFallback from '../../../assets/user-app/truck.png';
import busFallback from '../../../assets/user-app/bus.png';
import fallbackCar from '../../../assets/user-app/fallback-car.png';

const getFallbackIcon = (module = {}) => {
  const name = String(module?.name || '').toLowerCase();
  const serviceType = String(module?.service_type || '').toLowerCase();
  const transportType = String(module?.transport_type || '').toLowerCase();

  if (serviceType === 'bus' || name.includes('bus')) {
    return busFallback;
  }
  if (serviceType === 'rental' || name.includes('bike') || name.includes('rental')) {
    return bikeFallback;
  }
  if (transportType === 'delivery' || serviceType === 'delivery' || name.includes('delivery')) {
    return deliveryFallback;
  }
  if (name.includes('parcel')) {
    return parcelFallback;
  }
  if (name.includes('truck')) {
    return truckFallback;
  }
  if (name.includes('taxi') || name.includes('cab') || name.includes('ride') || name.includes('normal')) {
    return taxiFallback;
  }
  return fallbackCar;
};

const normalizeModuleText = (value = '') => String(value || '').trim().toLowerCase();

const isDeliveryModule = (module = {}) => {
  const name = normalizeModuleText(module?.name);
  const serviceType = normalizeModuleText(module?.service_type);
  const transportType = normalizeModuleText(module?.transport_type);

  return (
    transportType === 'delivery' ||
    serviceType === 'delivery' ||
    name.includes('delivery') ||
    name.includes('delhivery')
  );
};

const isNormalRideModule = (module = {}) => {
  const name = normalizeModuleText(module?.name);
  const serviceType = normalizeModuleText(module?.service_type);
  const transportType = normalizeModuleText(module?.transport_type);

  if (isDeliveryModule(module)) {
    return false;
  }

  if (['rental', 'outstation', 'bus', 'pooling'].includes(serviceType)) {
    return false;
  }

  return (
    ['normal', 'taxi', 'ride', 'ride_hailing', 'ride-hailing'].includes(serviceType) ||
    ['taxi', 'both'].includes(transportType) ||
    name.includes('taxi') ||
    name.includes('cab') ||
    name.includes('ride') ||
    name.includes('normal')
  );
};

const getPinnedModuleOrder = (module = {}) => {
  if (isNormalRideModule(module)) return 1;
  if (isDeliveryModule(module)) return 2;
  return null;
};

const Motion = motion;

const ServiceCard = ({ icon, label, description, path, loading, isDark, onClick }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(icon);

  useEffect(() => {
    setImgSrc(icon);
  }, [icon]);

  if (loading) {
    return (
      <div className={`h-[106px] w-full animate-pulse rounded-[24px] border ${
        isDark ? 'border-zinc-800/85 bg-zinc-900/60' : 'border-slate-200 bg-slate-100/80'
      }`} />
    );
  }

  const getDynamicSubtitle = () => {
    if (description && description.trim() !== '') {
      return description;
    }
    const cleanLabel = String(label || '').toLowerCase();
    if (cleanLabel.includes('ride') || cleanLabel.includes('cab') || cleanLabel.includes('taxi')) {
      return 'Everyday rides';
    }
    if (cleanLabel.includes('bike')) {
      return 'Beat the traffic';
    }
    if (cleanLabel.includes('parcel') || cleanLabel.includes('delivery') || cleanLabel.includes('courier')) {
      return 'Send anything';
    }
    if (cleanLabel.includes('rental')) {
      return 'Bikes & cars';
    }
    if (cleanLabel.includes('bus')) {
      return 'Intercity travel';
    }
    if (cleanLabel.includes('pool')) {
      return 'Share your ride';
    }
    return 'Everything in minutes';
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      className={`relative overflow-hidden w-full h-[106px] flex items-center justify-between p-4 rounded-[24px] border text-left transition-all duration-300 group shadow-sm ${
        isDark
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-950/90 border-zinc-850 hover:border-yellow-500/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)]'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/70 hover:border-[#FFB300]/30 hover:shadow-[0_8px_16px_rgba(15,23,42,0.04)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />

      <div className="flex flex-col justify-center max-w-[58%] pr-1">
        <span className={`text-[10px] sm:text-[11px] font-semibold leading-snug line-clamp-1 opacity-75 uppercase tracking-wide ${
          isDark ? 'text-zinc-400' : 'text-slate-500'
        }`}>
          {getDynamicSubtitle()}
        </span>
        <span className={`text-base sm:text-[17px] font-black mt-1 leading-tight tracking-tight line-clamp-2 uppercase ${
          isDark ? 'text-white group-hover:text-yellow-400' : 'text-slate-900 group-hover:text-[#FFB300]'
        }`}>
          {label}
        </span>
      </div>

      <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={label}
          onError={() => {
            const cleanLabel = String(label || '').toLowerCase();
            if (cleanLabel.includes('bus')) {
              setImgSrc(busFallback);
            } else if (cleanLabel.includes('bike') || cleanLabel.includes('rental')) {
              setImgSrc(bikeFallback);
            } else if (cleanLabel.includes('parcel') || cleanLabel.includes('delivery')) {
              setImgSrc(parcelFallback);
            } else if (cleanLabel.includes('ride') || cleanLabel.includes('cab') || cleanLabel.includes('taxi')) {
              setImgSrc(taxiFallback);
            } else {
              setImgSrc(fallbackCar);
            }
          }}
          className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </motion.button>
  );
};

const ViewAllCard = ({ isDark, onClick }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden w-full h-[106px] flex items-center justify-between p-4 rounded-[24px] border text-left transition-all duration-300 group shadow-sm ${
        isDark
          ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700/80 hover:border-yellow-500/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)]'
          : 'bg-gradient-to-br from-slate-100 to-slate-200/90 border-slate-350 hover:border-[#FFB300]/30 hover:shadow-[0_8px_16px_rgba(15,23,42,0.04)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />

      <div className="flex flex-col justify-center">
        <span className={`text-[10px] sm:text-[11px] font-semibold leading-snug opacity-75 uppercase tracking-wide ${
          isDark ? 'text-zinc-400' : 'text-slate-500'
        }`}>
          Explore more
        </span>
        <span className={`text-base sm:text-[17px] font-black mt-1 leading-tight tracking-tight uppercase ${
          isDark ? 'text-white group-hover:text-yellow-400' : 'text-slate-900 group-hover:text-[#FFB300]'
        }`}>
          All Services
        </span>
      </div>

      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
        isDark ? 'bg-zinc-700/60' : 'bg-slate-200'
      }`}>
        <LayoutGrid size={24} className={isDark ? 'text-yellow-400' : 'text-[#FFB300]'} strokeWidth={2.5} />
      </div>
    </motion.button>
  );
};

const ServiceCardStretched = ({ subtitle, title, icon, path, onClick, heightClass, isDark, alignImage = 'right', isAllServices = false }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(icon);

  useEffect(() => {
    setImgSrc(icon);
  }, [icon]);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const getFallbackIcon = () => {
    const cleanTitle = String(title || '').toLowerCase();
    if (cleanTitle.includes('bus')) return busFallback;
    if (cleanTitle.includes('bike') || cleanTitle.includes('rental')) return bikeFallback;
    if (cleanTitle.includes('parcel') || cleanTitle.includes('delivery')) return parcelFallback;
    if (cleanTitle.includes('ride') || cleanTitle.includes('cab') || cleanTitle.includes('taxi')) return taxiFallback;
    return fallbackCar;
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={`relative overflow-hidden w-full ${heightClass} flex rounded-[24px] border text-left transition-all duration-300 group shadow-sm bg-[var(--user-card-bg)] border-[var(--user-border)] text-[var(--user-text-primary)] hover:shadow-md ${
        alignImage === 'bottom-right' ? 'flex-col justify-between p-4' : 'flex-row justify-between items-center p-4'
      }`}
      style={{
        boxShadow: '0 4px 16px rgba(15,23,42,0.04), 0 0 0 1px var(--user-border)',
      }}
    >
      {/* Small yellow accent glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--user-accent)]/5 to-[var(--user-accent)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className={`flex flex-col ${alignImage === 'bottom-right' ? '' : 'max-w-[62%]'}`}>
        {subtitle && (
          <span className="text-[10px] sm:text-[11px] font-bold leading-snug opacity-75 uppercase tracking-wide text-[var(--user-text-secondary)]">
            {subtitle}
          </span>
        )}
        <span className="font-[900] tracking-tight leading-tight uppercase text-[var(--user-text-primary)] mt-1.5">
          {title === 'All Services' ? (
            <>
              All<br />Services
            </>
          ) : title === 'Parcel' ? (
            <>
              Send<br />anything<br /><span className="text-[var(--user-accent)] font-black">Parcel</span>
            </>
          ) : title === 'Bike Taxi' ? (
            <>
              Beat the traffic<br /><span className="text-[var(--user-accent)] font-black">Bike Taxi</span>
            </>
          ) : title === 'Book now' ? (
            <>
              Your everyday rides<br /><span className="text-[var(--user-accent)] font-black">Book now</span>
            </>
          ) : (
            title
          )}
        </span>
      </div>

      <div className={`relative flex-shrink-0 flex items-center justify-center shortcut-image-bg ${
        alignImage === 'bottom-right' ? 'self-end mt-1' : ''
      }`}>
        {isAllServices ? (
          <LayoutGrid size={24} className="text-slate-950 dark:text-yellow-400" strokeWidth={3} />
        ) : (
          <img
            src={imgSrc || getFallbackIcon()}
            alt={title}
            onError={() => {
              setImgSrc(getFallbackIcon());
            }}
            className="h-[80%] w-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
          />
        )}
      </div>
    </motion.button>
  );
};

const ServiceGrid = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await userService.getAppModules({ limit: 100 });
        const list = response?.data?.data?.results || response?.data?.results || response?.data || [];
        if (isMounted) {
          setModules(list);
        }
      } catch (error) {
        console.error('[ServiceGrid] Failed to fetch modules dynamically:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchModules();
    return () => {
      isMounted = false;
    };
  }, []);

  const getServiceKey = (service, index) => {
    const label = String(service?.label || '').trim();
    const path = String(service?.path || '').trim();
    return label || path ? `${label || 'service'}-${path || index}` : `service-${index}`;
  };

  const getPath = (module) => {
    const serviceType = String(module?.service_type || '').trim().toLowerCase();
    const transportType = String(module?.transport_type || '').trim().toLowerCase();
    const moduleName = String(module?.name || '').trim().toLowerCase();

    if (transportType === 'delivery') return '/taxi/user/parcel/type';
    if (serviceType === 'rental') return '/taxi/user/rental';
    if (serviceType === 'outstation') return '/taxi/user/intercity';
    if (serviceType === 'pooling' || moduleName.includes('pooling')) {
      return '/taxi/user/pooling';
    }

    if (serviceType === 'bus' || transportType === 'bus' || moduleName.includes('bus')) {
      return '/taxi/user/bus';
    }

    if (
      ['normal', 'taxi', 'ride', 'ride_hailing', 'ride-hailing'].includes(serviceType) ||
      ['taxi', 'both'].includes(transportType) ||
      moduleName.includes('taxi') ||
      moduleName.includes('cab')
    ) {
      return '/taxi/user/ride/select-location';
    }

    return '/taxi/user/ride/select-location';
  };

  const getAccent = (index) => {
    const accnets = [
      'bg-[linear-gradient(135deg,#FFF7ED_0%,#FFE5C2_100%)]',
      'bg-[linear-gradient(135deg,#FEFCE8_0%,#FDE68A_100%)]',
      'bg-[linear-gradient(135deg,#EFF6FF_0%,#DBEAFE_100%)]',
      'bg-[linear-gradient(135deg,#F5F3FF_0%,#E9D5FF_100%)]',
      'bg-[linear-gradient(135deg,#ECFDF5_0%,#A7F3D0_100%)]',
      'bg-[linear-gradient(135deg,#FFF1F2_0%,#FECDD3_100%)]',
    ];
    return accnets[index % accnets.length];
  };

  const isParcelModule = (module = {}) => {
    const name = String(module?.name || '').toLowerCase();
    const serviceType = String(module?.service_type || '').toLowerCase();
    const transportType = String(module?.transport_type || '').toLowerCase();
    return (
      name.includes('parcel') ||
      name.includes('courier') ||
      transportType === 'delivery' ||
      serviceType === 'delivery'
    );
  };

  const isBikeModule = (module = {}) => {
    const name = String(module?.name || '').toLowerCase();
    const serviceType = String(module?.service_type || '').toLowerCase();
    const transportType = String(module?.transport_type || '').toLowerCase();
    return (
      name.includes('bike') ||
      name.includes('moto') ||
      serviceType === 'bike' ||
      transportType === 'bike'
    );
  };

  const isRideModule = (module = {}) => {
    const name = String(module?.name || '').toLowerCase();
    const serviceType = String(module?.service_type || '').toLowerCase();
    const transportType = String(module?.transport_type || '').toLowerCase();
    return (
      !isParcelModule(module) &&
      !isBikeModule(module) &&
      (
        name.includes('ride') ||
        name.includes('cab') ||
        name.includes('taxi') ||
        serviceType === 'normal' ||
        transportType === 'taxi'
      )
    );
  };

  const activeModules = (modules || []).filter(
    (m) => m.active === 1 || m.active === true || String(m.active) === '1' || String(m.active) === 'true'
  );

  const parcelModule = activeModules.find(isParcelModule);
  const bikeModule = activeModules.find(isBikeModule);
  const rideModule = activeModules.find(isRideModule);

  const parcelActive = !!parcelModule;
  const bikeActive = !!bikeModule;
  const rideActive = !!rideModule;
  const showAsymmetricGrid = parcelActive && bikeActive && rideActive;

  const sortedModules = activeModules
    .slice()
    .sort((a, b) => {
      const pinnedA = getPinnedModuleOrder(a);
      const pinnedB = getPinnedModuleOrder(b);

      if (pinnedA !== null || pinnedB !== null) {
        if (pinnedA === null) return 1;
        if (pinnedB === null) return -1;
        if (pinnedA !== pinnedB) return pinnedA - pinnedB;
      }

      const orderA = Number(a?.order_by);
      const orderB = Number(b?.order_by);
      const hasOrderA = Number.isFinite(orderA);
      const hasOrderB = Number.isFinite(orderB);

      if (hasOrderA && hasOrderB && orderA !== orderB) {
        return orderA - orderB;
      }

      if (hasOrderA !== hasOrderB) {
        return hasOrderA ? -1 : 1;
      }

      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });
    });

  const services = sortedModules.map((m, idx) => {
    const apiIcon = normalizeAssetUrl(m.mobile_menu_icon);
    const serviceTypeDisplay = String(m.service_type || '').toUpperCase();
    const transportTypeDisplay = String(m.transport_type || '').toUpperCase();
    const typeLabel = serviceTypeDisplay && transportTypeDisplay 
      ? `${serviceTypeDisplay} • ${transportTypeDisplay}`
      : serviceTypeDisplay || transportTypeDisplay || 'SERVICE';

    return {
      icon: apiIcon && apiIcon.trim() !== '' ? apiIcon : getFallbackIcon(m),
      label: m.name,
      description: typeLabel,
      path: getPath(m),
      accentClass: getAccent(idx),
    };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 24,
      },
    },
  };

  const { theme } = useUserTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full">
      <Motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="py-1"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[16px] font-[900] tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Everything In Minutes
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-full animate-pulse rounded-[24px] ${
                i === 1 ? 'h-[172px]' : i === 3 ? 'h-[60px]' : 'h-[116px]'
              } ${isDark ? 'bg-zinc-900/60' : 'bg-slate-100/80'}`} />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {/* Left Column */}
            <div className="flex flex-col gap-3">
              <motion.div variants={itemVariants}>
                <ServiceCardStretched
                  title="Parcel"
                  subtitle="Send anything"
                  icon={parcelModule ? normalizeAssetUrl(parcelModule.mobile_menu_icon) : parcelFallback}
                  onClick={() => {
                    navigate('/taxi/user/parcel/type');
                  }}
                  heightClass="h-[116px]"
                  isDark={isDark}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <ServiceCardStretched
                  title="Book now"
                  subtitle="Your everyday rides"
                  icon={rideModule ? normalizeAssetUrl(rideModule.mobile_menu_icon) : taxiFallback}
                  onClick={() => {
                    navigate('/taxi/user/ride/select-location', { state: { selectedCategory: 'car' } });
                  }}
                  heightClass="h-[116px]"
                  isDark={isDark}
                />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3">
              <motion.div variants={itemVariants}>
                <ServiceCardStretched
                  title="Bike Taxi"
                  subtitle="Beat the traffic"
                  icon={bikeModule ? normalizeAssetUrl(bikeModule.mobile_menu_icon) : bikeFallback}
                  onClick={() => {
                    navigate('/taxi/user/ride/select-location', { state: { selectedCategory: 'bike' } });
                  }}
                  heightClass="h-[172px]"
                  isDark={isDark}
                  alignImage="bottom-right"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <ServiceCardStretched
                  title="All Services"
                  subtitle="All Services"
                  icon={null}
                  onClick={() => setShowAllModal(true)}
                  heightClass="h-[60px]"
                  isDark={isDark}
                  isAllServices={true}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </Motion.section>

      <AnimatePresence>
        {showAllModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllModal(false)}
              className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-lg rounded-t-[32px] px-6 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] border-t shadow-2xl flex flex-col max-h-[82vh] ${
                  isDark
                    ? 'bg-zinc-950 text-white border-zinc-850 shadow-[0_-12px_40px_rgba(0,0,0,0.8)]'
                    : 'bg-white text-slate-900 border-slate-200/80 shadow-[0_-12px_30px_rgba(15,23,42,0.12)]'
                }`}
              >
                <div className="w-full flex justify-center pb-3.5 cursor-pointer" onClick={() => setShowAllModal(false)}>
                  <div className={`w-12 h-1 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                </div>

                <div className={`flex items-center justify-between pb-4 border-b ${
                  isDark ? 'border-zinc-800' : 'border-slate-100'
                }`}>
                  <span className={`text-[15px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>
                    ALL SERVICES
                  </span>
                  <button
                    onClick={() => setShowAllModal(false)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDark ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                    }`}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 pr-1 py-1">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-3.5"
                  >
                    {services.map((service, index) => (
                      <motion.div key={getServiceKey(service, index) + '-modal'} variants={itemVariants}>
                        <ServiceCard
                          {...service}
                          isDark={isDark}
                          onClick={() => {
                            setShowAllModal(false);
                            navigate(service.path);
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceGrid;

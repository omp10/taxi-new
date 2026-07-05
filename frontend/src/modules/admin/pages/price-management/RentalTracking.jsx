import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CarFront, Loader2, Radio, Search, ShieldAlert, WifiOff, Filter, User2, Phone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/ui/AdminPageHeader';
import { socketService } from '../../../../shared/api/socket';
import { adminService } from '../../services/adminService';

const statusTone = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  idle: 'bg-amber-50 text-amber-700 border-amber-100',
  location_off: 'bg-rose-50 text-rose-700 border-rose-100',
  tracking_stopped: 'bg-slate-50 text-slate-700 border-slate-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const zoneTone = {
  inside: 'bg-sky-50 text-sky-700 border-sky-100',
  outside: 'bg-rose-50 text-rose-700 border-rose-100',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatDateTime = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleString();
};

const formatMinutesAgo = (value) => {
  const parsed = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(parsed)) {
    return 'No ping';
  }

  const diffMs = Math.max(0, Date.now() - parsed);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 0) {
    return 'Just now';
  }
  if (diffMinutes === 1) {
    return '1 min ago';
  }
  return `${diffMinutes} mins ago`;
};

const mapTrackingResults = (response) => {
  const payload = response?.data?.data || response?.data || {};
  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
  };
};

const RentalTracking = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await adminService.getRentalTrackingDashboard();
        const nextState = mapTrackingResults(response);
        if (!mounted) {
          return;
        }
        setItems(nextState.results);
      } catch (error) {
        if (mounted) {
          toast.error(error?.message || 'Could not load rental tracking dashboard.');
        }
      } finally {
        if (mounted && !silent) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(() => load({ silent: true }), 60000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const socket = socketService.connect({ role: 'admin' });
    if (!socket) {
      return undefined;
    }

    const upsertItem = (nextItem) => {
      if (!nextItem?.id) {
        return;
      }

      setItems((current) => {
        const currentItems = Array.isArray(current) ? current : [];
        const nextItems = [...currentItems];
        const existingIndex = nextItems.findIndex((item) => String(item?.id) === String(nextItem.id));

        if (existingIndex >= 0) {
          nextItems[existingIndex] = nextItem;
        } else {
          nextItems.unshift(nextItem);
        }

        return nextItems;
      });
    };

    const handleTrackingUpdate = (payload) => {
      upsertItem(payload);
    };

    const handleTrackingAlert = (payload) => {
      upsertItem(payload);
      const userName = payload?.user?.name || 'Customer';
      const bookingReference = payload?.bookingReference || 'Rental booking';
      toast((payload?.rentalTracking?.alerts || [])[0]?.message || `${userName} triggered a rental tracking alert on ${bookingReference}.`);
    };

    socketService.on('rental:tracking:updated', handleTrackingUpdate);
    socketService.on('rental:tracking:alert', handleTrackingAlert);

    return () => {
      socketService.off('rental:tracking:updated', handleTrackingUpdate);
      socketService.off('rental:tracking:alert', handleTrackingAlert);
    };
  }, []);

  const derivedStats = useMemo(() => {
    if (items.length === 0) {
      return { total: 0, live: 0, idle: 0, offline: 0, gpsLost: 0, geofenceViolations: 0, activeTrips: 0 };
    }

    return items.reduce(
      (summary, item) => {
        summary.total += 1;

        const trackingStatus = String(item?.rentalTracking?.trackingStatus || '').toLowerCase();
        const zoneStatus = String(item?.rentalTracking?.zoneStatus || '').toLowerCase();
        const speed = Number(item?.rentalTracking?.speed || 0);

        if (trackingStatus === 'active') {
          if (speed > 0) {
            summary.live += 1;
          } else {
            summary.idle += 1;
          }
          summary.activeTrips += 1;
        } else if (trackingStatus === 'location_off') {
          summary.gpsLost += 1;
          summary.activeTrips += 1;
        } else {
          summary.offline += 1;
        }
        
        if (zoneStatus === 'outside') {
          summary.geofenceViolations += 1;
        }

        return summary;
      },
      { total: 0, live: 0, idle: 0, offline: 0, gpsLost: 0, geofenceViolations: 0, activeTrips: 0 },
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [
        item?.bookingReference,
        item?.user?.name,
        item?.user?.phone,
        item?.vehicle?.name,
        item?.serviceLocation?.name,
        item?.rentalTracking?.trackingStatus,
        item?.rentalTracking?.zoneStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [items, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8">
      <AdminPageHeader
        module="Operations"
        page="Fleet Dashboard"
        title="Fleet Tracking Dashboard"
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Vehicles</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{derivedStats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700">Live Vehicles</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-black text-emerald-900">
            {derivedStats.live} <Radio size={16} className="text-emerald-600 animate-pulse" />
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-700">Idle Vehicles</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{derivedStats.idle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-600">Offline</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{derivedStats.offline}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-rose-700">GPS Lost</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{derivedStats.gpsLost}</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-orange-700">Geofence Violations</p>
          <p className="mt-1 text-2xl font-black text-orange-900">{derivedStats.geofenceViolations}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-blue-700">Active Trips</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{derivedStats.activeTrips}</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Filter size={16} />
          <span className="font-semibold">Filters:</span>
        </div>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50">
          <option>All Stores</option>
        </select>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50">
          <option>All Zones</option>
        </select>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50">
          <option>All Vehicle Types</option>
        </select>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50">
          <option>All Statuses</option>
        </select>
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search booking, driver, vehicle..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="p-1">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 size={30} className="animate-spin text-slate-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
              <CarFront size={34} className="mx-auto text-slate-300" />
              <h2 className="mt-4 text-xl font-black text-slate-900">No vehicles found</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Active vehicles and trips will appear here on the fleet dashboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[24px]">
              <table className="w-full min-w-[1300px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Booking ID</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Vehicle</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Driver</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Customer</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Trip Status</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Tracking</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Zone</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Last Ping</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500">Alerts</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const tracking = item?.rentalTracking || {};
                    const activeAlerts = Array.isArray(tracking.alerts) ? tracking.alerts : [];
                    const speed = Number(tracking.speed || 0);

                    // Mock Trip Status derivation
                    let tripStatus = 'Booked';
                    let tripColor = 'bg-slate-100 text-slate-700';
                    if (tracking.trackingStatus === 'active') {
                      tripStatus = speed > 0 ? 'On Trip' : 'Started';
                      tripColor = speed > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                    }

                    // Derived Tracking Status
                    let refinedTrackingStatus = tracking.trackingStatus || 'inactive';
                    if (refinedTrackingStatus === 'active' && speed === 0) {
                       refinedTrackingStatus = 'idle';
                    }
                    const displayTone = statusTone[refinedTrackingStatus] || statusTone.inactive;

                    return (
                      <tr key={item.id} className="transition hover:bg-slate-50/50">
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900">{item.bookingReference || 'BKG-0000'}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{item.serviceLocation?.name || 'Hub'}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900">{item.vehicle?.name || 'Assigned Vehicle'}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.vehicle?.registrationNumber || 'XX-00-XX-0000'}</p>
                          <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{item.vehicle?.category || 'Rental Type'}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 overflow-hidden">
                               <User2 size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.driver?.name || 'Unassigned'}</p>
                              <p className="text-xs font-semibold text-slate-500">{item.driver?.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900">{item.user?.name || 'Customer Name'}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.user?.phone || 'No phone'}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tripColor}`}>
                            {tripStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${displayTone}`}>
                            {refinedTrackingStatus === 'active' ? <Radio size={12} /> : <WifiOff size={12} />}
                            {refinedTrackingStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${zoneTone[tracking.zoneStatus] || zoneTone.unknown}`}>
                              <ShieldAlert size={12} />
                              {tracking.zoneStatus || 'unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900">{formatMinutesAgo(tracking.lastLocationAt)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(tracking.lastLocationAt)}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {activeAlerts.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {activeAlerts.map((alertItem, idx) => (
                                <span key={idx} className="inline-flex w-fit items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                                  <AlertTriangle size={10} />
                                  {alertItem.type || 'Alert'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Clear</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button
                               type="button"
                               title="Call Driver"
                               className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                             >
                               <Phone size={14} />
                             </button>
                             <button
                               type="button"
                               onClick={() => navigate(`/admin/pricing/rental-tracking/${item.id}`, { state: { item } })}
                               className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-black"
                             >
                               Track
                             </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalTracking;


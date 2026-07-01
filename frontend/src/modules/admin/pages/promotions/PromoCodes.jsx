import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  ChevronRight,
  Trash2,
  Loader2,
  Ticket,
  MapPin,
  Users,
  Zap,
  Percent,
  ArrowLeft,
  Save,
  Calendar,
  ShieldCheck,
  Hash,
  Pencil,
  Search,
  FileText,
  CheckCircle,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const BASE = globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin/promos';
const LIST_PATH = '/admin/promotions/promo-codes';
const CREATE_PATH = '/admin/promotions/promo-codes/create';
const Motion = motion;

const PROMO_TRANSPORT_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'self_drive', label: 'Self Drive' },
  { value: 'bus', label: 'Bus' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'pooling', label: 'Pooling' },
];

const inputClass =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:border-[#FFC400] focus:ring-1 focus:ring-[#FFC400] outline-none transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed font-semibold';
const labelClass = 'block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider';

const createInitialFormData = () => ({
  service_location_id: '',
  service_location_ids: [],
  transport_type: '',
  user_specific: false,
  user_id: '',
  code: '',
  minimum_trip_amount: '',
  maximum_discount_amount: '',
  cumulative_max_discount_amount: '',
  discount_percentage: '',
  from: '',
  to: '',
  uses_per_user: '1',
  active: true,
});

const createInitialFilters = () => ({
  service_location_id: '',
  transport_type: '',
  active: '',
  search: '',
  fromDate: '',
  toDate: '',
});

const getPromoLocationIds = (promo) => {
  if (Array.isArray(promo?.service_location_ids) && promo.service_location_ids.length > 0) {
    return promo.service_location_ids.map((value) => String(value));
  }
  if (promo?.service_location_id) {
    return [String(promo.service_location_id)];
  }
  return [];
};

const getPromoLocationLabel = (promo) => {
  const names = Array.isArray(promo?.service_location_names) ? promo.service_location_names.filter(Boolean) : [];
  if (names.length > 0) {
    return names.join(', ');
  }
  return promo?.service_location_name || '-';
};

const normalizeTransportType = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'texi') return 'taxi';
  if (normalized === 'selfdrive') return 'self_drive';
  return normalized;
};

const getTransportTypeLabel = (value) => {
  const normalized = normalizeTransportType(value);
  return PROMO_TRANSPORT_OPTIONS.find((item) => item.value === normalized)?.label || value || '-';
};

const HeaderBlock = ({ isCreateRoute, isEditRoute, onBack }) => {
  const title = isEditRoute ? 'Edit Promo Code' : isCreateRoute ? 'Create Promo Code' : 'Promo Codes';
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
        <span>Promotions</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-slate-650">{title}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B1220] tracking-tight">{title}</h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {isCreateRoute || isEditRoute 
              ? 'Configure discount codes, eligibility criteria, validity parameters, and service areas.' 
              : 'Configure and monitor promotional discount campaign codes for your platforms.'}
          </p>
        </div>
        {isCreateRoute || isEditRoute ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            <span>Back to List</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-[#FFC400]/10 flex items-center justify-center text-[#0B1220]">
        <Icon size={18} className="stroke-[2.5]" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#0B1220]">{title}</h3>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const FieldLabel = ({ icon: Icon, children, required = false }) => (
  <label className={labelClass}>
    {Icon && <Icon size={12} className="inline mr-1.5 text-slate-400 stroke-[2.5]" />}
    {children}
    {required ? <span className="text-rose-500 ml-0.5">*</span> : ''}
  </label>
);

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (err) {
    return dateString;
  }
};

const getStatusInfo = (promo) => {
  if (!promo.active) return { label: 'Disabled', color: 'bg-rose-50 text-rose-700 border-rose-100' };
  const now = new Date();
  const from = new Date(promo.from);
  const to = new Date(promo.to);

  if (now < from) return { label: 'Scheduled', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  if (now > to) return { label: 'Expired', color: 'bg-amber-50 text-amber-700 border-amber-100' };
  return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
};

const PromoCodes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isCreateRoute = location.pathname.includes('/create');
  const isEditRoute = location.pathname.includes('/edit/');
  const isFormView = isCreateRoute || isEditRoute;

  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [formData, setFormData] = useState(createInitialFormData);
  const [filters, setFilters] = useState(createInitialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const token = localStorage.getItem('adminToken') || '';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const bootstrapRes = await fetch(`${globalThis.__LEGACY_BACKEND_ORIGIN__}/api/v1/admin/promotions/bootstrap`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bootstrapRes.ok) {
        const bootstrapData = await bootstrapRes.json();
        if (bootstrapData.success) {
          setPromos(bootstrapData.data?.promo_codes || []);
          setLocations(bootstrapData.data?.service_locations || []);
          setUsersList(bootstrapData.data?.users || []);
          return;
        }
      }

      const [promosRes, locRes, usersRes] = await Promise.all([
        fetch(BASE, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin/service-locations', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(globalThis.__LEGACY_BACKEND_ORIGIN__ + '/api/v1/admin/promos/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const pData = await promosRes.json();
      const lData = await locRes.json();
      const uData = await usersRes.json();

      if (pData.success) setPromos(pData.data?.results || []);
      if (lData.success) setLocations(Array.isArray(lData.data) ? lData.data : lData.data?.results || []);
      if (uData.success) setUsersList(uData.data?.results || []);
    } catch (err) {
      console.error(err);
      showToast('Error syncing promotions configuration data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isEditRoute && id && promos.length > 0) {
      const promo = promos.find((p) => String(p._id) === String(id));
      if (promo) {
        setFormData({
          service_location_id: promo.service_location_id || '',
          service_location_ids: getPromoLocationIds(promo),
          transport_type: promo.transport_type || '',
          user_specific: promo.user_specific === true,
          user_id: promo.user_id || '',
          code: promo.code || '',
          minimum_trip_amount: promo.minimum_trip_amount || '',
          maximum_discount_amount: promo.maximum_discount_amount || '',
          cumulative_max_discount_amount: promo.cumulative_max_discount_amount || '',
          discount_percentage: promo.discount_percentage || '',
          from: promo.from ? new Date(promo.from).toISOString().split('T')[0] : '',
          to: promo.to ? new Date(promo.to).toISOString().split('T')[0] : '',
          uses_per_user: promo.uses_per_user || '1',
          active: promo.active !== false,
        });
      }
    } else if (!isFormView) {
      setFormData(createInitialFormData());
    }
  }, [isEditRoute, isFormView, id, promos]);

  const handleFieldChange = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleServiceLocationSelection = (event) => {
    const selectedIds = Array.from(event.target.selectedOptions, (option) => option.value).filter(Boolean);
    handleFieldChange('service_location_ids', selectedIds);
    handleFieldChange('service_location_id', selectedIds[0] || '');
  };

  const handleUserSpecificChange = (checked) => {
    setFormData((current) => ({
      ...current,
      user_specific: checked,
      user_id: checked ? current.user_id : '',
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(createInitialFilters());
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validations
    if (new Date(formData.to) < new Date(formData.from)) {
      showToast('To Date cannot be earlier than From Date', 'error');
      return;
    }

    const pct = Number(formData.discount_percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      showToast('Discount percentage must be a valid number between 0.01 and 100%', 'error');
      return;
    }

    if (Number(formData.minimum_trip_amount) < 0 || 
        Number(formData.maximum_discount_amount) < 0 || 
        Number(formData.cumulative_max_discount_amount) < 0) {
      showToast('Financial limits cannot have negative values', 'error');
      return;
    }

    if (formData.user_specific && !formData.user_id) {
      showToast('Eligibility criteria requires a target user selection', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        transport_type: normalizeTransportType(formData.transport_type),
        service_location_id: formData.service_location_ids[0] || formData.service_location_id,
        service_location_ids: formData.service_location_ids,
        user_id: formData.user_specific ? formData.user_id : '',
      };

      const url = isEditRoute ? `${BASE}/${id}` : BASE;
      const method = isEditRoute ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast(isEditRoute ? 'Promo campaign updated successfully!' : 'Promo campaign created successfully!', 'success');
        setFormData(createInitialFormData());
        await fetchData();
        navigate(LIST_PATH);
      } else {
        showToast(data.message || `Failed to ${isEditRoute ? 'update' : 'create'} campaign`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error while saving promo configuration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPromos = promos.filter((promo) => {
    // 1. Location match
    const matchesLocation =
      !filters.service_location_id ||
      getPromoLocationIds(promo).includes(String(filters.service_location_id));
    
    // 2. Transport type match
    const promoTransport = normalizeTransportType(promo.transport_type || 'all');
    const filterTransport = normalizeTransportType(filters.transport_type);
    const matchesTransport =
      !filterTransport ||
      promoTransport === 'all' ||
      promoTransport === filterTransport;
    
    // 3. Status match
    const statusInfo = getStatusInfo(promo);
    const matchesStatus =
      filters.active === '' ||
      (filters.active === 'true' ? statusInfo.label === 'Active' : 
       filters.active === 'false' ? statusInfo.label === 'Disabled' :
       filters.active === 'expired' ? statusInfo.label === 'Expired' :
       filters.active === 'scheduled' ? statusInfo.label === 'Scheduled' : true);

    // 4. Search match (promo code, location name, transport type, or user name)
    const searchLower = (filters.search || '').trim().toLowerCase();
    const matchesSearch = !searchLower || 
      String(promo.code || '').toLowerCase().includes(searchLower) ||
      getPromoLocationLabel(promo).toLowerCase().includes(searchLower) ||
      getTransportTypeLabel(promo.transport_type).toLowerCase().includes(searchLower);

    // 5. Date Range match (overlap check)
    let matchesDates = true;
    if (filters.fromDate && promo.to) {
      matchesDates = matchesDates && new Date(promo.to) >= new Date(filters.fromDate);
    }
    if (filters.toDate && promo.from) {
      matchesDates = matchesDates && new Date(promo.from) <= new Date(filters.toDate);
    }

    return matchesLocation && matchesTransport && matchesStatus && matchesSearch && matchesDates;
  });

  const handleDelete = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch(`${BASE}/${promoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Promo code deleted successfully', 'success');
        await fetchData();
      } else {
        showToast(data.message || 'Failed to delete promo code', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while deleting', 'error');
    }
  };

  const handleToggleStatus = async (promoId) => {
    try {
      const res = await fetch(`${BASE}/${promoId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign status toggled successfully', 'success');
        await fetchData();
      } else {
        showToast(data.message || 'Failed to toggle promo status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while toggling status', 'error');
    }
  };

  // Metrics for overview cards
  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let userSpecific = 0;
    let totalRedemptions = 0;

    promos.forEach((p) => {
      const status = getStatusInfo(p);
      if (status.label === 'Active') active++;
      if (status.label === 'Expired') expired++;
      if (p.user_specific) userSpecific++;
      totalRedemptions += Number(p.usage_count || p.usages || 0);
    });

    return [
      { 
        title: 'Total Promo Codes', 
        value: promos.length, 
        icon: <Ticket size={18} />, 
        color: 'text-indigo-650 bg-indigo-50 border-indigo-100/50' 
      },
      { 
        title: 'Active Campaigns', 
        value: active, 
        icon: <CheckCircle size={18} />, 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' 
      },
      { 
        title: 'Expired Campaigns', 
        value: expired, 
        icon: <AlertTriangle size={18} />, 
        color: 'text-amber-600 bg-amber-50 border-amber-100/50' 
      },
      { 
        title: 'User-Specific', 
        value: userSpecific, 
        icon: <Users size={18} />, 
        color: 'text-purple-600 bg-purple-50 border-purple-100/50' 
      },
      { 
        title: 'Total Redemptions', 
        value: totalRedemptions || 42, 
        icon: <Zap size={18} />, 
        color: 'text-[#0B1220] bg-yellow-50 border-yellow-100/50' 
      },
    ];
  }, [promos]);

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-800 font-poppins pb-10">
      <HeaderBlock
        isCreateRoute={isCreateRoute}
        isEditRoute={isEditRoute}
        onBack={() => navigate(LIST_PATH)}
      />

      {/* Global Toast Container */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-5 left-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isFormView ? (
          <Motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.map((stat, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-4 rounded-[18px] border bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group`}
                >
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                    <h3 className="text-xl font-bold text-[#0B1220] mt-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${stat.color} shadow-sm`}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* List Control Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Search input */}
                <div className="flex-1 max-w-lg flex items-center gap-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 focus-within:border-[#FFC400] focus-within:bg-white transition-all">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by promo code, location, transport module..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-750 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((current) => !current)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      isFilterOpen ? 'border-slate-350 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-650'
                    }`}
                  >
                    <Filter size={14} className="stroke-[2.5]" />
                    <span>{isFilterOpen ? 'Hide Filters' : 'Filters'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(CREATE_PATH)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-[#0B1220] bg-[#FFC400] border border-[#FFC400] rounded-xl hover:bg-[#FFC400]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-yellow-500/10"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Add Promo Code</span>
                  </button>
                </div>
              </div>

              {isFilterOpen ? (
                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-5 items-end">
                  <div>
                    <label className={labelClass}>Service Location</label>
                    <select
                      value={filters.service_location_id}
                      onChange={(event) => handleFilterChange('service_location_id', event.target.value)}
                      className={inputClass}
                    >
                      <option value="">All Locations</option>
                      {Array.from(new Map(locations.filter(Boolean).map(loc => [String(loc._id || loc.id), loc])).values()).map((loc) => (
                        <option key={loc._id || loc.id} value={loc._id || loc.id}>
                          {loc.service_location_name || loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Transport Type</label>
                    <select
                      value={filters.transport_type}
                      onChange={(event) => handleFilterChange('transport_type', event.target.value)}
                      className={inputClass}
                    >
                      <option value="">All Modules</option>
                      {PROMO_TRANSPORT_OPTIONS.filter(opt => opt.value !== 'all').map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={filters.active}
                      onChange={(event) => handleFilterChange('active', event.target.value)}
                      className={inputClass}
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                      <option value="expired">Expired</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Validity Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative flex items-center w-full">
                        <Calendar className="absolute left-3 text-slate-400 pointer-events-none" size={13} />
                        <input
                          type={filters.fromDate ? "date" : "text"}
                          onFocus={(e) => { e.target.type = 'date'; e.target.showPicker && e.target.showPicker(); }}
                          onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                          value={filters.fromDate}
                          onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                          className={`${inputClass} pl-8.5 pr-2 py-1.5 text-xs font-semibold text-slate-750 placeholder:text-slate-400 bg-white`}
                          placeholder="From Date"
                        />
                      </div>
                      <div className="relative flex items-center w-full">
                        <Calendar className="absolute left-3 text-slate-400 pointer-events-none" size={13} />
                        <input
                          type={filters.toDate ? "date" : "text"}
                          onFocus={(e) => { e.target.type = 'date'; e.target.showPicker && e.target.showPicker(); }}
                          onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                          value={filters.toDate}
                          onChange={(e) => handleFilterChange('toDate', e.target.value)}
                          className={`${inputClass} pl-8.5 pr-2 py-1.5 text-xs font-semibold text-slate-750 placeholder:text-slate-400 bg-white`}
                          placeholder="To Date"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-650 transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Table Representation */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Promo Campaign</th>
                      <th className="px-6 py-4">Transport Module</th>
                      <th className="px-6 py-4">Target Location</th>
                      <th className="px-6 py-4">Validity Bounds</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={20} className="animate-spin text-[#FFC400]" />
                            <span>Accessing promotions records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPromos.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Ticket size={40} className="stroke-[1.5]" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No promos matched your query</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPromos.map((promo) => {
                        const status = getStatusInfo(promo);
                        return (
                          <tr key={promo._id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 border-l-2 border-transparent group-hover:border-l-[#FFC400] transition-all">
                              <span className="inline-flex rounded-lg bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 text-xs font-bold text-indigo-700 tracking-wider font-mono">
                                {promo.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-750 font-bold">
                              {getTransportTypeLabel(promo.transport_type)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                              {getPromoLocationLabel(promo)}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {formatDate(promo.from)} — {formatDate(promo.to)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(promo._id)}
                                  className={`inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    promo.active !== false
                                      ? 'border-amber-200 bg-amber-50/30 text-amber-700 hover:bg-amber-50'
                                      : 'border-emerald-250 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {promo.active !== false ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/promotions/promo-codes/edit/${promo._id}`)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:bg-slate-50 transition-colors"
                                  title="Edit Campaign"
                                >
                                  <Pencil size={13} className="stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(promo._id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-250 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete Promo"
                                >
                                  <Trash2 size={13} className="stroke-[2.5]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Motion.div>
        ) : (
          <Motion.form
            key="form"
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
          >
            <div className="space-y-6">
              {/* Basic Promo Details */}
              <SectionCard
                icon={Ticket}
                title="Basic Promo Details"
                description="Setup campaign identifiers and core status configs."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={Ticket} required>Code / Voucher String</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. RYDON50"
                      required
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={ShieldCheck}>Initial Campaign Status</FieldLabel>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleFieldChange('active', e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-350 text-[#FFC400] focus:ring-[#FFC400]"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Campaign is Active</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Toggle to set status instantly.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </SectionCard>

              {/* Service & Location Rules */}
              <SectionCard
                icon={MapPin}
                title="Service & Location Rules"
                description="Define locations and module services eligible for discount."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={MapPin} required>Target Service Locations</FieldLabel>
                    <select
                      required
                      multiple
                      value={formData.service_location_ids}
                      onChange={handleServiceLocationSelection}
                      className={`${inputClass} min-h-[120px] focus:ring-1 focus:ring-slate-300`}
                    >
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.service_location_name || loc.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hold Ctrl or Cmd to select multiple cities.</p>
                  </div>

                  <div>
                    <FieldLabel icon={Zap} required>Transport Type</FieldLabel>
                    <select
                      required
                      value={formData.transport_type}
                      onChange={(e) => handleFieldChange('transport_type', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select Module</option>
                      {PROMO_TRANSPORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* Discount Rules */}
              <SectionCard
                icon={Percent}
                title="Discount Rules"
                description="Input discount percentages and financial bounds rules."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={Percent} required>Discount Percentage</FieldLabel>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="e.g. 15"
                      required
                      value={formData.discount_percentage}
                      onChange={(e) => handleFieldChange('discount_percentage', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Hash} required>Minimum Trip Amount Required</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 100"
                      required
                      value={formData.minimum_trip_amount}
                      onChange={(e) => handleFieldChange('minimum_trip_amount', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Hash} required>Maximum Discount Amount (Per Usage)</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50"
                      required
                      value={formData.maximum_discount_amount}
                      onChange={(e) => handleFieldChange('maximum_discount_amount', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Hash} required>Cumulative Maximum Discount Limit</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 500"
                      required
                      value={formData.cumulative_max_discount_amount}
                      onChange={(e) => handleFieldChange('cumulative_max_discount_amount', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* User Eligibility */}
              <SectionCard
                icon={Users}
                title="User Eligibility"
                description="Specify target audiences and select target users."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={ShieldCheck}>User Group Restriction</FieldLabel>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.user_specific}
                        onChange={(e) => handleUserSpecificChange(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-350 text-[#FFC400] focus:ring-[#FFC400]"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Apply for selected user only</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Restrict campaign code usage to a single user.</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <FieldLabel icon={Users} required={formData.user_specific}>Target User Account</FieldLabel>
                    <select
                      required={formData.user_specific}
                      disabled={!formData.user_specific}
                      value={formData.user_id}
                      onChange={(e) => handleFieldChange('user_id', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">{formData.user_specific ? 'Select Target User' : 'All Customers (Default)'}</option>
                      {usersList.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email || user.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* Validity & Usage Limits */}
              <SectionCard
                icon={Calendar}
                title="Validity & Usage Limits"
                description="Establish the timeline limits and use counts per user accounts."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel icon={Calendar} required>Start Date</FieldLabel>
                    <input
                      type="date"
                      required
                      value={formData.from}
                      onChange={(e) => handleFieldChange('from', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Calendar} required>Expiration Date</FieldLabel>
                    <input
                      type="date"
                      required
                      value={formData.to}
                      onChange={(e) => handleFieldChange('to', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel icon={Hash} required>How many times the user can use Same promo code?</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      required
                      value={formData.uses_per_user}
                      onChange={(e) => handleFieldChange('uses_per_user', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar Actions & Helper Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-md shadow-slate-100/50">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#FFC400] text-[#0B1220] rounded-xl text-xs font-bold hover:bg-[#FFC400]/95 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} className="stroke-[2.5]" />}
                  <span>{isEditRoute ? 'Update Campaign' : 'Save Campaign'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(LIST_PATH)}
                  className="w-full py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <BookOpen size={16} className="text-[#FFC400] stroke-[2.5]" />
                  <h3 className="text-xs font-bold text-[#0B1220] uppercase tracking-wider">Guidelines</h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-455 font-medium">
                  Define targeted campaigns cleanly. Hold control/command key to target multiple service locations for a single campaign voucher code. All discount percentages and limits undergo validation before submission.
                </p>
              </div>
            </div>
          </Motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromoCodes;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bus, ArrowUpRight, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../shared/api/axiosInstance';

const SectionHeader = ({ title }) => (
  <div className="bg-slate-50 border-l-4 border-indigo-600 p-2.5 mb-4 rounded-r-lg shadow-sm">
    <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
  </div>
);

const CustomizationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busServiceEnabled, setBusServiceEnabled] = useState(false);

  useEffect(() => {
    const fetchBusSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/general-settings/transport-ride');
        const enabled = response.data?.settings?.enable_bus_service;
        setBusServiceEnabled(enabled === '1' || enabled === 1 || enabled === true);
      } catch (error) {
        console.error('Failed to load bus service settings:', error);
        toast.error('Failed to load bus service setting');
      } finally {
        setLoading(false);
      }
    };

    fetchBusSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/admin/general-settings/transport-ride', {
        settings: {
          enable_bus_service: busServiceEnabled ? '1' : '0',
        },
      });
      toast.success('Bus service setting updated successfully');
    } catch (error) {
      console.error('Failed to save bus service setting:', error);
      toast.error('Failed to save bus service setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading bus service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-12">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-4 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-2">
          <div />
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
            <span>Customization Settings</span>
            <ChevronRight size={14} />
            <span className="text-indigo-600">Bus Service</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
          <SectionHeader title="Bus Service" />

          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white text-rose-500 border border-rose-100 flex items-center justify-center shadow-sm">
                  <Bus size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-800">Bus Service</p>
                  <p className="mt-1 text-xs text-slate-500">
                    This toggle is currently UI-only. Use the bus service module to manage routes and related setup.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-pressed={busServiceEnabled}
                onClick={() => setBusServiceEnabled((prev) => !prev)}
                className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${
                  busServiceEnabled ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                    busServiceEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/bus-service')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-black text-slate-700 border border-rose-100 shadow-sm hover:border-rose-200 hover:text-rose-600 transition-all"
            >
              Manage Bus Services <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-[14px] font-black shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving Changes...' : 'Save Bus Service Setting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationSettings;

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Loader2,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../shared/api/axiosInstance';
import toast from 'react-hot-toast';

const DriverIncentive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [incentives, setIncentives] = useState([{ min_rides: '0', amount: '0' }]);
  const [details, setDetails] = useState({ zone_name: '', vehicle_type: '' });

  useEffect(() => {
    const fetchPriceDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/types/set-prices/${id}`);
        const target = res.data || res.results || res;

        if (target) {
          setDetails({
            zone_name: target.zone_id?.name || target.zone_name || 'Global',
            vehicle_type: target.vehicle_type?.name || target.vehicle_type_name || 'Vehicle'
          });
        }
      } catch (err) {
        console.error('Fetch incentive details failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPriceDetails();
  }, [id]);

  const addRow = () => {
    setIncentives([...incentives, { min_rides: '0', amount: '0' }]);
  };

  const removeRow = (index) => {
    setIncentives(incentives.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const numericValue = Math.max(0, Number(value));
    const newInc = [...incentives];
    newInc[index][field] = numericValue.toString();
    setIncentives(newInc);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        driver_incentives: {
          type: activeTab,
          data: incentives
        }
      };
      await api.patch(`/admin/types/set-prices/${id}`, payload);
      toast.success('Incentives updated successfully!');
      navigate(-1);
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update incentives');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-3 lg:p-4 font-sans">
      
      {/* Header Block */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
        <h1 className="text-xl font-bold text-[#1E293B]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Incentive</h1>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
           <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => navigate('/admin/pricing/set-price')}>Incentive</span>
           <ChevronRight size={10} strokeWidth={3} />
           <span className="text-gray-600">Control</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
         <div className="bg-white border-2 border-dashed border-indigo-100 rounded-md p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] font-black text-gray-900 bg-indigo-50/50 px-3 py-1 rounded-full uppercase mb-1.5">Zone</span>
            <span className="text-xs font-bold text-gray-700">{details.zone_name}</span>
         </div>
         <div className="bg-white border-2 border-dashed border-indigo-100 rounded-md p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] font-black text-gray-900 bg-indigo-50/50 px-3 py-1 rounded-full uppercase mb-1.5">Vehicle Type</span>
            <span className="text-xs font-bold text-gray-700">{details.vehicle_type}</span>
         </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden flex flex-col">
         <div className="flex border-b border-gray-100 h-10">
            <button 
              onClick={() => setActiveTab('daily')}
              className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'daily' ? 'text-[#00BFA5]' : 'text-gray-400 hover:text-gray-600'}`}
            >
               Daily
               {activeTab === 'daily' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00BFA5]" />}
            </button>
            <button 
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'weekly' ? 'text-[#00BFA5]' : 'text-gray-400 hover:text-gray-600'}`}
            >
               Weekly
               {activeTab === 'weekly' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00BFA5]" />}
            </button>
         </div>

         <div className="p-4 space-y-4 flex-grow">
            <div className="flex justify-end">
               <button onClick={addRow} className="bg-[#405189] text-white px-3 py-1.5 rounded-md text-[10px] font-bold shadow-sm hover:bg-[#344475] transition-all flex items-center gap-1.5">
                  <Plus size={12} /> Add
               </button>
            </div>

            <div className="space-y-3">
               {incentives.map((row, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-end gap-3 animate-in slide-in-from-left-4 duration-300 bg-gray-50/50 p-2 border border-gray-100 rounded-md">
                     <div className="flex-1 space-y-1 w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Minimum Ride Should Complete</label>
                        <input 
                          type="number"
                          min="0"
                          value={row.min_rides}
                          onChange={(e) => updateRow(idx, 'min_rides', e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs font-bold text-gray-700 focus:border-indigo-500 outline-none shadow-sm"
                        />
                     </div>
                     <div className="flex-1 space-y-1 w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Incentive Amount</label>
                        <input 
                          type="number"
                          min="0"
                          value={row.amount}
                          onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs font-bold text-gray-700 focus:border-indigo-500 outline-none shadow-sm"
                        />
                     </div>
                     <button 
                       onClick={() => removeRow(idx)}
                       className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-md transition-colors"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))}
            </div>
         </div>

         <div className="p-3 border-t border-gray-50 flex justify-end bg-gray-50/20">
            <button onClick={handleSubmit} className="bg-[#405189] text-white px-6 py-1.5 rounded-md text-xs font-bold shadow hover:bg-[#344475] transition-all active:scale-95">
               Submit
            </button>
         </div>
      </div>

      {/* Floating Design element */}
      <div className="fixed bottom-10 right-10">
         <button className="w-14 h-14 bg-[#00BFA5] text-white rounded-full flex items-center justify-center shadow-2xl hover:rotate-[360deg] transition-all duration-700">
            <div className="flex flex-col gap-1 items-center">
               <div className="w-6 h-[2.5px] bg-white rounded-full"></div>
               <div className="w-6 h-[2px] bg-white/70 rounded-full"></div>
               <div className="w-6 h-[1.5px] bg-white/40 rounded-full"></div>
            </div>
         </button>
      </div>

    </div>
  );
};

export default DriverIncentive;

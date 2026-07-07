import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Eye, Briefcase, Mail, Phone, Calendar, ExternalLink, User } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected'];

const CareerApplications = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRows = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/careers/applications');
      const results = res?.results || res?.data?.results || [];
      setRows(results);
    } catch (apiError) {
      setError(apiError?.message || 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = [row.fullName, row.email, row.phone, row.jobTitle, row.jobDepartment].some((val) =>
        String(val || '').toLowerCase().includes(search.trim().toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const updateStatus = async (appId, nextStatus) => {
    try {
      await api.patch(`/admin/careers/applications/${appId}/status`, { status: nextStatus });
      toast.success(`Application status updated to ${nextStatus}`);
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => ({ ...prev, status: nextStatus }));
      }
      await loadRows();
    } catch (apiError) {
      toast.error(apiError?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'reviewed':
        return 'bg-slate-100 text-slate-700';
      default: // pending
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <span>Careers Management</span>
          <ChevronRight size={14} />
          <span className="text-gray-900">Applications</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Applications Received</h1>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-medium">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[7fr_3fr] xl:grid-cols-[1fr_400px]">
        {/* Applications List */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none capitalize"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applications..."
              className="w-full sm:w-60 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 bg-white placeholder-gray-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600">Applicant</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600">Position</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600">Experience</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600">Applied Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400 font-normal">
                      Loading applications...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400 font-normal">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isSelected = selectedApp?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                        }`}
                        onClick={() => setSelectedApp(row)}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium shrink-0 text-lg">
                              {row.fullName ? row.fullName.charAt(0).toUpperCase() : <User size={18} />}
                            </div>
                            <div>
                              <div className="font-normal text-gray-900">{row.fullName}</div>
                              <div className="text-sm font-normal text-gray-500 mt-0.5">{row.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-medium text-gray-900">{row.jobTitle}</div>
                          <div className="text-sm font-normal text-gray-500 mt-0.5">{row.jobDepartment}</div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-900 font-normal">{row.experience} Year(s)</td>
                        <td className="px-6 py-5 text-sm text-gray-900 font-normal">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(row);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Application Details Panel */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6 transition-all duration-300">
            {selectedApp ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-3xl font-medium mb-4 shadow-sm border border-gray-200">
                    {selectedApp.fullName ? selectedApp.fullName.charAt(0).toUpperCase() : <User size={32} />}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 leading-tight mb-1">{selectedApp.fullName}</h3>
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    {selectedApp.jobTitle} • {selectedApp.jobDepartment}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <Mail size={14} />
                        <span className="text-xs font-medium">Email</span>
                      </div>
                      <a href={`mailto:${selectedApp.email}`} className="text-sm font-normal text-gray-900 hover:underline break-all">
                        {selectedApp.email}
                      </a>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <Phone size={14} />
                        <span className="text-xs font-medium">Phone</span>
                      </div>
                      <a href={`tel:${selectedApp.phone}`} className="text-sm font-normal text-gray-900 hover:underline">
                        {selectedApp.phone}
                      </a>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <Briefcase size={14} />
                        <span className="text-xs font-medium">Experience</span>
                      </div>
                      <div className="text-sm font-normal text-gray-900">
                        {selectedApp.experience} Year(s)
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">Applied Date</span>
                      </div>
                      <div className="text-sm font-normal text-gray-900">
                        {new Date(selectedApp.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {selectedApp.resumeUrl && (
                    <div className="pt-2">
                      <a
                        href={selectedApp.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        <ExternalLink size={16} />
                        View Resume / Portfolio
                      </a>
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-normal text-gray-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {selectedApp.coverLetter || 'No cover letter submitted.'}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Update Application Status</h4>
                    <div className="flex flex-col xl:flex-row gap-2">
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'reviewed')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedApp.status === 'reviewed'
                            ? 'bg-gray-100 border-gray-300 text-gray-900'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'
                        }`}
                      >
                        Reviewed
                      </button>
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'shortlisted')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedApp.status === 'shortlisted'
                            ? 'bg-yellow-500 text-black shadow-sm'
                            : 'bg-yellow-400 text-black hover:bg-yellow-500'
                        }`}
                      >
                        Shortlisted
                      </button>
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'rejected')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedApp.status === 'rejected'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                        }`}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <User size={28} className="text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-1">No Application Selected</h4>
                <p className="text-sm font-normal text-gray-500">
                  Select an application from the table to view the full applicant profile and manage their status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerApplications;

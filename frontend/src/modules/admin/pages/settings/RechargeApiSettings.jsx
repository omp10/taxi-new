import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Copy,
  FileCode2,
  Globe,
  KeyRound,
  Loader2,
  Network,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const TABS = [
  { id: 'token', label: 'Setup API Token', icon: KeyRound },
  { id: 'callback', label: 'Setup Callback URL', icon: Globe },
  { id: 'ip', label: 'Setup IP Address', icon: Network },
  { id: 'testing', label: 'API Testing', icon: PlayCircle },
  { id: 'docs', label: 'API Doc', icon: BookOpen },
];

const unwrapPayload = (response) => response?.data?.data || response?.data || {};

const RechargeApiSettings = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('token');
  const [settings, setSettings] = useState({
    enabled: '0',
    provider_name: 'RechargeKit Verify',
    base_url: 'https://verify.rechargkit.biz',
    auth_header_name: 'Authorization',
    auth_header_prefix: 'Bearer',
    api_token: '',
    token_generated_at: null,
    callback_mode: 'auto',
    callback_url: '',
    callback_secret: '',
    allowed_ip_addresses: [],
    notes: '',
    endpoints: {
      bank_verify_penny_less: '/validation/verifyBankRequest',
      bank_verify_penny_drop: '/validation/penny-drop',
      bank_verify_v3: '/validation/v3/pennyDropVerify',
      dl_request: '/validation/driverLicenseRequest',
      dl_verify: '/validation/verifyLicenseRequest',
      pan_verify: '/validation/verifyPANRequest',
    },
    resolved_callback_url: '',
  });
  const [metadata, setMetadata] = useState({});
  const [testResult, setTestResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getRechargeApiSettings();
      const payload = unwrapPayload(response);
      setSettings((prev) => ({
        ...prev,
        ...(payload.settings || {}),
      }));
      setMetadata(payload.metadata || {});
    } catch (error) {
      console.error('Failed to load recharge api settings', error);
      toast.error('Failed to load recharge API settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const ipTextareaValue = useMemo(
    () => (Array.isArray(settings.allowed_ip_addresses) ? settings.allowed_ip_addresses.join('\n') : ''),
    [settings.allowed_ip_addresses],
  );

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const response = await adminService.updateRechargeApiSettings({
        ...settings,
        endpoints: settings.endpoints || {},
        allowed_ip_addresses: ipTextareaValue
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      });
      const payload = unwrapPayload(response);
      setSettings((prev) => ({ ...prev, ...(payload.settings || {}) }));
      setMetadata(payload.metadata || {});
      toast.success('Recharge API settings saved');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save recharge API settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      setGenerating(true);
      const response = await adminService.generateRechargeApiToken();
      const payload = unwrapPayload(response);
      setSettings((prev) => ({ ...prev, ...(payload.settings || {}) }));
      setMetadata(payload.metadata || {});
      toast.success('New API token generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunTest = async () => {
    try {
      setTesting(true);
      const response = await adminService.testRechargeApiSettings();
      setTestResult(unwrapPayload(response));
      setActiveTab('testing');
      toast.success('Test preview generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to run API test');
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const updateEndpoint = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      endpoints: {
        ...(prev.endpoints || {}),
        [key]: value,
      },
    }));
  };

  const maskedToken = settings.api_token
    ? `${settings.api_token.slice(0, 12)}...${settings.api_token.slice(-8)}`
    : 'No API token generated yet';

  const cardClass = 'bg-white rounded-3xl border border-slate-200 shadow-sm';
  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
  const labelClass = 'mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf9ff_0%,#f8fbff_55%,#ffffff_100%)] p-6 lg:p-8">
      <div className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
        <span>Settings</span>
        <ChevronRight size={12} />
        <span>Third-party</span>
        <ChevronRight size={12} />
        <span className="text-slate-700">Recharge API Setup</span>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Recharge API Setup</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Configure token access, callback delivery, IP allowlisting, and test payloads from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={handleRunTest}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            Run Test
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Settings
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className={`${cardClass} p-5`}>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Token status</p>
          <p className="mt-2 text-lg font-black text-slate-950">
            {settings.api_token ? 'Active token available' : 'Token missing'}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">{maskedToken}</p>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Resolved callback</p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-900">
            {settings.resolved_callback_url || metadata.callback_url || 'Not available'}
          </p>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Allowlisted IPs</p>
          <p className="mt-2 text-lg font-black text-slate-950">
            {Array.isArray(settings.allowed_ip_addresses) ? settings.allowed_ip_addresses.length : 0}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Restrict callbacks to trusted sources when the provider supports IP allowlisting.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-cyan-500 p-4 text-slate-950 shadow-[0_24px_80px_rgba(6,182,212,0.22)]">
          <div className="rounded-[1.5rem] bg-white/15 p-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-50">Integration console</p>
            <p className="mt-2 text-xl font-black">Recharge Provider</p>
            <p className="mt-2 text-sm font-medium text-cyan-50/90">
              Match the provider’s setup steps and keep your app callback ready for live traffic.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-[1.4rem] px-4 py-3 text-left transition ${
                    isActive ? 'bg-white text-slate-950 shadow-lg' : 'bg-transparent text-cyan-50 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm font-bold">{tab.label}</span>
                  </span>
                  <ChevronRight size={16} className={isActive ? 'text-slate-400' : 'text-cyan-100'} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-black text-slate-950">
              {TABS.find((tab) => tab.id === activeTab)?.label || 'Recharge API Setup'}
            </h2>
          </div>

          <div className="p-6">
            {activeTab === 'token' && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <div className="mb-6 grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className={labelClass}>Provider Name</label>
                        <input
                          type="text"
                          value={settings.provider_name || ''}
                          onChange={(event) => updateField('provider_name', event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Base URL</label>
                        <input
                          type="text"
                          value={settings.base_url || ''}
                          onChange={(event) => updateField('base_url', event.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="mb-6 grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className={labelClass}>Auth Header</label>
                        <input
                          type="text"
                          value={settings.auth_header_name || ''}
                          onChange={(event) => updateField('auth_header_name', event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Auth Prefix</label>
                        <input
                          type="text"
                          value={settings.auth_header_prefix || ''}
                          onChange={(event) => updateField('auth_header_prefix', event.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <label className={labelClass}>API Token</label>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                      <input
                        type="text"
                        readOnly
                        value={settings.api_token || ''}
                        placeholder="Generate token to begin"
                        className="min-w-0 flex-1 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.api_token || '', 'API token')}
                        className="inline-flex items-center justify-center bg-slate-900 px-4 text-white transition hover:bg-slate-800"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Use this token in the provider dashboard or in outgoing authenticated requests.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Generated at</p>
                    <p className="mt-2 text-sm font-bold text-emerald-950">
                      {settings.token_generated_at
                        ? new Date(settings.token_generated_at).toLocaleString()
                        : 'Not generated yet'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateToken}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Generate Token
                  </button>

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={String(settings.enabled) === '1'}
                      onChange={(event) => updateField('enabled', event.target.checked ? '1' : '0')}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Enable recharge API configuration</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'callback' && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className={labelClass}>Callback Mode</label>
                    <select
                      value={settings.callback_mode || 'auto'}
                      onChange={(event) => updateField('callback_mode', event.target.value)}
                      className={inputClass}
                    >
                      <option value="auto">Auto generated callback URL</option>
                      <option value="manual">Manual callback URL</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Callback Secret</label>
                    <input
                      type="text"
                      value={settings.callback_secret || ''}
                      onChange={(event) => updateField('callback_secret', event.target.value)}
                      placeholder="Optional shared secret"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Manual Callback URL</label>
                  <input
                    type="text"
                    value={settings.callback_url || ''}
                    onChange={(event) => updateField('callback_url', event.target.value)}
                    placeholder="https://your-domain.com/api/recharge/callback"
                    disabled={settings.callback_mode !== 'manual'}
                    className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">Resolved callback URL</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">
                      {settings.resolved_callback_url || metadata.callback_url}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.resolved_callback_url || metadata.callback_url || '', 'Callback URL')}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ip' && (
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Allowed IP Addresses</label>
                  <textarea
                    value={ipTextareaValue}
                    onChange={(event) =>
                      updateField(
                        'allowed_ip_addresses',
                        event.target.value
                          .split(/\r?\n|,/)
                          .map((entry) => entry.trim())
                          .filter(Boolean),
                      )
                    }
                    rows={8}
                    placeholder={'103.10.10.5\n103.10.10.6'}
                    className={`${inputClass} resize-y`}
                  />
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Enter one IP per line. These values are stored for provider-side allowlisting and audit readiness.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Internal Notes</label>
                  <textarea
                    value={settings.notes || ''}
                    onChange={(event) => updateField('notes', event.target.value)}
                    rows={4}
                    placeholder="Who approved the IPs, provider ticket ID, or rollout notes."
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            )}

            {activeTab === 'testing' && (
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Test status</p>
                      <p className="mt-2 text-lg font-black text-slate-950">
                        {testResult?.success ? 'Ready for callback test' : 'Setup still incomplete'}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        {testResult?.message || 'Run a test to generate a callback preview.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={testing}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {testing ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                      Refresh Test
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>cURL Preview</label>
                  <div className="overflow-auto rounded-[1.5rem] bg-slate-950 p-5 text-sm text-slate-100">
                    <pre className="whitespace-pre-wrap break-all">{testResult?.curl || 'Run a test to generate cURL.'}</pre>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Penny Less Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.bank_verify_penny_less || ''}
                      onChange={(event) => updateEndpoint('bank_verify_penny_less', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Penny Drop Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.bank_verify_penny_drop || ''}
                      onChange={(event) => updateEndpoint('bank_verify_penny_drop', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>V3 Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.bank_verify_v3 || ''}
                      onChange={(event) => updateEndpoint('bank_verify_v3', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className={labelClass}>Driving License Request Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.dl_request || ''}
                      onChange={(event) => updateEndpoint('dl_request', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Driving License Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.dl_verify || ''}
                      onChange={(event) => updateEndpoint('dl_verify', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>PAN Endpoint</label>
                    <input
                      type="text"
                      value={settings.endpoints?.pan_verify || ''}
                      onChange={(event) => updateEndpoint('pan_verify', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <FileCode2 size={18} className="text-cyan-600" />
                      <p className="text-sm font-black text-slate-950">Request Rules</p>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                      <li>Send the API token in the <code>x-api-token</code> header.</li>
                      <li>Deliver callbacks as <code>POST</code> JSON requests.</li>
                      <li>Use the resolved callback URL shown in the callback tab.</li>
                    </ul>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      <p className="text-sm font-black text-slate-950">Recommended Checks</p>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                      <li>Rotate the API token before production cutover.</li>
                      <li>Allowlist provider IPs where supported.</li>
                      <li>Store a callback secret if the provider supports request signing.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-black text-slate-950">Sample Endpoints</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {Object.entries(metadata.sample_endpoints || {}).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-2 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{key}</p>
                          <p className="mt-1 break-all text-sm font-semibold text-slate-900">{value}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(value, `${key} endpoint`)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-black text-slate-950">Provider Verification Endpoints</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {Object.entries(metadata.provider_endpoints || {}).map(([key, value]) => (
                      <div key={key} className="px-5 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{key}</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RechargeApiSettings;

import React, { useState, useMemo } from 'react';
import { Search, MapPin, RefreshCw, CheckCircle, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import { usePayments, useApplications, useMapPayment } from '../../../hooks/useAdminData';

export default function PaymentsView() {
  const { data: payments = [], isLoading, refetch, isFetching } = usePayments();
  const { data: applications = [] } = useApplications();
  const mapPaymentMutation = useMapPayment();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STK_PUSH' | 'C2B'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MAPPED' | 'UNMAPPED'>('ALL');

  const [mappingPayment, setMappingPayment] = useState<any | null>(null);
  const [selectedAppToMap, setSelectedAppToMap] = useState<number | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      const matchesSearch = 
        p.transactionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.accountReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesType = filterType === 'ALL' || p.paymentType === filterType;
      const matchesStatus = filterStatus === 'ALL' || 
        (filterStatus === 'MAPPED' && p.mappedApplicationId) ||
        (filterStatus === 'UNMAPPED' && !p.mappedApplicationId);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [payments, searchTerm, filterType, filterStatus]);

  const pendingApplications = useMemo(() => {
    return applications.filter((app: any) => !app.paymentVerified);
  }, [applications]);

  const handleMapPayment = () => {
    if (mappingPayment && selectedAppToMap) {
      mapPaymentMutation.mutate(
        { paymentId: mappingPayment.id, applicationId: selectedAppToMap },
        {
          onSuccess: () => {
            setMappingPayment(null);
            setSelectedAppToMap(null);
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Payments"
        description="Monitor and manage STK Push and Manual Paybill transactions."
        icon={RefreshCw}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="flex flex-1 min-w-[300px] items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/20 focus-within:border-secondary transition-colors">
          <Search size={18} className="text-on-surface-variant/40" />
          <input 
            type="text"
            placeholder="Search by name, code, or account reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-primary placeholder:text-on-surface-variant/40"
          />
        </div>

        <div className="flex gap-2">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 outline-none text-primary cursor-pointer hover:border-secondary/50 transition-colors"
          >
            <option value="ALL">All Types</option>
            <option value="STK_PUSH">STK Push</option>
            <option value="C2B">Paybill (C2B)</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 outline-none text-primary cursor-pointer hover:border-secondary/50 transition-colors"
          >
            <option value="ALL">All Status</option>
            <option value="MAPPED">Mapped</option>
            <option value="UNMAPPED">Unmapped</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:border-secondary/50 hover:bg-secondary/5 transition-colors text-primary flex items-center justify-center group"
          >
            <RefreshCw size={18} className={`${isFetching ? 'animate-spin text-secondary' : 'group-hover:text-secondary'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-lowest/50 text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-black">
                <th className="px-6 py-4">Transaction Code</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Account Reference</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant/40">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant/40">
                    No payments found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary font-mono text-sm">{p.transactionCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary font-medium">{p.customerName || '—'}</div>
                      <div className="text-xs text-on-surface-variant opacity-60">{p.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary font-bold">{p.accountReference || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-secondary">KES {p.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-on-surface-variant font-medium">
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black tracking-widest uppercase bg-surface-container px-2 py-1 rounded-md text-primary">
                        {p.paymentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.mappedApplicationId ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 w-fit mx-auto">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">APP-{p.mappedApplicationId.toString().padStart(4, '0')}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMappingPayment(p)}
                          className="flex items-center justify-center gap-1 w-full text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors px-2 py-1.5 rounded-lg border border-secondary/20"
                        >
                          <LinkIcon size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Map</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {mappingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/20"
            >
              <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest">
                <h3 className="text-xl font-headline font-black text-primary">Map Payment</h3>
                <p className="text-sm text-on-surface-variant/60 mt-1">
                  Link transaction <span className="font-mono font-bold text-secondary">{mappingPayment.transactionCode}</span> to an application.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">Payment Details</div>
                  <div className="text-sm font-bold text-primary">{mappingPayment.customerName || mappingPayment.phoneNumber}</div>
                  <div className="text-sm text-on-surface-variant">Account: {mappingPayment.accountReference}</div>
                  <div className="text-secondary font-black mt-1">KES {mappingPayment.amount.toLocaleString()}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Select Pending Application</label>
                  <select
                    value={selectedAppToMap || ''}
                    onChange={(e) => setSelectedAppToMap(e.target.value ? Number(e.target.value) : null)}
                    className="w-full text-sm bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 outline-none text-primary cursor-pointer hover:border-secondary/50 focus:border-secondary transition-colors"
                  >
                    <option value="">-- Choose Application --</option>
                    {pendingApplications.map((app: any) => (
                      <option key={app.id} value={app.id}>
                        APP-{app.id.toString().padStart(4, '0')} - {app.candidate?.fullName} ({app.candidate?.grade})
                      </option>
                    ))}
                  </select>
                  {pendingApplications.length === 0 && (
                    <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      No pending unpaid applications found.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
                <button
                  onClick={() => {
                    setMappingPayment(null);
                    setSelectedAppToMap(null);
                  }}
                  className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMapPayment}
                  disabled={!selectedAppToMap || mapPaymentMutation.isPending}
                  className="px-6 py-2.5 text-sm font-bold bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {mapPaymentMutation.isPending ? 'Mapping...' : 'Confirm Mapping'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

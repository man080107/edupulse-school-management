import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  Receipt,
  Printer,
  X,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { feeService, classService, studentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function FeesPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allocation Form State
  const [allocationForm, setAllocationForm] = useState({
    allocationType: 'class', // 'class' or 'student'
    class_id: '',
    student_id: '',
    title: 'Tuition Fee - Term 1',
    amount: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    academic_year: '2025-2026',
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, cRes, sRes] = await Promise.all([
        feeService.getAll({ classId: classFilter, status: statusFilter, search }),
        classService.getAll(),
        studentService.getAll({ limit: 100 }),
      ]);
      setFees(fRes.data || []);
      setSummary(fRes.summary || null);
      setClasses(cRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      toast.error('Failed to load fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Open Allocation Modal
  const handleOpenAllocate = () => {
    setAllocationForm({
      allocationType: 'class',
      class_id: classes[0]?.id || '',
      student_id: students[0]?.id || '',
      title: 'Tuition Fee - Term 1',
      amount: '',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      academic_year: '2025-2026',
    });
    setShowAllocateModal(true);
  };

  const handleAllocateFee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: allocationForm.title,
        amount: allocationForm.amount,
        due_date: allocationForm.due_date,
        academic_year: allocationForm.academic_year,
        class_id: allocationForm.allocationType === 'class' ? allocationForm.class_id : null,
        student_id: allocationForm.allocationType === 'student' ? allocationForm.student_id : null,
      };

      await feeService.allocate(payload);
      toast.success('Fee structure allocated successfully.');
      setShowAllocateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to allocate fees.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (fee) => {
    setSelectedFeeForPayment(fee);
    setPaymentForm({
      amount_paid: fee.balance_amount > 0 ? fee.balance_amount : '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedFeeForPayment) return;
    setIsSubmitting(true);
    try {
      const res = await feeService.recordPayment({
        fee_id: selectedFeeForPayment.id,
        amount_paid: paymentForm.amount_paid,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
      });

      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      loadData();

      // Show printable receipt immediately
      if (res.receipt && res.receipt.receiptNo) {
        handleViewReceipt(res.receipt.receiptNo);
      }
    } catch (err) {
      toast.error(err.message || 'Payment processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View & Print Receipt
  const handleViewReceipt = async (receiptNo) => {
    setLoadingReceipt(true);
    setShowReceiptModal(true);
    try {
      const res = await feeService.getReceipt(receiptNo);
      setReceiptData(res.receipt);
    } catch (err) {
      toast.error(err.message || 'Could not fetch receipt.');
      setShowReceiptModal(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  return (
    <div className="page-content">
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <div className="stat-card" style={{ padding: '16px', '--stat-color': 'var(--blue-600)', '--stat-bg': 'var(--blue-50)' }}>
            <div className="stat-info">
              <span className="stat-label">Total Fee Invoiced</span>
              <span className="stat-value" style={{ fontSize: '1.5rem' }}>${summary.totalObligation.toLocaleString()}</span>
              <span className="stat-subtext">{summary.counts?.total || 0} invoices issued</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px', '--stat-color': 'var(--success-main)', '--stat-bg': 'var(--success-bg)' }}>
            <div className="stat-info">
              <span className="stat-label">Total Collected</span>
              <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success-text)' }}>
                ${summary.totalCollected.toLocaleString()}
              </span>
              <span className="stat-subtext">{summary.counts?.paid || 0} fully settled</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px', '--stat-color': '#f59e0b', '--stat-bg': '#fffbeb' }}>
            <div className="stat-info">
              <span className="stat-label">Outstanding Balance</span>
              <span className="stat-value" style={{ fontSize: '1.5rem', color: '#b45309' }}>
                ${summary.outstandingBalance.toLocaleString()}
              </span>
              <span className="stat-subtext">
                {summary.counts?.pending || 0} pending, {summary.counts?.partial || 0} partial
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search student or fee title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          <select
            className="form-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name} - {c.section}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending ($0 Paid)</option>
            <option value="partial">Partial Payment</option>
            <option value="paid">Fully Settled</option>
          </select>

          <button className="btn btn-primary" onClick={handleOpenAllocate}>
            <Plus size={16} /> Allocate Fee Invoice
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving fee ledger..." />
        ) : fees.length === 0 ? (
          <EmptyState
            title="No fee records found"
            description="Allocate academic fees to classes or students to begin tracking fee payments."
            actionButton={
              <button className="btn btn-primary btn-sm" onClick={handleOpenAllocate}>
                Allocate First Fee
              </button>
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Fee Title</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{f.admission_no}</td>
                    <td style={{ fontWeight: 700 }}>{f.student_name}</td>
                    <td>
                      <span className="badge badge-info">{f.class_name}</span>
                    </td>
                    <td>{f.title}</td>
                    <td style={{ fontWeight: 600 }}>${Number(f.total_amount).toFixed(2)}</td>
                    <td style={{ color: 'var(--success-main)', fontWeight: 600 }}>
                      ${Number(f.paid_amount).toFixed(2)}
                    </td>
                    <td style={{ color: Number(f.balance_amount) > 0 ? 'var(--danger-main)' : 'var(--text-muted)', fontWeight: 700 }}>
                      ${Number(f.balance_amount).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{f.due_date}</td>
                    <td>
                      <span
                        className={`badge ${
                          f.status === 'paid'
                            ? 'badge-success'
                            : f.status === 'partial'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {Number(f.balance_amount) > 0 ? (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenPayment(f)}
                        >
                          <DollarSign size={13} /> Collect Payment
                        </button>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAllocateModal && (
        <div className="modal-backdrop" onClick={() => setShowAllocateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Allocate Student Fee Obligation</h3>
              <button className="icon-btn" onClick={() => setShowAllocateModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAllocateFee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Target Group</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="allocationType"
                        value="class"
                        checked={allocationForm.allocationType === 'class'}
                        onChange={() => setAllocationForm({ ...allocationForm, allocationType: 'class' })}
                      />
                      Entire Class Section
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="allocationType"
                        value="student"
                        checked={allocationForm.allocationType === 'student'}
                        onChange={() => setAllocationForm({ ...allocationForm, allocationType: 'student' })}
                      />
                      Specific Individual Student
                    </label>
                  </div>
                </div>

                {allocationForm.allocationType === 'class' ? (
                  <div className="form-group">
                    <label className="form-label required">Select Class</label>
                    <select
                      className="form-select"
                      value={allocationForm.class_id}
                      onChange={(e) => setAllocationForm({ ...allocationForm, class_id: e.target.value })}
                      required
                    >
                      <option value="">Select Target Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - {c.section} ({c.enrolled_students} enrolled students)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label required">Select Student</label>
                    <select
                      className="form-select"
                      value={allocationForm.student_id}
                      onChange={(e) => setAllocationForm({ ...allocationForm, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select Target Student</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.admission_no}) - {s.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">Fee Category / Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tuition Fee - Term 1"
                    value={allocationForm.title}
                    onChange={(e) => setAllocationForm({ ...allocationForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-input"
                      placeholder="e.g. 1200.00"
                      value={allocationForm.amount}
                      onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Payment Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={allocationForm.due_date}
                      onChange={(e) => setAllocationForm({ ...allocationForm, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Academic Year</label>
                  <input
                    type="text"
                    className="form-input"
                    value={allocationForm.academic_year}
                    onChange={(e) => setAllocationForm({ ...allocationForm, academic_year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAllocateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Allocating...' : 'Allocate Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedFeeForPayment && (
        <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Record Fee Payment</h3>
                <p className="card-subtitle">
                  Student: {selectedFeeForPayment.student_name} ({selectedFeeForPayment.admission_no})
                </p>
              </div>
              <button className="icon-btn" onClick={() => setShowPaymentModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fee Title</div>
                    <div style={{ fontWeight: 700 }}>{selectedFeeForPayment.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining Balance</div>
                    <div style={{ fontWeight: 800, color: 'var(--danger-main)', fontSize: '1.1rem' }}>
                      ${Number(selectedFeeForPayment.balance_amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Amount to Pay ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedFeeForPayment.balance_amount}
                    className="form-input"
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI / Digital</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Payment Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Notes / Transaction ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bank Ref #49102 or Receipt Notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing Payment...' : 'Record Payment & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div className="modal-backdrop" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header no-print">
              <h3 className="modal-title">Official Fee Payment Receipt</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={15} /> Print Receipt
                </button>
                <button className="icon-btn" onClick={() => setShowReceiptModal(false)} style={{ border: 'none' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {loadingReceipt || !receiptData ? (
                <LoadingSpinner text="Generating receipt..." />
              ) : (
                <div
                  className="printable-document"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      borderBottom: '2px solid var(--navy-900)',
                      paddingBottom: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        EDUPULSE ACADEMY
                      </h2>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Official Fee Payment Acknowledgment
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receipt No:</div>
                      <div style={{ fontWeight: 800, color: 'var(--blue-600)', fontSize: '0.95rem' }}>
                        {receiptData.receipt_no}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      fontSize: '0.86rem',
                    }}
                  >
                    <div><strong>Student Name:</strong> {receiptData.student_name}</div>
                    <div><strong>Admission No:</strong> {receiptData.admission_no}</div>
                    <div><strong>Class Section:</strong> {receiptData.class_name}</div>
                    <div><strong>Payment Date:</strong> {receiptData.payment_date}</div>
                    <div><strong>Payment Method:</strong> {receiptData.payment_method}</div>
                    <div><strong>Collected By:</strong> {receiptData.collected_by_name || 'Accounts Dept'}</div>
                  </div>

                  <div className="table-container" style={{ margin: '8px 0' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Academic Term</th>
                          <th style={{ textAlign: 'right' }}>Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>{receiptData.fee_title}</td>
                          <td>{receiptData.academic_year}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--success-text)' }}>
                            ${Number(receiptData.amount_paid).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {receiptData.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Notes:</strong> {receiptData.notes}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '28px',
                      paddingTop: '16px',
                      borderTop: '1px solid #cbd5e1',
                    }}
                  >
                    <div style={{ textAlign: 'center', width: '160px' }}>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Student / Guardian
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Authorized Bursar Sign
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

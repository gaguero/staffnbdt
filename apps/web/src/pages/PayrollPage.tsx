import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { PermissionGate } from '../components';

interface Payslip {
  id: string;
  period: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  issueDate: string;
  status: 'processed' | 'pending' | 'draft';
}

const PayrollPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API call
  const payslips: Payslip[] = [
    {
      id: '1',
      period: 'January 2024',
      grossSalary: 3500.00,
      deductions: 450.00,
      netSalary: 3050.00,
      issueDate: '2024-01-31',
      status: 'processed'
    },
    {
      id: '2',
      period: 'December 2023',
      grossSalary: 3500.00,
      deductions: 450.00,
      netSalary: 3050.00,
      issueDate: '2023-12-31',
      status: 'processed'
    },
    {
      id: '3',
      period: 'November 2023',
      grossSalary: 3500.00,
      deductions: 450.00,
      netSalary: 3050.00,
      issueDate: '2023-11-30',
      status: 'processed'
    }
  ];

  const years = ['2024', '2023', '2022'];

  const filteredPayslips = payslips.filter(payslip => 
    payslip.period.includes(selectedYear)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <span className="badge badge-success">Processed</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'draft':
        return <span className="badge badge-neutral">Draft</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  const handleDownloadPayslip = async (payslipId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement payslip download API call
      console.log('Downloading payslip:', payslipId);
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would trigger a file download
      alert('Payslip download started!');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate year-to-date totals
  const ytdTotals = filteredPayslips.reduce(
    (totals, payslip) => ({
      gross: totals.gross + payslip.grossSalary,
      deductions: totals.deductions + payslip.deductions,
      net: totals.net + payslip.netSalary
    }),
    { gross: 0, deductions: 0, net: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Payroll</h1>
          <p className="text-gray-600">View and download your payslips</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-input w-auto"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Year-to-Date Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">
            {selectedYear} Year-to-Date Summary
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm text-gray-600 mb-1">Gross Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(ytdTotals.gross)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(ytdTotals.deductions)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">💵</div>
              <p className="text-sm text-gray-600 mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(ytdTotals.net)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Payslips</h3>
        </div>
        <div className="card-body p-0">
          {filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">
                No payslips found
              </h3>
              <p className="text-gray-600">
                No payslips available for {selectedYear}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-charcoal">
                            {payslip.period}
                          </p>
                          <p className="text-xs text-gray-500">
                            Issued: {new Date(payslip.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {formatCurrency(payslip.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {formatCurrency(payslip.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                        {formatCurrency(payslip.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payslip.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadPayslip(payslip.id)}
                            disabled={isLoading || payslip.status !== 'processed'}
                            className="btn btn-outline btn-sm"
                          >
                            {isLoading ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <span className="mr-1">📥</span>
                                Download
                              </>
                            )}
                          </button>
                          <button
                            disabled={payslip.status !== 'processed'}
                            className="btn btn-secondary btn-sm"
                          >
                            <span className="mr-1">👁️</span>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tax Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Tax Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-charcoal mb-3">Tax Documents</h4>
              <div className="space-y-2">
                {/* Tax documents access controlled by permissions */}
                <PermissionGate
                  resource="document"
                  action="read"
                  scope="own"
                  context={{ documentType: 'tax' }}
                  unauthorized={<p className="text-sm text-gray-500">Tax documents will be available after year-end processing.</p>}
                >
                  <button className="w-full btn btn-outline text-left">
                    📄 W-2 Form 2023
                  </button>
                  <button className="w-full btn btn-outline text-left">
                    📊 Tax Summary 2023
                  </button>
                </PermissionGate>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-charcoal mb-3">Quick Actions</h4>
              <div className="space-y-2">
                {/* Self-service actions - users can manage their own settings */}
                <PermissionGate
                  resource="user"
                  action="update"
                  scope="own"
                  context={{ field: 'tax_settings' }}
                >
                  <button className="w-full btn btn-outline text-left">
                    ⚙️ Update Tax Withholdings
                  </button>
                </PermissionGate>
                
                <PermissionGate
                  resource="user"
                  action="update"
                  scope="own"
                  context={{ field: 'banking_info' }}
                >
                  <button className="w-full btn btn-outline text-left">
                    💳 Direct Deposit Settings
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
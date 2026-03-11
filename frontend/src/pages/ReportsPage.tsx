import React, { useState } from 'react';
import { useReports, useGenerateReport } from '../hooks/useReports';
import type { ReportType, ReportFormat, GenerateReportRequest } from '../types';
import { reportService } from '../services/report.service';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'enrollment', label: 'Enrollment' },
    { value: 'financial', label: 'Financial' },
    { value: 'academic', label: 'Academic' },
    { value: 'custom', label: 'Custom' },
];

const REPORT_FORMATS: { value: ReportFormat; label: string }[] = [
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel (CSV)' },
    { value: 'pdf', label: 'PDF (CSV)' },
];

const ReportsPage: React.FC = () => {
    const { data, isLoading, isError, error, refetch } = useReports({ limit: 50 });
    const generateReport = useGenerateReport();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ReportType>('executive_summary');
    const [format, setFormat] = useState<ReportFormat>('csv');

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter a report title');
            return;
        }
        const request: GenerateReportRequest = { type, title: title.trim(), format };
        generateReport.mutate(request);
    };

    const handleDownload = async (reportId: string) => {
        try {
            const { downloadUrl } = await reportService.getDownloadUrl(reportId);
            if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener,noreferrer');
            else toast.error('Download link not available');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to get download link');
        }
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-7 h-7" />
                Reports
            </h1>

            {/* Generate new report */}
            <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Generate report</h2>
                <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as ReportType)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {REPORT_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[200px] flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Monthly enrollment summary"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="min-w-[120px]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as ReportFormat)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {REPORT_FORMATS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={generateReport.isPending}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {generateReport.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            'Generate'
                        )}
                    </button>
                </form>
            </section>

            {/* Report history */}
            <section>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Report history</h2>
                {isLoading && !data && (
                    <div className="flex items-center justify-center min-h-[120px] text-gray-500 dark:text-gray-400">
                        Loading reports…
                    </div>
                )}
                {isError && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
                        <p className="font-medium">Could not load reports</p>
                        <p className="text-sm mt-1">{error?.message ?? 'Please try again.'}</p>
                        <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium underline">
                            Retry
                        </button>
                    </div>
                )}
                {data && !isLoading && (!data.items || data.items.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No reports yet. Generate a report above to see it here.
                    </p>
                )}
                {data && data.items && data.items.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Format
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Generated
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.items.map((report) => (
                                    <tr key={report.reportId}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {report.title}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {report.type.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 uppercase">
                                            {report.format}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(report.generatedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(report.reportId)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ReportsPage;

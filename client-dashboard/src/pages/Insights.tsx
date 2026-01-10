import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    ArrowLeft,
    Download,
    MessageSquare,
    CalendarCheck,
    TrendingUp,
    Zap,
    Bot,
    User,
    Rocket,
    RefreshCw,
    CheckCircle,
    Target,
    AlertTriangle,
    MessageCircle,
    HelpCircle,
    ThumbsDown,
    Flame,
    ArrowRight,
    Sparkles,
    DollarSign,
    Percent,
    Award,
    XCircle
} from 'lucide-react';

type ReportType = 'monthly' | 'weekly' | null;
type ViewState = 'selection' | 'loading' | 'dashboard';

interface TimeRange {
    id: string;
    label: string;
    sublabel: string;
    completion: number;
}

const monthlyRanges: TimeRange[] = [
    { id: 'oct-2024', label: 'Oct', sublabel: '2024', completion: 100 },
    { id: 'nov-2024', label: 'Nov', sublabel: '2024', completion: 100 },
    { id: 'dec-2024', label: 'Dec', sublabel: '2024', completion: 100 },
    { id: 'jan-2025', label: 'Jan', sublabel: '2025', completion: 65 },
];

const weeklyRanges: TimeRange[] = [
    { id: 'week-1', label: 'Dec 2 - Dec 8', sublabel: 'Week 1', completion: 100 },
    { id: 'week-2', label: 'Dec 9 - Dec 15', sublabel: 'Week 2', completion: 100 },
    { id: 'week-3', label: 'Dec 16 - Dec 22', sublabel: 'Week 3', completion: 100 },
    { id: 'week-4', label: 'Dec 23 - Dec 29', sublabel: 'Week 4', completion: 85 },
];

// Mock data for the dashboard
const dashboardData = {
    metrics: {
        totalDMs: 142,
        bookings: 38,
        conversionRate: 26,
        instantReply: 98,
    },
    aiEffort: {
        handledByAI: 94,
        humanInterventions: 8,
        fullyAutomated: 127,
    },
    fastWins: {
        reactivated: 12,
        convertedAfterFollowUp: 7,
        bestPattern: 'Story Reply → Qualifier',
    },
    conversionPath: {
        fastest: ['Story Reply', 'Qualifier', 'Booking'],
        avgTime: '2.3 hours',
    },
    leaks: [
        { label: 'Freebie Seekers', count: 23, percentage: 45 },
        { label: 'Stopped After Pricing', count: 15, percentage: 30 },
        { label: 'Dropped After Follow-Up', count: 8, percentage: 16 },
        { label: 'No Response to Qualifier', count: 5, percentage: 9 },
    ],
    intelligence: {
        topQuestions: [
            'What are your prices?',
            'Do you offer packages?',
            'How long does it take?',
        ],
        objections: [
            'Too expensive',
            'Need to think about it',
            'Already have someone',
        ],
        highIntent: [
            'When can we start?',
            'Do you have availability?',
            'Send me the link',
        ],
    },
    leadGoldSignals: {
        highQuality: {
            conversionRate: 45,
            patterns: [
                'Longer conversations (5+ messages)',
                'Fast replies (under 10 minutes)',
                'Specific next-step questions',
            ],
            avgConvoLength: 5.2,
        },
        lowQuality: {
            conversionRate: 8,
            patterns: [
                'One-word responses',
                '24hr+ reply gaps',
                'Asking for free / discounts',
            ],
            avgConvoLength: 1.8,
        },
    },
    revenuePerformance: {
        bookingsGenerated: 38,
        estimatedRevenue: 11400,
        avgBookingValue: 300,
        conversionRateTrend: '+5%',
    },
};

export function Insights() {
    const [reportType, setReportType] = useState<ReportType>(null);
    const [selectedRange, setSelectedRange] = useState<string | null>(null);
    const [viewState, setViewState] = useState<ViewState>('selection');

    const handleReportTypeSelect = (type: ReportType) => {
        setReportType(type);
        setSelectedRange(null);
    };

    const handleGenerateInsights = () => {
        if (!selectedRange) return;
        setViewState('loading');
        // Simulate loading
        setTimeout(() => {
            setViewState('dashboard');
        }, 2500);
    };

    const handleBackToSelection = () => {
        setViewState('selection');
        setReportType(null);
        setSelectedRange(null);
    };

    const ranges = reportType === 'monthly' ? monthlyRanges : weeklyRanges;

    // Loading Screen
    if (viewState === 'loading') {
        return (
            <div className="insights-container">
                <div className="insights-loading">
                    <div className="loading-spinner">
                        <Sparkles className="loading-icon" size={48} />
                    </div>
                    <h2>Generating Insights...</h2>
                    <p>Analyzing your DM performance data</p>
                    <div className="loading-progress">
                        <div className="loading-bar"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    if (viewState === 'dashboard') {
        return (
            <div className="insights-container">
                {/* Header */}
                <div className="insights-header">
                    <button className="insights-back-btn" onClick={handleBackToSelection}>
                        <ArrowLeft size={18} />
                        Back to Selection
                    </button>
                    <div className="insights-header-title">
                        <h1>Instagram DM Insights</h1>
                        <span className="insights-period-badge">
                            {reportType === 'monthly' ? 'Monthly Report' : 'Weekly Report'} • {selectedRange}
                        </span>
                    </div>
                    <button className="insights-export-btn">
                        <Download size={18} />
                        Export PDF
                    </button>
                </div>

                {/* Top Metrics */}
                <div className="insights-metrics-grid">
                    <div className="insights-metric-card">
                        <div className="metric-icon teal">
                            <MessageSquare size={24} />
                        </div>
                        <div className="metric-value">{dashboardData.metrics.totalDMs}</div>
                        <div className="metric-label">Total DMs Handled</div>
                    </div>
                    <div className="insights-metric-card">
                        <div className="metric-icon green">
                            <CalendarCheck size={24} />
                        </div>
                        <div className="metric-value">{dashboardData.metrics.bookings}</div>
                        <div className="metric-label">Bookings Generated</div>
                    </div>
                    <div className="insights-metric-card">
                        <div className="metric-icon orange">
                            <TrendingUp size={24} />
                        </div>
                        <div className="metric-value">{dashboardData.metrics.conversionRate}%</div>
                        <div className="metric-label">Conversion Rate</div>
                    </div>
                    <div className="insights-metric-card">
                        <div className="metric-icon purple">
                            <Zap size={24} />
                        </div>
                        <div className="metric-value">{dashboardData.metrics.instantReply}%</div>
                        <div className="metric-label">Instant First Reply</div>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="insights-subtitle">
                    <CheckCircle size={16} className="text-teal" />
                    Every incoming DM was handled automatically and consistently.
                </div>

                {/* AI Effort Replacement */}
                <div className="insights-section">
                    <div className="section-header">
                        <Bot size={20} className="text-teal" />
                        <h2>AI Effort Replacement</h2>
                    </div>
                    <div className="ai-effort-grid">
                        <div className="ai-effort-card">
                            <div className="ai-effort-value">{dashboardData.aiEffort.handledByAI}%</div>
                            <div className="ai-effort-icon teal">
                                <Bot size={20} />
                            </div>
                            <div className="ai-effort-label">Conversations Handled by AI</div>
                            <div className="ai-effort-sub">Responded and engaged without you</div>
                        </div>
                        <div className="ai-effort-card">
                            <div className="ai-effort-value">{dashboardData.aiEffort.humanInterventions}</div>
                            <div className="ai-effort-icon orange">
                                <User size={20} />
                            </div>
                            <div className="ai-effort-label">Human Interventions Required</div>
                            <div className="ai-effort-sub">Only these needed your attention</div>
                        </div>
                        <div className="ai-effort-card">
                            <div className="ai-effort-value">{dashboardData.aiEffort.fullyAutomated}</div>
                            <div className="ai-effort-icon green">
                                <Rocket size={20} />
                            </div>
                            <div className="ai-effort-label">Fully Automated End-to-End</div>
                            <div className="ai-effort-sub">Conversations completed without any human touch</div>
                        </div>
                    </div>
                    <div className="ai-effort-summary">
                        <CheckCircle size={16} className="text-teal" />
                        <span>You didn't have to manage DMs manually</span>
                        <span className="summary-detail">94% of conversations were fully handled by AI</span>
                    </div>
                </div>

                {/* Fast Wins */}
                <div className="insights-section">
                    <div className="section-header">
                        <Zap size={20} className="text-orange" />
                        <h2>Fast Wins</h2>
                    </div>
                    <div className="fast-wins-grid">
                        <div className="fast-win-card teal">
                            <div className="fast-win-header">
                                <RefreshCw size={18} />
                                <span>Follow-Ups Reactivated</span>
                            </div>
                            <div className="fast-win-value">{dashboardData.fastWins.reactivated} leads re-engaged</div>
                            <div className="fast-win-sub">Conversations that went cold were brought back</div>
                        </div>
                        <div className="fast-win-card green">
                            <div className="fast-win-header">
                                <CheckCircle size={18} />
                                <span>Converted After Follow-Up</span>
                            </div>
                            <div className="fast-win-value">{dashboardData.fastWins.convertedAfterFollowUp} bookings secured</div>
                            <div className="fast-win-sub">These would have been lost without automation</div>
                        </div>
                        <div className="fast-win-card purple">
                            <div className="fast-win-header">
                                <Target size={18} />
                                <span>Best Performing Pattern</span>
                            </div>
                            <div className="fast-win-value">{dashboardData.fastWins.bestPattern}</div>
                            <div className="fast-win-sub">Top conversation flow converts at 42%</div>
                        </div>
                    </div>
                </div>

                {/* Conversion Path Insights */}
                <div className="insights-section">
                    <div className="section-header">
                        <Target size={20} className="text-green" />
                        <h2>Conversion Path Insights</h2>
                    </div>
                    <div className="conversion-path-card">
                        <div className="path-label">Fastest Converting Path</div>
                        <div className="path-flow">
                            {dashboardData.conversionPath.fastest.map((step, idx) => (
                                <div key={idx} className="path-step">
                                    <span>{step}</span>
                                    {idx < dashboardData.conversionPath.fastest.length - 1 && (
                                        <ArrowRight size={16} className="path-arrow" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="path-time">Average time to booking: {dashboardData.conversionPath.avgTime}</div>
                    </div>
                </div>

                {/* Problem Leak Detection */}
                <div className="insights-section">
                    <div className="section-header">
                        <AlertTriangle size={20} className="text-red" />
                        <h2>Problem Leak Detection</h2>
                        <span className="section-badge red">Missed Booking Opportunities</span>
                    </div>
                    <div className="leaks-grid">
                        {dashboardData.leaks.map((leak, idx) => (
                            <div key={idx} className="leak-card">
                                <div className="leak-header">
                                    <span className="leak-label">{leak.label}</span>
                                    <span className="leak-count">{leak.count} leads</span>
                                </div>
                                <div className="leak-bar-container">
                                    <div
                                        className="leak-bar"
                                        style={{ width: `${leak.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="leak-percentage">{leak.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation Intelligence - Monthly Only */}
                {reportType === 'monthly' && (
                    <div className="insights-section">
                        <div className="section-header">
                            <MessageCircle size={20} className="text-blue" />
                            <h2>Conversation Intelligence</h2>
                        </div>
                        <div className="intelligence-grid">
                            <div className="intelligence-card">
                                <div className="intelligence-header">
                                    <HelpCircle size={18} className="text-blue" />
                                    <span>Top Questions Asked</span>
                                </div>
                                <ul className="intelligence-list">
                                    {dashboardData.intelligence.topQuestions.map((q, idx) => (
                                        <li key={idx}>{q}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="intelligence-card">
                                <div className="intelligence-header">
                                    <ThumbsDown size={18} className="text-red" />
                                    <span>Common Objections</span>
                                </div>
                                <ul className="intelligence-list">
                                    {dashboardData.intelligence.objections.map((o, idx) => (
                                        <li key={idx}>{o}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="intelligence-card">
                                <div className="intelligence-header">
                                    <Flame size={18} className="text-orange" />
                                    <span>High-Intent Phrases</span>
                                </div>
                                <ul className="intelligence-list highlight">
                                    {dashboardData.intelligence.highIntent.map((h, idx) => (
                                        <li key={idx}>{h}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lead Gold Signals - Monthly Only */}
                {reportType === 'monthly' && (
                    <div className="insights-section">
                        <div className="section-header">
                            <Award size={20} className="text-yellow" />
                            <h2>Lead Gold Signals</h2>
                        </div>
                        <div className="lead-signals-grid">
                            <div className="lead-signals-card high-quality">
                                <div className="lead-signals-header">
                                    <CheckCircle size={18} className="text-green" />
                                    <span className="lead-signals-title green">High-Quality Leads</span>
                                </div>
                                <div className="lead-signals-rate">
                                    Convert at <span className="highlight green">{dashboardData.leadGoldSignals.highQuality.conversionRate}%</span> — these patterns signal buying intent
                                </div>
                                <ul className="lead-signals-list">
                                    {dashboardData.leadGoldSignals.highQuality.patterns.map((pattern, idx) => (
                                        <li key={idx}>
                                            <MessageSquare size={14} />
                                            {pattern}
                                        </li>
                                    ))}
                                </ul>
                                <div className="lead-signals-bar">
                                    <span className="bar-label">Avg conversation length</span>
                                    <span className="bar-value">{dashboardData.leadGoldSignals.highQuality.avgConvoLength} messages</span>
                                </div>
                                <div className="progress-bar green">
                                    <div className="progress-fill" style={{ width: `${(dashboardData.leadGoldSignals.highQuality.avgConvoLength / 6) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="lead-signals-card low-quality">
                                <div className="lead-signals-header">
                                    <XCircle size={18} className="text-gray" />
                                    <span className="lead-signals-title gray">Low-Quality Leads</span>
                                </div>
                                <div className="lead-signals-rate">
                                    Convert at only <span className="highlight red">{dashboardData.leadGoldSignals.lowQuality.conversionRate}%</span> — these patterns waste time
                                </div>
                                <ul className="lead-signals-list muted">
                                    {dashboardData.leadGoldSignals.lowQuality.patterns.map((pattern, idx) => (
                                        <li key={idx}>
                                            <MessageSquare size={14} />
                                            {pattern}
                                        </li>
                                    ))}
                                </ul>
                                <div className="lead-signals-bar">
                                    <span className="bar-label">Avg conversation length</span>
                                    <span className="bar-value">{dashboardData.leadGoldSignals.lowQuality.avgConvoLength} messages</span>
                                </div>
                                <div className="progress-bar gray">
                                    <div className="progress-fill" style={{ width: `${(dashboardData.leadGoldSignals.lowQuality.avgConvoLength / 6) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue Performance - Monthly Only */}
                {reportType === 'monthly' && (
                    <div className="insights-section">
                        <div className="section-header">
                            <DollarSign size={20} className="text-green" />
                            <h2>Revenue Performance</h2>
                        </div>
                        <div className="revenue-grid">
                            <div className="revenue-card">
                                <div className="revenue-icon teal">
                                    <CalendarCheck size={24} />
                                </div>
                                <div className="revenue-label">BOOKINGS GENERATED</div>
                                <div className="revenue-value teal">{dashboardData.revenuePerformance.bookingsGenerated}</div>
                                <div className="revenue-sub">Confirmed from DM conversations</div>
                            </div>
                            <div className="revenue-card">
                                <div className="revenue-icon green">
                                    <DollarSign size={24} />
                                </div>
                                <div className="revenue-label">ESTIMATED REVENUE</div>
                                <div className="revenue-value green">${dashboardData.revenuePerformance.estimatedRevenue.toLocaleString()}</div>
                                <div className="revenue-sub">Based on {dashboardData.revenuePerformance.bookingsGenerated} bookings × ${dashboardData.revenuePerformance.avgBookingValue} avg</div>
                            </div>
                            <div className="revenue-card">
                                <div className="revenue-icon purple">
                                    <Percent size={24} />
                                </div>
                                <div className="revenue-label">CONVERSION RATE TREND</div>
                                <div className="revenue-value teal">{dashboardData.revenuePerformance.conversionRateTrend}</div>
                                <div className="revenue-sub">Improved from last period</div>
                            </div>
                        </div>
                        <div className="revenue-summary">
                            <span className="revenue-highlight">Revenue generated from booked conversations</span> — powered by automated DM handling
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Selection Screen (default)
    return (
        <div className="insights-container">
            <div className="insights-selection">
                <div className="insights-logo">
                    <Sparkles size={24} className="text-teal" />
                </div>
                <h1>Instagram DM Insights</h1>
                <p className="insights-tagline">Select a time range to unlock your automation intelligence report</p>

                {/* Report Type Selection */}
                <div className="report-type-grid">
                    <div
                        className={`report-type-card ${reportType === 'monthly' ? 'active' : ''}`}
                        onClick={() => handleReportTypeSelect('monthly')}
                    >
                        <div className="report-type-icon">
                            <Calendar size={24} />
                        </div>
                        <div className="report-type-content">
                            <h3>Monthly Report</h3>
                            <p>Best for strategy planning</p>
                            <div className="report-type-badges">
                                <span className="badge">Big Picture</span>
                                <span className="badge">Trends</span>
                            </div>
                        </div>
                        <div className="report-type-mode">
                            <span className="mode-dot green"></span>
                            Strategy Mode
                        </div>
                    </div>

                    <div
                        className={`report-type-card ${reportType === 'weekly' ? 'active' : ''}`}
                        onClick={() => handleReportTypeSelect('weekly')}
                    >
                        <div className="report-type-icon">
                            <Clock size={24} />
                        </div>
                        <div className="report-type-content">
                            <h3>Weekly Report</h3>
                            <p>Best for optimization</p>
                            <div className="report-type-badges">
                                <span className="badge blue">Short Term</span>
                                <span className="badge blue">Analysis</span>
                            </div>
                        </div>
                        <div className="report-type-mode">
                            <span className="mode-dot orange"></span>
                            Execution Mode
                        </div>
                    </div>
                </div>

                {/* Time Range Selection */}
                {reportType && (
                    <div className="time-range-section animate-in">
                        <h2>{reportType === 'monthly' ? 'Select Month' : 'Select Week'}</h2>
                        <div className="time-range-grid">
                            {ranges.map((range) => (
                                <div
                                    key={range.id}
                                    className={`time-range-card ${selectedRange === range.id ? 'active' : ''}`}
                                    onClick={() => setSelectedRange(range.id)}
                                >
                                    {range.completion < 100 && (
                                        <span className="completion-badge">{range.completion}%</span>
                                    )}
                                    <div className="time-range-label">{range.label}</div>
                                    <div className="time-range-sublabel">{range.sublabel}</div>
                                    <div className="time-range-icon">
                                        <Calendar size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                {selectedRange && (
                    <div className="generate-section animate-in">
                        <button className="generate-btn" onClick={handleGenerateInsights}>
                            <Sparkles size={18} />
                            Generate Insights
                            <ArrowRight size={18} />
                        </button>
                        <p className="generate-note">
                            <Sparkles size={14} />
                            Insights are generated from real DM behavior and conversation patterns
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ChartData {
    label: string;
    received: number;
    sent: number;
}

interface LeadsChartProps {
    data: ChartData[];
}

export function LeadsChart({ data }: LeadsChartProps) {
    const chartData = {
        labels: data.map(d => d.label),
        datasets: [
            {
                label: 'Leads',
                data: data.map(d => d.received),
                borderColor: '#2dd4bf',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#2dd4bf',
                pointBorderColor: '#0d1117',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
            },
            {
                label: 'Meetings',
                data: data.map(d => d.sent),
                borderColor: '#f59e0b',
                backgroundColor: 'transparent',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#0d1117',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1c2128',
                titleColor: '#e6edf3',
                bodyColor: '#8b949e',
                borderColor: '#30363d',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(48, 54, 61, 0.5)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#8b949e',
                    font: { size: 11 },
                },
            },
            y: {
                grid: {
                    color: 'rgba(48, 54, 61, 0.5)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#8b949e',
                    font: { size: 11 },
                },
                beginAtZero: true,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <>
            <Line data={chartData} options={options} />
            <div className="chart-legend">
                <div className="legend-item">
                    <div className="legend-dot teal"></div>
                    <span>Leads</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot orange"></div>
                    <span>Meetings</span>
                </div>
            </div>
        </>
    );
}

interface DonutChartProps {
    qualified: number;
    unqualified: number;
    freebie: number;
}

export function LeadDistributionChart({ qualified, unqualified, freebie }: DonutChartProps) {
    const chartData = {
        labels: ['Qualified', 'Unqualified', 'Freebie'],
        datasets: [
            {
                data: [qualified, unqualified, freebie],
                backgroundColor: [
                    '#2dd4bf',
                    '#6e7681',
                    '#f59e0b',
                ],
                borderColor: '#0d1117',
                borderWidth: 3,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1c2128',
                titleColor: '#e6edf3',
                bodyColor: '#8b949e',
                borderColor: '#30363d',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
            },
        },
    };

    return (
        <div className="donut-chart-container">
            <div style={{ width: '180px', height: '180px' }}>
                <Doughnut data={chartData} options={options} />
            </div>
            <div className="donut-legend">
                <div className="donut-legend-item">
                    <div className="donut-legend-dot" style={{ background: '#2dd4bf' }}></div>
                    <span>Qualified</span>
                </div>
                <div className="donut-legend-item">
                    <div className="donut-legend-dot" style={{ background: '#6e7681' }}></div>
                    <span>Unqualified</span>
                </div>
                <div className="donut-legend-item">
                    <div className="donut-legend-dot" style={{ background: '#f59e0b' }}></div>
                    <span>Freebie</span>
                </div>
            </div>
        </div>
    );
}

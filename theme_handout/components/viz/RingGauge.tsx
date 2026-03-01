/**
 * RingGauge — SVG 도넛 게이지 (Standalone)
 *
 * Usage:
 *   <RingGauge value={73} title="CPU" subtitle="11.7 / 16 GB" />
 *   <RingGauge value={42} title="RAM" thresholds={{ warning: 70, critical: 90 }} />
 */

import { useMemo } from "react";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

export interface RingGaugeProps {
    value: number;
    title: string;
    subtitle?: string;
    thresholds?: { warning: number; critical: number };
    size?: number;
    strokeWidth?: number;
}

export const RingGauge: React.FC<RingGaugeProps> = ({
    value,
    title,
    subtitle,
    thresholds = { warning: 60, critical: 85 },
    size = 120,
    strokeWidth = 12,
}) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const animatedPct = useAnimatedValue(clampedValue);

    const severity = useMemo(() => {
        if (clampedValue >= thresholds.critical) return "critical";
        if (clampedValue >= thresholds.warning) return "warning";
        return "normal";
    }, [clampedValue, thresholds]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clampedValue / 100);
    const center = size / 2;

    const svgClass = [
        "viz-ring-gauge__svg",
        severity === "warning" && "viz-ring-gauge__svg--warning",
        severity === "critical" && "viz-ring-gauge__svg--critical",
    ].filter(Boolean).join(" ");

    const fillClass = [
        "viz-ring-gauge__fill",
        severity === "warning" && "viz-ring-gauge__fill--warning",
        severity === "critical" && "viz-ring-gauge__fill--critical",
    ].filter(Boolean).join(" ");

    return (
        <div className="viz-ring-gauge" style={{ width: size, height: size }}>
            <svg className={svgClass} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="viz-ring-gauge__track" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />
                <circle className={fillClass} cx={center} cy={center} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={dashOffset} transform={`rotate(-90 ${center} ${center})`} />
            </svg>
            <div className="viz-ring-gauge__label">
                <span className="viz-ring-gauge__title">{title}</span>
                <span className="viz-ring-gauge__pct">{Math.round(animatedPct)}%</span>
                {subtitle && <span className="viz-ring-gauge__sub">{subtitle}</span>}
            </div>
        </div>
    );
};

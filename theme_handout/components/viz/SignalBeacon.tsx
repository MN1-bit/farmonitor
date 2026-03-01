/**
 * SignalBeacon — CSS-only 연결 상태 인디케이터 (Standalone)
 *
 * Usage:
 *   <SignalBeacon status="connected" />
 *   <SignalBeacon status="reconnecting" />
 */

import { useMemo } from "react";

export type SignalBeaconStatus =
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "healthy"
    | "degraded"
    | "dead"
    | "live"
    | "paper";

type Severity = "normal" | "warning" | "critical" | "alert";

export interface SignalBeaconProps {
    status: SignalBeaconStatus;
    size?: number;
}

function toSeverity(status: SignalBeaconStatus): Severity {
    switch (status) {
        case "connected":
        case "healthy":
        case "paper":
            return "normal";
        case "reconnecting":
        case "degraded":
            return "warning";
        case "disconnected":
        case "dead":
            return "critical";
        case "live":
            return "alert";
    }
}

const RING_COUNT: Record<Severity, number> = {
    normal: 2,
    alert: 3,
    critical: 0,
    warning: 5,
};

export const SignalBeacon: React.FC<SignalBeaconProps> = ({ status, size }) => {
    const severity = useMemo(() => toSeverity(status), [status]);
    const count = RING_COUNT[severity];

    return (
        <span
            className={`viz-beacon viz-beacon--${severity}`}
            style={size ? { "--viz-beacon-size": `${size}px` } as React.CSSProperties : undefined}
            aria-label={`Connection status: ${status}`}
            role="img"
        >
            {Array.from({ length: count }, (_, i) => (
                <span key={i} className={`viz-beacon__ring viz-beacon__ring--${i + 1}`} />
            ))}
        </span>
    );
};

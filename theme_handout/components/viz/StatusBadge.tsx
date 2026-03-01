/**
 * StatusBadge — SignalBeacon + 라벨 조합 인라인 배지
 *
 * ELI5: 비콘 애니메이션 옆에 "Broker", "PAPER" 같은 라벨을 붙여서
 *       한눈에 무슨 상태인지 보여주는 배지.
 *
 * Usage:
 *   <StatusBadge status="connected" label="Broker" />
 *   <StatusBadge status="paper" label="PAPER" />
 *
 * @see RG02-09_ConnectionStatusVisualizer.md
 */

import { SignalBeacon, type SignalBeaconStatus } from "./SignalBeacon";

// ── Types ────────────────────────────────────────────────────

export interface StatusBadgeProps {
    /** 연결/서비스 상태 */
    status: SignalBeaconStatus;
    /** 배지 라벨 텍스트 (e.g. "Broker", "PAPER") */
    label: string;
    /** SignalBeacon size (px) — CSS 토큰 override */
    size?: number;
}

// ── Component ────────────────────────────────────────────────

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    size,
}) => {
    return (
        <span className={`viz-status-badge viz-status-badge--${status}`}>
            <SignalBeacon status={status} size={size} />
            <span className="viz-status-badge__label">{label}</span>
        </span>
    );
};

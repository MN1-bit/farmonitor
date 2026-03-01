/**
 * MiniBar — 범용 수평 프로그레스 바 컴포넌트
 *
 * ELI5: 작은 수평 막대로 퍼센트 값을 표시한다.
 *       코어별 CPU 사용률 같은 밀집된 데이터를 나열할 때 사용.
 *       임계치에 따라 자동으로 색상이 전환된다.
 *
 * Usage:
 *   <MiniBar value={75} label="C0" />
 *   <MiniBar value={92} label="C3" thresholds={{ warning: 60, critical: 85 }} />
 */

import { useMemo } from "react";

export interface MiniBarProps {
    /** 현재 값 (0~100) */
    value: number;
    /** 좌측 라벨 (예: "C0", "C1") */
    label?: string;
    /** 임계치 (기본: warning=60, critical=85) */
    thresholds?: { warning: number; critical: number };
}

export const MiniBar: React.FC<MiniBarProps> = ({
    value,
    label,
    thresholds = { warning: 60, critical: 85 },
}) => {
    const clamped = Math.max(0, Math.min(100, value));

    const severity = useMemo(() => {
        if (clamped >= thresholds.critical) return "critical";
        if (clamped >= thresholds.warning) return "warning";
        return "normal";
    }, [clamped, thresholds]);

    const fillClass = [
        "viz-mini-bar__fill",
        severity === "warning" && "viz-mini-bar__fill--warning",
        severity === "critical" && "viz-mini-bar__fill--critical",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="viz-mini-bar">
            {label && <span className="viz-mini-bar__label">{label}</span>}
            <div className="viz-mini-bar__track">
                <div className={fillClass} style={{ width: `${clamped}%` }} />
            </div>
        </div>
    );
};

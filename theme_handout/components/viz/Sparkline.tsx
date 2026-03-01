/**
 * Sparkline — 연속 스크롤 SVG 스파크라인 (Standalone)
 *
 * Usage:
 *   <Sparkline data={[10, 20, 30, 25, 40]} color="#7aa2f7" />
 */

import { useRef, useEffect } from "react";

export interface SparklineProps {
    data: number[];
    color: string;
    areaOpacity?: number;
    strokeOpacity?: number;
    height?: number;
    maxPoints?: number;
    maxValue?: number;
    gradientId?: string;
    tension?: number;
}

interface Pt { x: number; y: number; }

function cr2bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [Pt, Pt] {
    return [
        { x: p1.x + ((p2.x - p0.x) * t) / 3, y: p1.y + ((p2.y - p0.y) * t) / 3 },
        { x: p2.x - ((p3.x - p1.x) * t) / 3, y: p2.y - ((p3.y - p1.y) * t) / 3 },
    ];
}

function smoothPath(pts: Pt[], t: number): string {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const [c1, c2] = cr2bez(p0, p1, p2, p3, t);
        d += `C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
}

const W = 200;
const PAD = 2;
const POLL_MS = 200;

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color,
    areaOpacity = 0.6,
    strokeOpacity = 0.75,
    height = 48,
    maxPoints = 60,
    maxValue,
    gradientId = "sp-grad",
    tension = 0.3,
}) => {
    const BOT = height - PAD;
    const lineRef = useRef<SVGPathElement>(null);
    const areaRef = useRef<SVGPathElement>(null);
    const dataRef = useRef<number[]>([]);
    const lastPushRef = useRef(performance.now());
    const rafRef = useRef(0);
    const prevDataRef = useRef(data);
    const propsRef = useRef({ maxValue, height, maxPoints, tension, color });
    propsRef.current = { maxValue, height, maxPoints, tension, color };

    useEffect(() => {
        if (data !== prevDataRef.current) {
            prevDataRef.current = data;
            const mp = propsRef.current.maxPoints;
            dataRef.current = data.slice(-(mp + 1));
            lastPushRef.current = performance.now();
        }
    }, [data]);

    useEffect(() => {
        const render = () => {
            const { maxPoints: mp, height: H, maxValue: mv, tension: T } = propsRef.current;
            const bot = H - PAD;
            const d = dataRef.current;

            if (d.length < 2) {
                rafRef.current = requestAnimationFrame(render);
                return;
            }

            const elapsed = performance.now() - lastPushRef.current;
            const scrollProgress = d.length > mp ? Math.min(elapsed / POLL_MS, 1) : 0;
            const step = (W - PAD * 2) / Math.max(mp - 1, 1);
            const yMax = mv !== undefined ? mv : Math.max(...d, 1) * 1.1;

            const pts: Pt[] = [];
            for (let i = 0; i < d.length; i++) {
                pts.push({
                    x: PAD + (i - scrollProgress) * step,
                    y: bot - (Math.min(d[i], yMax) / yMax) * (H - PAD * 2),
                });
            }

            const curve = smoothPath(pts, T);
            if (curve && pts.length >= 2) {
                const first = pts[0];
                const last = pts[pts.length - 1];
                const area = `${curve}L${last.x.toFixed(1)},${bot}L${first.x.toFixed(1)},${bot}Z`;
                lineRef.current?.setAttribute("d", curve);
                areaRef.current?.setAttribute("d", area);
            }

            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ display: "block", overflow: "hidden" }}>
            <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1={PAD} x2="0" y2={BOT}>
                    <stop offset="0%" stopColor={color} stopOpacity={areaOpacity} />
                    <stop offset="50%" stopColor={color} stopOpacity={areaOpacity * 0.6} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path ref={areaRef} fill={`url(#${gradientId})`} stroke="none" />
            <path ref={lineRef} fill="none" stroke={color} strokeOpacity={strokeOpacity} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
};

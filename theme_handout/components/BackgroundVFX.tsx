/**
 * BackgroundVFX — Sigma 배경 VFX 컴포넌트 (Standalone)
 *
 * 3-레이어 구조:
 *   Layer 0: Base — 어두운 배경 (--sigma-vfx-bg-opacity)
 *   Layer 1: VFX  — 컬러 이펙트 (--sigma-vfx-opacity)
 *   Layer 2: Blur — frosted glass (--sigma-vfx-blur)
 *
 * 원본 Sigma에서 useSettingsStore 의존성을 제거하고 props 기반으로 변환.
 *
 * Usage:
 *   <BackgroundVFX preset="aurora" />
 *   <BackgroundVFX preset="starfield" />
 */

import React from "react";

/** 사용 가능한 VFX 프리셋 */
export type VfxPreset =
    | "none"
    | "ambient_gradient"
    | "aurora"
    | "nebula"
    | "plasma"
    | "matrix"
    | "starfield";

interface BackgroundVFXProps {
    /** 배경 VFX 프리셋 선택 */
    preset?: VfxPreset;
}

/* ── VFX Sub-Components ── */

/** Ambient Gradient — 움직이는 다크 그라데이션 */
function AmbientGradient() {
    return (
        <div
            className="sigma-bg-vfx sigma-bg-vfx--ambient-gradient"
            aria-hidden="true"
        />
    );
}

/** Aurora VFX — 떠다니는 컬러 오브 */
function AuroraOrbs() {
    return (
        <div className="sigma-bg-vfx sigma-bg-vfx--aurora-orbs" aria-hidden="true">
            <div className="sigma-aurora-orb sigma-aurora-orb--blue" />
            <div className="sigma-aurora-orb sigma-aurora-orb--purple" />
            <div className="sigma-aurora-orb sigma-aurora-orb--cyan" />
        </div>
    );
}

/** Nebula Drift — 따뜻한/차가운 radial 패치 */
function NebulaDrift() {
    return (
        <div className="sigma-bg-vfx sigma-bg-vfx--nebula-drift" aria-hidden="true">
            <div className="sigma-nebula-patch sigma-nebula-patch--warm" />
            <div className="sigma-nebula-patch sigma-nebula-patch--cool" />
            <div className="sigma-nebula-patch sigma-nebula-patch--accent" />
        </div>
    );
}

/** Plasma Waves — 수평 파도 레이어 */
function PlasmaWaves() {
    return (
        <div className="sigma-bg-vfx sigma-bg-vfx--plasma-waves" aria-hidden="true">
            <div className="sigma-plasma-wave sigma-plasma-wave--top" />
            <div className="sigma-plasma-wave sigma-plasma-wave--mid" />
            <div className="sigma-plasma-wave sigma-plasma-wave--bottom" />
        </div>
    );
}

/** Matrix Rain — Canvas 기반 떨어지는 글자 비 */
function MatrixRain() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const fontSize = 14;
        const cols = Math.floor(canvas.width / fontSize);
        const drops: number[] = Array.from({ length: cols }, () =>
            Math.random() * -100
        );
        const speeds: number[] = Array.from({ length: cols }, () =>
            0.3 + Math.random() * 0.7
        );

        const chars = "0123456789ABCDEFアイウエオカキクケコサシスセソタチツテトナニヌネノ";

        let animId: number;
        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

            for (let i = 0; i < cols; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                const brightness = 0.6 + Math.random() * 0.4;
                ctx.fillStyle = `rgba(80, 255, 160, ${brightness * 0.35})`;
                ctx.fillText(char, x, y);

                drops[i] += speeds[i];

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = Math.random() * -20;
                    speeds[i] = 0.3 + Math.random() * 0.7;
                }
            }
            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="sigma-bg-vfx"
            aria-hidden="true"
            style={{ background: "transparent" }}
        />
    );
}

/** Starfield — Canvas 파티클 네트워크 (점 + 연결선) */
function Starfield() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const PARTICLE_COUNT = 50;
        const CONNECT_DIST = 150;
        const SPEED = 0.4;

        interface Particle {
            x: number; y: number;
            vx: number; vy: number;
            size: number; alpha: number;
        }

        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * SPEED * 2,
            vy: (Math.random() - 0.5) * SPEED * 2,
            size: 1 + Math.random() * 1.5,
            alpha: 0.3 + Math.random() * 0.5,
        }));

        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DIST) {
                        const lineAlpha = (1 - dist / CONNECT_DIST) * 0.25;
                        ctx.strokeStyle = `rgba(180, 200, 255, ${lineAlpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220, 230, 255, ${p.alpha})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 200, 255, ${p.alpha * 0.15})`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="sigma-bg-vfx"
            aria-hidden="true"
            style={{ background: "transparent" }}
        />
    );
}

/* ── Main Component ── */

/**
 * BackgroundVFX — 앱 최상위에 마운트.
 * base → vfx → blur 순서로 렌더.
 * preset이 "none"이면 base + blur만 표시.
 */
export function BackgroundVFX({ preset = "aurora" }: BackgroundVFXProps) {
    const baseLayer = (
        <div className="sigma-bg-base" aria-hidden="true" />
    );
    const blurLayer = (
        <div className="sigma-bg-blur" aria-hidden="true" />
    );
    const noiseFilter = (
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="sigma-noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
        </svg>
    );

    const vfxMap: Record<string, React.ReactNode> = {
        ambient_gradient: <AmbientGradient />,
        aurora: <AuroraOrbs />,
        nebula: <NebulaDrift />,
        plasma: <PlasmaWaves />,
        matrix: <MatrixRain />,
        starfield: <Starfield />,
    };

    return (
        <>
            {noiseFilter}
            {baseLayer}
            {vfxMap[preset] ?? null}
            {blurLayer}
        </>
    );
}

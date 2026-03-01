/**
 * useAnimatedValue — rAF 기반 선형 보간 hook
 *
 * target 값이 바뀌면 화면에 보이는 숫자를 duration ms 동안
 * 매 프레임 조금씩 변화시켜서 "부드러운 카운터" 효과를 준다.
 *
 * Usage:
 *   const animatedCpu = useAnimatedValue(cpuPct);        // 190ms linear
 *   const animatedBytes = useAnimatedValue(rxBytes, 500); // 500ms
 */

import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 190; // --viz-transition-speed 와 동기

export function useAnimatedValue(
    target: number,
    duration: number = DEFAULT_DURATION,
): number {
    const [current, setCurrent] = useState(target);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const startValue = current;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = startValue + (target - startValue) * progress;
            setCurrent(value);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration]);

    return current;
}

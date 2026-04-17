import React, { useEffect, useRef } from 'react';

const CustomCursor = () => {
    const dotRef = useRef(null);
    const followerRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined' || window.innerWidth < 768) return;
        if (!window.gsap) return;

        const dot = dotRef.current;
        const follower = followerRef.current;
        const glow = glowRef.current;
        if (!dot || !follower || !glow) return;

        // GSAP quickTo for buttery smooth following
        const xDot = window.gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
        const yDot = window.gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });
        const xFollower = window.gsap.quickTo(follower, "x", { duration: 0.45, ease: "power3" });
        const yFollower = window.gsap.quickTo(follower, "y", { duration: 0.45, ease: "power3" });
        const xGlow = window.gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3.out" });
        const yGlow = window.gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3.out" });

        const onMouseMove = (e) => {
            xDot(e.clientX - 3);
            yDot(e.clientY - 3);
            xFollower(e.clientX - 16);
            yFollower(e.clientY - 16);
            xGlow(e.clientX - 200);
            yGlow(e.clientY - 200);
        };

        let isHovered = false;

        const onMouseOver = (e) => {
            const target = e.target;
            const interactive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('interactive') ||
                target.closest('.interactive');

            if (interactive && !isHovered) {
                isHovered = true;
                window.gsap.to(follower, {
                    scale: 2.5,
                    borderColor: 'rgba(6, 182, 212, 0.5)',
                    backgroundColor: 'rgba(6, 182, 212, 0.04)',
                    duration: 0.4,
                    ease: 'power2.out'
                });
                window.gsap.to(dot, {
                    scale: 0.5,
                    backgroundColor: '#22D3EE',
                    duration: 0.3
                });
                window.gsap.to(glow, {
                    scale: 1.5,
                    opacity: 0.8,
                    duration: 0.5
                });
            } else if (!interactive && isHovered) {
                isHovered = false;
                window.gsap.to(follower, {
                    scale: 1,
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    backgroundColor: 'transparent',
                    duration: 0.4,
                    ease: 'power2.out'
                });
                window.gsap.to(dot, {
                    scale: 1,
                    backgroundColor: '#6366F1',
                    duration: 0.3
                });
                window.gsap.to(glow, {
                    scale: 1,
                    opacity: 0.4,
                    duration: 0.5
                });
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseover', onMouseOver);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseover', onMouseOver);
        };
    }, []);

    if (typeof window !== 'undefined' && window.innerWidth < 768) return null;

    return (
        <>
            <div ref={glowRef} className="hidden md:block pointer-events-none fixed z-[90] mix-blend-screen w-[400px] h-[400px] rounded-full top-0 left-0 opacity-40 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)' }} />
            <div ref={dotRef} className="cursor-dot hidden md:block" />
            <div ref={followerRef} className="cursor-follower hidden md:block" />
        </>
    );
};

export default CustomCursor;

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
    const [isHovered, setIsHovered] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 150 };
    const sx = useSpring(cursorX, springConfig);
    const sy = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleHover = (e) => {
            const target = e.target;
            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('interactive')
            ) {
                setIsHovered(true);
            } else {
                setIsHovered(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHover);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHover);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            {/* Main trailing ring */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-indigo-500/50 pointer-events-none z-[10000] hidden md:block"
                style={{
                    x: sx,
                    y: sy,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: isHovered ? 2.5 : 1,
                    backgroundColor: isHovered ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                    borderWidth: isHovered ? '0.5px' : '1px'
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            />

            {/* Center dot */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-indigo-500 rounded-full pointer-events-none z-[10001] hidden md:block"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            />
        </>
    );
};

export default CustomCursor;

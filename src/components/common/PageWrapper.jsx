import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        filter: "blur(8px)",
        scale: 0.99,
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        transition: {
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        y: -15,
        filter: "blur(6px)",
        scale: 0.995,
        transition: {
            duration: 0.5,
            ease: [0.7, 0, 0.84, 0],
        },
    },
};

const PageWrapper = ({ children, className = "" }) => {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`min-h-[calc(100vh-var(--header-height))] w-full ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default PageWrapper;

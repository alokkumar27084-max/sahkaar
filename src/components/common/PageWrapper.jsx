import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1],
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

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className= "min-h-screen bg-primary-500 flex items-center justify-center" >
        <motion.div
        initial={ { opacity: 0, scale: 0.8 } }
    animate = {{ opacity: 1, scale: 1 }
}
className = "text-center"
    >
    <motion.div
          animate={ { rotate: 360 } }
transition = {{ duration: 2, repeat: Infinity, ease: 'linear' }}
className = "w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
    >
    <GraduationCap className="w-8 h-8 text-primary-500" />
        </motion.div>
        < h2 className = "text-xl font-semibold text-white mb-2" >
            Loading EIS Dashboard
                </h2>
                < p className = "text-primary-200" >
                    Please wait while we prepare your data...
</p>
    </motion.div>
    </div>
  );
};

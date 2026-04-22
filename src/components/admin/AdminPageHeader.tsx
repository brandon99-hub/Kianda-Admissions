import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export default function AdminPageHeader({ title, description, icon: Icon, children }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-[24px] shadow-[0_15px_30px_rgba(24,33,109,0.08)] flex items-center justify-center text-primary border border-outline-variant/10">
          <Icon size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-headline font-black text-primary italic tracking-tight leading-none">{title}</h2>
          <p className="text-on-surface-variant font-medium opacity-50 text-sm">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {children}
      </div>
    </motion.div>
  );
}

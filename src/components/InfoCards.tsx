import { motion } from 'motion/react';
import { Info, Lock, Verified } from 'lucide-react';

export default function InfoCards() {
  const cards = [
    {
      icon: <Info className="w-5 h-5 text-secondary" />,
      title: "Need Help?",
      description: "Contact the registrar's office at admissions@kianda.ac.ke for any technical difficulties."
    },
    {
      icon: <Lock className="w-5 h-5 text-secondary" />,
      title: "Secure Data",
      description: "Your application data is encrypted and protected following the highest privacy standards."
    },
    {
      icon: <Verified className="w-5 h-5 text-secondary" />,
      title: "Eligibility",
      description: "Ensure the candidate meets the age requirements for the grade level before submitting."
    }
  ];

  return (
    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          className="bg-surface-container p-6 rounded-lg"
        >
          <div className="mb-4">{card.icon}</div>
          <h4 className="font-bold text-primary mb-2 text-lg">{card.title}</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {card.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

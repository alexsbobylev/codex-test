import { AnimatePresence, motion } from 'framer-motion';
import SubscriptionCard from './SubscriptionCard.jsx';

const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export default function SubscriptionList({ subscriptions, onEdit, onDelete, onReminder }) {
  if (!subscriptions.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-white/60 py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl"
      >
        Пока у вас нет активных подписок. Добавьте первую, чтобы не пропустить оплату!
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <AnimatePresence>
        {subscriptions.map((subscription, index) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onReminder={onReminder}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

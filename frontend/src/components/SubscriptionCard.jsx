import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (index) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * index, duration: 0.5 } })
};

export default function SubscriptionCard({ subscription, index, onEdit, onDelete, onReminder }) {
  const nextBilling = new Date(subscription.next_billing_date);
  const formattedDate = format(nextBilling, 'd MMMM yyyy', { locale: ru });

  return (
    <motion.div
      className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 transition"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{subscription.service_name}</h3>
            <p className="text-white/60">{subscription.plan_name || 'Без тарифа'}</p>
          </div>
          <span className="text-lg font-semibold bg-white/10 px-4 py-2 rounded-2xl shadow-inner">
            {Number(subscription.price).toFixed(2)} {subscription.currency}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
          <div>
            <p className="uppercase tracking-wide text-xs text-white/50 mb-1">Следующее списание</p>
            <p className="text-base text-white">{formattedDate}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-xs text-white/50 mb-1">Интервал</p>
            <p className="text-base text-white">Каждые {subscription.billing_interval} дней</p>
          </div>
        </div>

        {subscription.notes && <p className="text-white/70 bg-white/5 rounded-2xl p-3">{subscription.notes}</p>}

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={() => onReminder(subscription)}
            className="px-4 py-2 rounded-2xl bg-white/10 border border-indigo-400/40 hover:bg-indigo-500/30 transition"
          >
            Напомнить сейчас
          </button>
          <button
            onClick={() => onEdit(subscription)}
            className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
          >
            Редактировать
          </button>
          <button
            onClick={() => onDelete(subscription)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg hover:shadow-rose-500/40 transition"
          >
            Удалить
          </button>
        </div>
      </div>
    </motion.div>
  );
}

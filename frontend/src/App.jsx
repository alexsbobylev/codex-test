import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SubscriptionForm from './components/SubscriptionForm.jsx';
import SubscriptionList from './components/SubscriptionList.jsx';
import { useSubscriptions } from './hooks/useSubscriptions.js';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.2 } }
};

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function App() {
  const {
    subscriptions,
    loading,
    error,
    stats,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    sendReminder
  } = useSubscriptions();
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateSubscription(editing.id, formData);
        showToast('Подписка обновлена');
      } else {
        await createSubscription(formData);
        showToast('Подписка добавлена');
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      showToast('Что-то пошло не так. Попробуйте снова.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subscription) => {
    if (!confirm(`Удалить подписку ${subscription.service_name}?`)) return;
    try {
      await deleteSubscription(subscription.id);
      showToast('Подписка удалена');
    } catch (err) {
      console.error(err);
      showToast('Не удалось удалить подписку', 'error');
    }
  };

  const handleReminder = async (subscription) => {
    try {
      await sendReminder(subscription.id);
      showToast(`Напоминание отправлено для ${subscription.service_name}`);
    } catch (err) {
      console.error(err);
      showToast('Не удалось отправить напоминание', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-40 h-96 w-96 rounded-full bg-indigo-500/40 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 h-80 w-80 rounded-full bg-pink-500/30 blur-3xl animate-pulse delay-200" />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col gap-12"
      >
        <motion.header className="text-center space-y-6" variants={statsVariants}>
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm"
            whileHover={{ scale: 1.03 }}
          >
            KeyNeroCity Control Center
          </motion.span>
          <motion.h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Управляй подписками, будь всегда готов к списаниям
          </motion.h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Отслеживайте все свои подписки KeyNeroCity, не упускайте даты оплат и получайте автоматические
            напоминания на почту. Плавные анимации и современный дизайн делают контроль финансов приятным.
          </p>
        </motion.header>

        <motion.section
          variants={statsVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="rounded-3xl bg-gradient-to-br from-indigo-500/50 to-purple-500/30 p-6 border border-white/10">
            <p className="text-white/60 text-sm">Всего подписок</p>
            <p className="text-3xl font-semibold mt-2">{stats.total}</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-pink-500/40 to-rose-500/20 p-6 border border-white/10">
            <p className="text-white/60 text-sm">Оценка расходов в месяц</p>
            <p className="text-3xl font-semibold mt-2">{stats.monthlyCost} ₽</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 border border-white/10">
            <p className="text-white/60 text-sm">Надежная почтовая рассылка</p>
            <p className="text-base mt-2 text-white">
              Уведомления приходят за 3 дня до списания, а также доступны вручную одним кликом.
            </p>
          </div>
        </motion.section>

        <SubscriptionForm
          current={editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          submitting={submitting}
        />

        <section className="space-y-6">
          <motion.div
            variants={statsVariants}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <h2 className="text-2xl font-semibold">Ваши подписки</h2>
            {loading && <span className="text-sm text-white/60 animate-pulse">Загрузка...</span>}
            {error && <span className="text-sm text-rose-300">{error}</span>}
          </motion.div>

          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={setEditing}
            onDelete={handleDelete}
            onReminder={handleReminder}
          />
        </section>
      </motion.main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-lg backdrop-blur-md border text-sm ${
              toast.type === 'error'
                ? 'bg-rose-500/70 border-rose-400/60 text-white'
                : 'bg-emerald-500/70 border-emerald-400/60 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const createInitialState = () => ({
  service_name: '',
  plan_name: '',
  price: '',
  currency: 'RUB',
  billing_interval: 30,
  next_billing_date: new Date().toISOString().slice(0, 10),
  notes: ''
});

const formVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function SubscriptionForm({ onSubmit, submitting, current, onCancel }) {
  const [form, setForm] = useState(createInitialState());

  useEffect(() => {
    if (current) {
      setForm({
        service_name: current.service_name,
        plan_name: current.plan_name || '',
        price: current.price,
        currency: current.currency || 'RUB',
        billing_interval: current.billing_interval,
        next_billing_date: current.next_billing_date?.slice(0, 10),
        notes: current.notes || ''
      });
    } else {
      setForm(createInitialState());
    }
  }, [current]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price) || 0,
      billing_interval: Number(form.billing_interval)
    });
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glow"
    >
      <h2 className="text-2xl font-semibold mb-6">{current ? 'Редактировать подписку' : 'Добавить подписку'}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm mb-2 text-white/70">Сервис</label>
          <input
            required
            name="service_name"
            value={form.service_name}
            onChange={handleChange}
            placeholder="KeyNeroCity Pro"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/40 transition"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-white/70">Тариф</label>
          <input
            name="plan_name"
            value={form.plan_name}
            onChange={handleChange}
            placeholder="Premium"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-white/70">Стоимость</label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition"
            />
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option value="RUB">₽</option>
              <option value="USD">$</option>
              <option value="EUR">€</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-white/70">Интервал оплаты (дни)</label>
          <input
            type="number"
            min="1"
            name="billing_interval"
            value={form.billing_interval}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-white/70">Следующее списание</label>
          <input
            type="date"
            name="next_billing_date"
            value={form.next_billing_date}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/40 transition"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-2 text-white/70">Заметки</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Доступ к аналитике KeyNeroCity"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3 justify-end">
          {current && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Отменить
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 font-semibold hover:shadow-indigo-500/50 transition disabled:opacity-60"
          >
            {submitting ? 'Сохраняю...' : current ? 'Сохранить изменения' : 'Добавить подписку'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

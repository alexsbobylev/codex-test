import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sortByNextBilling = useCallback((items) => {
    return [...items].sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date));
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_URL}/subscriptions`);
      setSubscriptions(sortByNextBilling(data));
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить подписки');
    } finally {
      setLoading(false);
    }
  }, [sortByNextBilling]);

  const createSubscription = useCallback(
    async (payload) => {
      const { data } = await axios.post(`${API_URL}/subscriptions`, payload);
      setSubscriptions((prev) => sortByNextBilling([...prev, data]));
      return data;
    },
    [sortByNextBilling]
  );

  const updateSubscription = useCallback(
    async (id, payload) => {
      const { data } = await axios.put(`${API_URL}/subscriptions/${id}`, payload);
      setSubscriptions((prev) => sortByNextBilling(prev.map((item) => (item.id === id ? data : item))));
      return data;
    },
    [sortByNextBilling]
  );

  const deleteSubscription = useCallback(async (id) => {
    await axios.delete(`${API_URL}/subscriptions/${id}`);
    setSubscriptions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const sendReminder = useCallback(async (id) => {
    await axios.post(`${API_URL}/subscriptions/${id}/send-reminder`);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const stats = useMemo(() => {
    if (!subscriptions.length) {
      return { total: 0, monthlyCost: 0 };
    }

    const total = subscriptions.length;
    const monthlyCost = subscriptions.reduce((acc, item) => {
      const interval = Number(item.billing_interval) || 30;
      const price = Number(item.price) || 0;
      return acc + (price * 30) / interval;
    }, 0);

    return {
      total,
      monthlyCost: Math.round(monthlyCost * 100) / 100
    };
  }, [subscriptions]);

  return {
    subscriptions,
    loading,
    error,
    stats,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    sendReminder
  };
}

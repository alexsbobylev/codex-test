from __future__ import annotations

import atexit
import os
import smtplib
from datetime import date, datetime
from email.message import EmailMessage
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "sqlite:///subscriptions.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "development-secret")

db = SQLAlchemy(app)


class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    billing_cycle = db.Column(db.String(50), nullable=False)
    next_payment_date = db.Column(db.Date, nullable=False)
    notify_days_before = db.Column(db.Integer, nullable=False, default=3)
    contact_email = db.Column(db.String(120), nullable=False)
    notes = db.Column(db.Text)
    last_notified_at = db.Column(db.Date)

    def days_until_renewal(self) -> int:
        return (self.next_payment_date - date.today()).days


with app.app_context():
    db.create_all()


def parse_date(value: str) -> Optional[date]:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


@app.route("/")
def index():
    subscriptions = Subscription.query.order_by(Subscription.next_payment_date).all()
    today = date.today()
    return render_template("index.html", subscriptions=subscriptions, today=today)


@app.route("/subscriptions/new", methods=["GET", "POST"])
def create_subscription():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        cost = request.form.get("cost")
        billing_cycle = request.form.get("billing_cycle", "").strip()
        next_payment_date = parse_date(request.form.get("next_payment_date"))
        notify_days_before = request.form.get("notify_days_before")
        contact_email = request.form.get("contact_email", "").strip()
        notes = request.form.get("notes", "").strip() or None

        if not name or not cost or not billing_cycle or not next_payment_date or not contact_email:
            flash("Пожалуйста, заполните все обязательные поля.", "error")
        else:
            try:
                subscription = Subscription(
                    name=name,
                    cost=float(cost),
                    billing_cycle=billing_cycle,
                    next_payment_date=next_payment_date,
                    notify_days_before=int(notify_days_before or 3),
                    contact_email=contact_email,
                    notes=notes,
                )
                db.session.add(subscription)
                db.session.commit()
                flash("Подписка успешно добавлена!", "success")
                return redirect(url_for("index"))
            except ValueError:
                flash("Некорректные данные. Проверьте введённую информацию.", "error")
    return render_template("subscription_form.html", subscription=None)


@app.route("/subscriptions/<int:subscription_id>/edit", methods=["GET", "POST"])
def edit_subscription(subscription_id: int):
    subscription = Subscription.query.get_or_404(subscription_id)
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        cost = request.form.get("cost")
        billing_cycle = request.form.get("billing_cycle", "").strip()
        next_payment_date = parse_date(request.form.get("next_payment_date"))
        notify_days_before = request.form.get("notify_days_before")
        contact_email = request.form.get("contact_email", "").strip()
        notes = request.form.get("notes", "").strip() or None

        if not name or not cost or not billing_cycle or not next_payment_date or not contact_email:
            flash("Пожалуйста, заполните все обязательные поля.", "error")
        else:
            try:
                subscription.name = name
                subscription.cost = float(cost)
                subscription.billing_cycle = billing_cycle
                subscription.next_payment_date = next_payment_date
                subscription.notify_days_before = int(notify_days_before or 3)
                subscription.contact_email = contact_email
                subscription.notes = notes
                db.session.commit()
                flash("Подписка обновлена!", "success")
                return redirect(url_for("index"))
            except ValueError:
                flash("Некорректные данные. Проверьте введённую информацию.", "error")
    return render_template("subscription_form.html", subscription=subscription)


@app.route("/subscriptions/<int:subscription_id>/delete", methods=["POST"])
def delete_subscription(subscription_id: int):
    subscription = Subscription.query.get_or_404(subscription_id)
    db.session.delete(subscription)
    db.session.commit()
    flash("Подписка удалена", "success")
    return redirect(url_for("index"))


def notify_upcoming_subscriptions() -> None:
    today = date.today()
    subscriptions = Subscription.query.all()
    for subscription in subscriptions:
        days_left = subscription.days_until_renewal()
        should_notify = days_left <= subscription.notify_days_before and days_left >= 0
        already_notified_today = subscription.last_notified_at == today
        if should_notify and not already_notified_today:
            send_notification(subscription, days_left)
            subscription.last_notified_at = today
    db.session.commit()


def send_notification(subscription: Subscription, days_left: int) -> None:
    subject = f"Скоро продление подписки: {subscription.name}"
    body = (
        "Привет!\n\n"
        f"Подписка «{subscription.name}» продлевается через {days_left} "
        f"дн{'я' if days_left % 10 in (2, 3, 4) and days_left not in (12, 13, 14) else 'ей'}.\n"
        f"Сумма к оплате: {subscription.cost:.2f}.\n"
        f"Биллинг: {subscription.billing_cycle}.\n"
        f"Дата следующего платежа: {subscription.next_payment_date:%d.%m.%Y}.\n\n"
        "Не забудь пополнить баланс!\n"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.environ.get("NOTIFIER_EMAIL_FROM", os.environ.get("SMTP_USERNAME", "no-reply@example.com"))
    message["To"] = subscription.contact_email
    message.set_content(body)

    smtp_host = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() != "false"

    if smtp_host and smtp_user and smtp_password:
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(message)
                app.logger.info(
                    "Email notification sent to %s for subscription %s",
                    subscription.contact_email,
                    subscription.name,
                )
        except Exception as exc:  # pragma: no cover - logging only
            app.logger.error("Не удалось отправить письмо: %s", exc)
            print("Не удалось отправить письмо. Текст уведомления:\n", body)
    else:
        print("SMTP не настроен. Текст уведомления:\n", body)


def run_notifications_job() -> None:
    with app.app_context():
        notify_upcoming_subscriptions()


scheduler: Optional[BackgroundScheduler] = None


def start_scheduler() -> None:
    global scheduler
    if scheduler is None or not scheduler.running:
        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(run_notifications_job, "cron", hour=9)
        scheduler.start()
        atexit.register(lambda: scheduler.shutdown(wait=False))


@app.context_processor
def inject_helpers():
    def status_badge(subscription: Subscription) -> str:
        days_left = subscription.days_until_renewal()
        if days_left < 0:
            return "overdue"
        if days_left <= subscription.notify_days_before:
            return "warning"
        return "active"

    return {"status_badge": status_badge}


if __name__ == "__main__":
    start_scheduler()
    app.run(debug=True)

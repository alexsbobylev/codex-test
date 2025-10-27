from app import run_notifications_job


def run_once() -> None:
    run_notifications_job()


if __name__ == "__main__":
    run_once()

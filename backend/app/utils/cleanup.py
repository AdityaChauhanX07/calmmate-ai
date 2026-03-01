import os
import time
import logging

logger = logging.getLogger(__name__)

UPLOAD_FOLDER = "uploaded_audio"
MAX_AGE_SECONDS = 24 * 60 * 60  # 24 hours


def cleanup_stale_audio_files() -> None:
    """Delete any files in uploaded_audio/ that are older than 24 hours."""
    if not os.path.isdir(UPLOAD_FOLDER):
        return

    now = time.time()
    deleted = 0
    errors = 0

    for filename in os.listdir(UPLOAD_FOLDER):
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        try:
            if not os.path.isfile(filepath):
                continue
            age = now - os.path.getmtime(filepath)
            if age > MAX_AGE_SECONDS:
                os.remove(filepath)
                logger.info(f"Cleanup: deleted stale file {filepath} (age {age / 3600:.1f}h)")
                deleted += 1
        except OSError as e:
            logger.warning(f"Cleanup: failed to process {filepath}: {e}")
            errors += 1

    logger.info(f"Startup cleanup complete: {deleted} file(s) deleted, {errors} error(s)")

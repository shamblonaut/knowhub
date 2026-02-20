import os
from django.conf import settings

ALLOWED_EXTENSIONS = {
    "pdf": "pdf",
    "ppt": "ppt",
    "pptx": "ppt",
    "doc": "doc",
    "docx": "doc",
    "jpg": "image",
    "jpeg": "image",
    "png": "image",
}


def validate_and_get_format(file):
    """
    Validates file extension and size.
    Returns the format string ('pdf', 'ppt', 'doc', 'image').
    Raises ValueError on failure.
    """
    ext = file.name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '.{ext}' is not allowed.")
    if file.size > settings.MAX_UPLOAD_SIZE:
        raise ValueError("File size exceeds 50MB limit.")
    return ALLOWED_EXTENSIONS[ext]


def get_upload_path(semester, subject_code, filename):
    """Returns relative path from MEDIA_ROOT."""
    return os.path.join("uploads", str(semester), subject_code, filename)


def get_full_path(relative_path):
    """Returns absolute path on disk."""
    if not relative_path:
        return None
    return os.path.join(settings.MEDIA_ROOT, relative_path)


def delete_file_if_exists(relative_path):
    """Silently deletes a file from disk if it exists."""
    if not relative_path:
        return
    full_path = get_full_path(relative_path)
    if full_path and os.path.exists(full_path):
        os.remove(full_path)

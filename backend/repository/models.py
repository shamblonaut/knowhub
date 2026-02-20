import mongoengine as me
from datetime import datetime


class Subject(me.Document):
    code = me.StringField(required=True, unique=True)
    name = me.StringField(required=True)
    semester = me.IntField(required=True, min_value=1, max_value=6)
    faculty_id = me.ObjectIdField()
    created_by = me.ObjectIdField()
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {"collection": "subjects", "indexes": ["code", "semester", "faculty_id"]}


class Resource(me.Document):
    title = me.StringField(required=True)
    description = me.StringField(default="")
    resource_type = me.StringField(required=True, choices=["file", "url"])

    # File fields
    file_path = me.StringField()
    file_format = me.StringField(choices=["pdf", "ppt", "doc", "image"])
    original_filename = me.StringField()

    # URL fields
    url = me.StringField()

    # Classification
    semester = me.IntField(required=True)
    subject_id = me.ObjectIdField(required=True)
    unit = me.StringField(default="")
    tags = me.ListField(me.StringField())

    # Ownership
    uploaded_by = me.ObjectIdField(required=True)
    uploader_role = me.StringField(required=True, choices=["faculty", "student"])

    # Approval
    status = me.StringField(
        required=True, default="pending", choices=["pending", "approved", "rejected"]
    )
    reviewed_by = me.ObjectIdField()
    reviewed_at = me.DateTimeField()

    # Analytics
    download_count = me.IntField(default=0)

    # AI search
    embedding = me.ListField(me.FloatField())

    upload_date = me.DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "resources",
        "indexes": ["status", "semester", "subject_id", "uploaded_by", "upload_date"],
    }

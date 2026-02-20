import mongoengine as me
from datetime import datetime


class User(me.Document):
    name = me.StringField(required=True)
    email = me.StringField(required=True, unique=True)
    password_hash = me.StringField(required=True)
    role = me.StringField(required=True, choices=["hod", "faculty", "student"])

    # Student only
    usn = me.StringField(unique=True, sparse=True)
    semester = me.IntField(min_value=1, max_value=6)

    # Faculty only
    subject_ids = me.ListField(me.ObjectIdField())

    is_active = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {"collection": "users", "indexes": ["email", "usn", "role"]}

    def __str__(self):
        return f"{self.name} ({self.role})"

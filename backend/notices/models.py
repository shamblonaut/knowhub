import mongoengine as me
from datetime import datetime, timedelta


class Notice(me.Document):
    title = me.StringField(required=True)
    body = me.StringField(required=True)
    posted_by = me.ObjectIdField(required=True)
    posted_by_name = me.StringField()
    is_pinned = me.BooleanField(default=False)
    expires_at = me.DateTimeField()
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {"collection": "notices", "indexes": ["created_at", "is_pinned"]}

    @property
    def is_new(self):
        return (datetime.utcnow() - self.created_at) < timedelta(hours=24)

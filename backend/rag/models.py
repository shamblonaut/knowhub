import mongoengine as me

class ResourceChunk(me.Document):
    resource_id    = me.ObjectIdField(required=True)
    resource_title = me.StringField()
    subject_id     = me.ObjectIdField()      # Added this
    subject_code   = me.StringField()
    semester       = me.IntField()
    chunk_index    = me.IntField()
    chunk_text     = me.StringField(required=True)
    embedding      = me.ListField(me.FloatField())
    page_number    = me.IntField()           # PDF only

    meta = {'collection': 'resource_chunks',
            'indexes': ['resource_id', 'semester', 'subject_id']}


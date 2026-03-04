from marshmallow import Schema, fields

class SetNameSchema(Schema):
    player_id = fields.Str(required=True)


from marshmallow import Schema, fields

class GetGameSchema(Schema):
    game_id = fields.Str(required=True)


class SetNameSchema(Schema):
    name = fields.Str(required=True)
    override = fields.Bool(required=False)


class CreateGameSchema(Schema):
    host = fields.Str(required=True)
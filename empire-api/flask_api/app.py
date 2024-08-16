import json
import logging
import os
import boto3

from JSONEncoder import JSONEncoder
from util import create_game_id
import constants

from flask import request
from flask_lambda import FlaskLambda
from thefuzz import fuzz

from boto3.dynamodb.conditions import Key

from validation import GetGameSchema, SetNameSchema, CreateGameSchema

logger = logging.getLogger()
logger.setLevel('INFO')

EXEC_ENV = os.environ['EXEC_ENV']
REGION = os.environ['REGION_NAME']

GAMES_TABLE_NAME = os.environ['GAMES_TABLE_NAME']
PLAYERS_TABLE_NAME = os.environ['PLAYERS_TABLE_NAME']

CORS_HEADERS = {
    "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}


if EXEC_ENV == 'local':
    logger.info("using local configuration")
    dynamodb = boto3.resource('dynamodb', endpoint_url='http://dynamodb:8000')
else:
    dynamodb = boto3.resource('dynamodb', region_name=REGION)

app = FlaskLambda(__name__)

games_table = dynamodb.Table(GAMES_TABLE_NAME)
players_table = dynamodb.Table(PLAYERS_TABLE_NAME)

@app.get("/")
def health_check():

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "hello world",
        }),
    }


@app.get('/game')
def get_game():
    game_id = request.args.get('game_id')
    logger.info(f"getting game with ID {game_id}")
    # validation
    get_game_schema = GetGameSchema()
    errors = get_game_schema.validate(request.args)
    if errors:
        return (
            json.dumps({'message': constants.VALIDATION_ERROR_MESSAGE.format(errors)}),
            400,
            CORS_HEADERS
        )
    
    logger.info("requested game_id: " + game_id)
    try:
        logger.info("Getting data from dynamodb")
        response = games_table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )
        return (
            json.dumps({
                "Count": response.get("Count"),
                "Items": response.get("Items")
            }, cls=JSONEncoder),
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            games_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    

@app.post('/game')
def create_game():
    game_id = create_game_id(constants.GAME_ID_LEN)
    logger.info(f"Creating game with ID {game_id}")
    data = json.loads(request.data)
    create_game_schema = CreateGameSchema()
    errors = create_game_schema.validate(data)
    if errors:
        return (
            json.dumps({'message': constants.VALIDATION_ERROR_MESSAGE}),
            400,
            CORS_HEADERS
        )
    
    table_item = {
        "game_id": game_id,
        "host": data["host"]
    }
    try:
        logger.info(f"Writing game {json.dumps(table_item)} to dynamodb")
        response = games_table.put_item(Item=table_item)
        logger.info(f"ddb response: {response}")
        return (
            table_item,
            201,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception writing to dynamodb table %s: %s",
            games_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )


@app.get('/game/<game_id>/player/<player_id>')
def get_name(game_id, player_id):
    logger.info(f"getting name for player {player_id} in game {game_id}")
    try:
        player = players_table.get_item(
            Key={"game_id": game_id, "player_id": player_id}
        )
        logger.info(f"response from ddb: {player}")
        if player.get("Item"):
            return (
                json.dumps(player.get("Item")), 
                200,
                CORS_HEADERS
            )
        else:
            return (
                json.dumps({'message': constants.PLAYER_ID_NOT_FOUND.format(player_id)}), 
                404,
                CORS_HEADERS
            )
    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            players_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    

@app.get('/game/<game_id>/players')
def get_game_names(game_id):
    logger.info(f"getting names selected by all players in game {game_id}")
    try:
        players = players_table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )
        return (
            json.dumps(players.get("Items")),
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            players_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    
@app.post('/game/<game_id>/reset')
def reset_game(game_id):
    logger.info(f"resetting names selected by all players in game {game_id}")
    try:
        players = players_table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )

    except Exception as err:
        logger.error(
            "Caught exception reading from dynamodb table %s:  %s",
            players_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )

    try:
        with players_table.batch_writer() as batch:
            for player in players["Items"]:
                batch.delete_item(Key={'game_id': game_id, 'player_id': player["player_id"]})
    
        return (
            json.dumps({'message': "Successfully cleared messages"}),
            200,
            CORS_HEADERS
        )
        
    except Exception as err:
        logger.error(
            "Caught exception batch deleting from dynamodb table %s:  %s",
            players_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )
    

@app.post('/game/<game_id>/player/<player_id>')
def set_name(game_id, player_id):
    logger.info("setting name")
    try:
        data = request.data
        logger.info("request data: " + data)
        data = json.loads(data)
        payload = {
            "game_id": game_id,
            "player_id": player_id,
            "name": data["name"]
        }
    except Exception as err:
        logger.error(
            "Caught exception parsing input: %s",
            err
        )
        return (
            json.dumps({'message': constants.UNPARSEABLE_INPUT_MESSAGE}),
            400,
            CORS_HEADERS
        )
    
    # validation
    set_name_schema = SetNameSchema()
    errors = set_name_schema.validate(data)
    if errors:
        return (
            json.dumps({'message': constants.VALIDATION_ERROR_MESSAGE}),
            400,
            CORS_HEADERS
        )
    
    if not data.get("override", False):
        # get entries already submitted, check for duplicates
        players = players_table.query(
            KeyConditionExpression=Key('game_id').eq(game_id)
        )
        submitted_name = payload.get("name")
        for item in players.get("Items"):
            existing_name = item.get("name")
            if item.get("player_id") != player_id:
                fuzzy_result = fuzz.ratio(existing_name, submitted_name)
                if fuzzy_result > constants.FUZZY_RATIO_THRESHOLD:
                    # likely a match, raise an error
                    return (
                        json.dumps({
                            'message': constants.DUPLICATE_NAME_MESSAGE.format(submitted_name, existing_name),
                            'duplicateName': existing_name
                        }),
                        409,
                        CORS_HEADERS
                    )
    else:
        logging.info("override set, skipping duplicate name check")

    try:
        logger.info("Trying to write to ddb")
        response = players_table.put_item(Item=payload)
        logger.info("ddb response: " + str(response))
        return (
            json.dumps(payload),
            200,
            CORS_HEADERS
        )
    except Exception as err:
        logger.error(
            "Caught exception writing to dynamodb table %s: %s",
            players_table.name,
            err
        )
        return (
            json.dumps({'message': constants.SERVER_ERROR_MESSAGE}),
            500,
            CORS_HEADERS
        )

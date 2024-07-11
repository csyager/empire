CORS_HEADERS = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}

SERVER_ERROR_MESSAGE = "Encountered an unexpected server exception."
VALIDATION_ERROR_MESSAGE = "Invalid input: {}"
UNPARSEABLE_INPUT_MESSAGE = "Input could not be parsed."
DUPLICATE_NAME_MESSAGE = "The submitted name ({}) looks pretty similar to a previously submitted name ({}).  To override, set `\"override\": true` in the JSON payload"

GAME_ID_LEN = 8

FUZZY_RATIO_THRESHOLD = 80
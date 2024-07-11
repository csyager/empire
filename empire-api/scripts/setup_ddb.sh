#!/bin/bash

aws dynamodb delete-table \
    --table-name EmpireGamesTable \
    --endpoint http://localhost:8000

aws dynamodb delete-table \
    --table-name EmpirePlayersTable \
    --endpoint http://localhost:8000

aws dynamodb create-table \
    --table-name EmpireGamesTable \
    --key-schema '[{"AttributeName": "game_id", "KeyType": "HASH"}]' \
    --attribute-definitions '[{"AttributeName": "game_id", "AttributeType": "S"}]' \
    --billing-mode PAY_PER_REQUEST \
    --endpoint http://localhost:8000

aws dynamodb create-table \
    --table-name EmpirePlayersTable \
    --key-schema '[{"AttributeName": "game_id", "KeyType": "HASH"}, {"AttributeName": "player_id", "KeyType": "RANGE"}]' \
    --attribute-definitions '[{"AttributeName": "game_id", "AttributeType": "S"}, {"AttributeName": "player_id", "AttributeType": "S"}]' \
    --billing-mode PAY_PER_REQUEST \
    --endpoint http://localhost:8000
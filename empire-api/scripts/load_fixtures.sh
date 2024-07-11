#!/bin/bash

aws dynamodb put-item \
    --table-name EmpireGamesTable \
    --item '{"game_id": {"S": "test-game"}}' \
    --endpoint http://localhost:8000
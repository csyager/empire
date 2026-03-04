import json
import logging
import os
from validation import *
from flask import Flask, request
from flask_socketio import SocketIO, emit, disconnect
import constants

logger = logging.getLogger()
logger.setLevel('INFO')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('join')
def handle_join_event():
    logger.info("Received join game event.")
    emit('join', broadcast=True)

@socketio.on('start')
def handle_start_game():
    logger.info("Received start game event.")
    emit('start', broadcast=True)


@socketio.on('set-host')
def handle_set_host():
    emit('set-host', broadcast=True)

@socketio.on('reset-game')
def handle_reset_game():
    emit('reset-game', broadcast=True)
    


if __name__ == '__main__':
    socketio.run(app)



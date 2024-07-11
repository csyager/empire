import random
import string

def create_game_id(length: int):
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(length))

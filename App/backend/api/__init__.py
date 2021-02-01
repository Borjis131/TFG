import eventlet
eventlet.monkey_patch(socket=False)

from flask import Flask 
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_httpauth import HTTPTokenAuth
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
auth = HTTPTokenAuth('Bearer')
socketio = SocketIO(app, async_mode='eventlet')

from api import routes, models, websocket
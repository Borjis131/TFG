import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'unstringdecifrado'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    API_PATH = '/api/v1.0'
    GARDENS_PER_PAGE = 8
    SECTIONS_PER_PAGE = 8
    SENSORS_PER_PAGE = 12
    MEASURES_PER_PAGE = 12
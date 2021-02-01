from api import app, db
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from datetime import datetime

ownership = db.Table('ownership', 
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True), 
    db.Column('garden_id', db.Integer, db.ForeignKey('garden.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(32), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))

    gardens = db.relationship('Garden', secondary=ownership, lazy='dynamic', 
    backref=db.backref('owners', lazy='dynamic'))

    sensors = db.relationship('Sensor', backref='owner', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_auth_token(self, expiration=600):
        s = Serializer(app.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None # Valid token but expired
        except BadSignature:
            return None # Invalid token
        user = User.query.get(data['id'])
        return user

    def __repr__(self):
        return '<User {}>'.format(self.username)

class Garden(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), index=True)
    description = db.Column(db.String(140))
    latitude = db.Column(db.Integer)
    longitude = db.Column(db.Integer)
    
    # owners relationship in User table
    sections = db.relationship('Section', backref='garden', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return '<Garden {}>'.format(self.name)

class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(70), index=True)
    description = db.Column(db.String(140))
    garden_id = db.Column(db.Integer, db.ForeignKey('garden.id'))

    sensors = db.relationship('Sensor', backref='section', lazy='dynamic')
    schedule = db.relationship('Schedule', uselist=False, backref ='section')

    def __repr__(self):
        return '<Section {}>'.format(self.name)

class Sensor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), index=True)
    location = db.Column(db.String(140))
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    measures = db.relationship('Measure', backref='sensor', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return '<Sensor {}>'.format(self.name)

class Measure(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Integer)
    air_humidity = db.Column(db.Integer)
    soil_humidity = db.Column(db.Integer)
    water_level = db.Column(db.Integer)
    light_intensity = db.Column(db.Integer)
    light_switch = db.Column(db.Boolean)
    pump = db.Column(db.Boolean)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensor.id'))

    def __repr__(self):
        return '<Measure {} {}>'.format(self.id, self.timestamp)

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(30))
    minute = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    day_of_month = db.Column(db.Integer)
    month = db.Column(db.Integer)
    day_of_week = db.Column(db.Integer)
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'))

    def __repr__(self):
        return '<Schedule {}>'.format(self.id)
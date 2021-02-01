#from api import app, db
#from api.models import User, Garden, Section, Sensor, Measure
from api import app, socketio

if __name__ == '__main__':
    socketio.run(app, log_output=True, host='0.0.0.0')
    #, certfile='./certs/cert.pem', keyfile='./certs/key.pem'

#@app.shell_context_processor
#def make_shell_context():
    #return {'db': db, 'User': User, 'Garden': Garden, 'Section': Section, 'Sensor': Sensor, 'Measure': Measure}
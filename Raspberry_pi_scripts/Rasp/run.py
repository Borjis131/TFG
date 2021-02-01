import socketio
import json
from threading import Lock
from apscheduler.schedulers.background import BackgroundScheduler

from xbee import ask_sensor, discover_network, ask_all_sensors

server_url = 'http://10.0.0.14:5000'

connection_status = False
sio = socketio.Client()
scheduler = BackgroundScheduler()
scheduler.start()
lock = Lock()

#Store the id of all devices in xbee network
remote_devices = set() #Like list but without repetitions

@scheduler.scheduled_job('cron', second='0')
def prueba_scheduler():
	print('Ejecutando el scheduler')
	print('Remote devices %s' % remote_devices)
	print('Connection status %s' % connection_status) 
	ask_all_sensors(remote_devices, connection_status, server_url, 'measures.json', lock)

@sio.on('connect')
def connect():
	print('Connected to central server')
	global connection_status
	connection_status = True
	sio.start_background_task(discover_network, remote_devices, lock)
	
@sio.on('disconnect')
def disconnect():
	print('Disconnected from central server')
	global connection_status
	connection_status = False
	
@sio.on('application-message')
def application_message(data):
	print(data)
	
@sio.on('data-request')
def realtime_data(data):
	sio.start_background_task(ask_sensor, data, send_data_to_server, lock)
	
def send_data_to_server(sensor_data):
	sio.emit('data-response', {'sender': sensor_data['sender'], 'receiver': sensor_data['receiver'], 'message': sensor_data['message']})
	
if __name__ == '__main__':
	sio.connect(server_url+'?section_id_alt=1', transports='websocket')
	sio.wait()

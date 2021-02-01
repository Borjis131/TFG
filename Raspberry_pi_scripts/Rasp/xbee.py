import json
import time
from datetime import datetime
import os
import requests
from collections import defaultdict
from digi.xbee.devices import ZigBeeDevice, XBee16BitAddress

PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600

def ask_sensor(data, message_callback, lock):
	message = data['message']
	data_string = json.dumps(message)
	REMOTE_NODE_ID = data['sensor']

	lock.acquire()
	local_xbee = ZigBeeDevice(PORT, BAUD_RATE)
	
	try:
		local_xbee.open()
		xbee_network = local_xbee.get_network()
		remote_xbee = xbee_network.discover_device(REMOTE_NODE_ID)
		
		if remote_xbee is None:
			print('No se ha podido encontrar el dispositivo remoto')
			exit(1)
		
		print('Enviando datos asincronamente %s >> %s' % (remote_xbee.get_64bit_addr(), data_string))
		
		local_xbee.send_data(remote_xbee, data_string)
		
		xbee_message = local_xbee.read_data(3)
		
		print('Received message from %s: %s' % (xbee_message.remote_device.get_64bit_addr(), xbee_message.data.decode()))
		
		sensor_data = {'sender': 'section 2', 'receiver': data['sender'], 'message': json.loads(xbee_message.data.decode())}
		message_callback(sensor_data)
		
	finally:
		if local_xbee is not None and local_xbee.is_open():
			local_xbee.close()
		lock.release()
		
def discover_network(remote_devices_id, lock):
	lock.acquire()
	local_xbee = ZigBeeDevice(PORT, BAUD_RATE)
	
	try:
		local_xbee.open()
		xbee_network = local_xbee.get_network()
		
		# discovering the xbee network
		xbee_network.start_discovery_process()
		while xbee_network.is_discovery_running():
			time.sleep(0.5)
			
		remote_devices = xbee_network.get_devices()
		
		for xbee in remote_devices:
			remote_devices_id.add(xbee.get_node_id())
			
	finally:
		if local_xbee is not None and local_xbee.is_open():
			local_xbee.close()
		lock.release()

def ask_all_sensors(remote_devices_id, status, url, filename, lock): 
	lock.acquire()
	local_xbee = ZigBeeDevice(PORT, BAUD_RATE)
	
	message = {'act': 1}
	data_string = json.dumps(message)
	
	measures = defaultdict(list)
	
	try: 
		local_xbee.open()
		xbee_network = local_xbee.get_network()
		
		for xbee_id in remote_devices_id:
			remote_xbee = xbee_network.discover_device(xbee_id)
			
			if remote_xbee is None:
				print('No se ha podido encontrar el dispositivo remoto')
				continue
			
			print('Enviando datos asincronamente %s >> %s' % (remote_xbee.get_64bit_addr(), data_string))
			local_xbee.send_data(remote_xbee, data_string)
			
			xbee_message = local_xbee.read_data(3)
			measure = xbee_message.data.decode()
			
			print('Received message from %s: %s' % (xbee_message.remote_device.get_64bit_addr(), measure))
			
			json_measure = json.loads(measure)
			
			json_measure['timestamp'] = str(datetime.utcnow())
			
			measures[xbee_id].append(json_measure)
			
		#if connected sends the file, if not, keeps it
		write_to_file(filename, status, measures, url)
			
	finally:
		if local_xbee is not None and local_xbee.is_open():
			local_xbee.close()
		lock.release()
		
def write_to_file(filename, status, measures, url):
	exists = os.path.isfile(filename)
	if exists and measures:
		print('File exists')
		with open(filename, 'r+') as file:
			data_file = json.load(file)
			
			for key in measures.keys():
				data_file[key].append(measures[key][-1])
				
			file.seek(0)
			json.dump(data_file, file)
			file.truncate()
			
	elif not exists and measures:
		print('File doesnt exist')
		with open(filename, 'w') as file:
			json.dump(measures, file)
			
	if status:
		print('Connected, trying to send data')
		files = [('document', ('measures.json', open(filename, 'rb'), 'application/octet'))]
		upload_file = requests.post(url+'/api/v1.0/upload_file/1', files=files)

		if upload_file.status_code == 200:
			os.remove(filename)
		else:
			print('Connected but cannot upload, keeping data in memory')
	else:
		print('Disconnected, keeping data in memory')
		
#if __name__ == '__main__':
#	write_to_file('file.json', False)

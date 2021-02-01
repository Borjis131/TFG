from flask import request
from flask_socketio import join_room, leave_room
from api import socketio
from api.models import User, Section

# user, session id
users = {}
# section, session id
sections = {}

# Handle the two types of connection
# TODO: Enhance section authentication method
# Added section_alt to enable two websockets per section
@socketio.on('connect')
def connect():
    if request.args.get('token') is not None:
        user = User.verify_auth_token(request.args.get('token'))
        if user is not None:
            print('User %s connected with id: %s' % (user.username, str(request.sid)))
            users[user.username] = request.sid
            socketio.emit('application-message', 'Connected with id: %s' % str(request.sid), room=str(request.sid))
        else:
            print('Expired token')
            # return False TODO: it needs to be changed
    elif request.args.get('section_id') is not None:
        section = Section.query.get(request.args.get('section_id'))
        if section is not None:
            print('Section %s from garden %s connected with id: %s' % (section.id, section.garden, str(request.sid)))
            sections[section.id] = request.sid
            socketio.emit('application-message', 'Connected with id: %s' % str(request.sid), room=str(request.sid))
            join_room(section.id) # connect to a room to receive calls
        else:
            print('Section not found')
            return False
    elif request.args.get('section_id_alt') is not None:
        section_alt = Section.query.get(request.args.get('section_id_alt'))
        if section_alt is not None:
            print('Section %s alternative from garden %s connected with id: %s' % (section_alt.id, section_alt.garden, str(request.sid)))
            sections[str(section_alt.id)+'+'] = request.sid
            socketio.emit('application-message', 'Connected with id: %s' % str(request.sid))
        else:
            print('Section not found')
            return False
    else:
        print('Connection rejected')
        return False

# Handle the two types of disconnection
@socketio.on('disconnect')
def disconnect():
    # Copies to avoid editing the dict while looping it
    users_copy = users.copy()
    sections_copy = sections.copy()
    for user, sid in users_copy.items():
        if sid == request.sid:
            users.pop(user)
            print('User with id: %s disconnected' % str(request.sid))
    for section, sid in sections_copy.items():
        if sid == request.sid:
            sections.pop(section)
            print('Section with id: %s disconnected' % str(request.sid))

# Start the signalling session for WebRTC (only user side)
@socketio.on('start-signaling')
def start_signaling(section_id):
    if sections.get(section_id):
        print('Calling to section %s' % section_id)
        join_room(section_id) #join to room with section to exchange signaling data
        socketio.emit('application-alert', {'type': 'success', 'message': 'Room with section %s opened' % section_id }, room=str(request.sid))
        socketio.emit('signalling-message', {'sender': 'Signalling server', 'message': 'Call exchange channel opened'}, room=section_id)
    else:
        socketio.emit('application-alert', {'type': 'danger', 'message': 'Section %s not reachable' % section_id }, room=str(request.sid))
        print('Section not reachable')

# End the signalling session for WebRTC (only user side)
@socketio.on('end-signalling')
def end_signaling(section_id):
    print('end-signalling')
    socketio.emit('signalling-message', {'sender': 'Signalling server', 'message': 'Ended signalling with id %s' % str(request.sid)}, room=section_id)
    leave_room(section_id)
    
# Route messages to room
@socketio.on('signalling-message')
def signalling(data):
    socketio.emit('signalling-message', {'sender': str(request.sid), 'message': data['message']}, room=data['room'])

# Request data and emit to section
@socketio.on('data-request')
def realtime_request(data):
    if sections.get(data['section']):
        socketio.emit('data-request', {'sender': str(request.sid), 'message': data['message'], 'sensor': data['sensor']}, room=sections[data['section']])
    else:
        socketio.emit('application-alert', {'type': 'danger', 'message': 'Section %s alternative not reachable' % data['section'] }, room=str(request.sid))
        print('Section not reachable')

# Receive data from section and emit it back to user
@socketio.on('data-response')
def realtime_response(data):
    socketio.emit('data-response', {'sender': data['sender'], 'message': data['message']}, room=data['receiver'])
from api import app, db, auth
from flask import jsonify, request, jsonify, g
from sqlalchemy import desc, text
from datetime import datetime
import json
from api.models import User, Garden, Section, Sensor, Measure

# method for @auth.login_required
@auth.verify_token
def verify_token(token):
    user = User.verify_auth_token(token)
    if not user:
        return False
    g.user = user
    return True

# returns a token if the user is valid
@app.route(app.config['API_PATH']+'/token', methods=['POST'])
def get_auth_token():
    username = request.json.get('username')
    password = request.json.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 400
    g.user = user
    token = g.user.generate_auth_token()
    return jsonify({'id': user.id, 'username': user.username, 'token': token.decode('ascii')})

# creates a user
@app.route(app.config['API_PATH']+'/users', methods=['POST'])
def create_user():
    username = request.json.get('username')
    email = request.json.get('email')
    password = request.json.get('password')
    if username is None or email is None or password is None:
        return jsonify({'error': 'Missing arguments'}), 400
    if User.query.filter_by(username=username).first() is not None \
        or User.query.filter_by(email=email).first() is not None:
        return jsonify({'error': 'Existing user'}), 400
    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'username': user.username}), 201

# updates your own user
@app.route(app.config['API_PATH']+'/users/<int:user_id>', methods=['PUT'])
@auth.login_required
def update_user(user_id):
    if user_id == g.user.id:
        username = request.json.get('username')
        email = request.json.get('email')
        old_password = request.json.get('old_password')
        new_password = request.json.get('new_password')
        if username is not None:
            g.user.username = username
        if email is not None:
            g.user.email = email
        if old_password is not None and new_password is not None:
            if g.user.check_password(old_password):
                g.user.set_password(new_password)
            else:
                return jsonify({'error': 'Wrong password'}), 400
        db.session.commit()
        return jsonify({'username': g.user.username, 'email': g.user.email})
    else:
        return jsonify({'error': 'You can\'t modify other users'}), 403

# returns the username of the given id
@app.route(app.config['API_PATH']+'/users/<int:user_id>')
@auth.login_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    return jsonify({'username': user.username})

# returns all your gardens
@app.route(app.config['API_PATH']+'/gardens')
@auth.login_required
def get_gardens():
    page = request.args.get('page', 1, type=int)
    paginated_gardens = User.query.get(g.user.id).gardens.paginate(page, app.config['GARDENS_PER_PAGE'], False)
    gardens = []
    for garden in paginated_gardens.items:
        gardens.append({'name': garden.name, 'id': garden.id, 'description': garden.description})
    return jsonify({'gardens': gardens, 'page': paginated_gardens.page, 'total_pages': paginated_gardens.pages})

# creates a garden for your user
@app.route(app.config['API_PATH']+'/gardens', methods=['POST'])
@auth.login_required
def create_garden():
    name = request.json.get('name')
    description = request.json.get('description')
    latitude = request.json.get('latitude')
    longitude = request.json.get('longitude')
    if name is None:
        return jsonify({'error': 'Missing arguments'}), 400
    garden = Garden(name=name, description=description, latitude=latitude, longitude=longitude)
    g.user.gardens.append(garden)
    db.session.commit()
    return jsonify({'garden': garden.name})

# returns the garden details if its yours 
@app.route(app.config['API_PATH']+'/gardens/<int:garden_id>') 
@auth.login_required
def get_garden(garden_id):
    page = request.args.get('page', 1, type=int)
    garden = Garden.query.get(garden_id)
    if garden is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in garden.owners if owner.id == g.user.id):
        paginated_sections = garden.sections.paginate(page, app.config['SECTIONS_PER_PAGE'], False)
        sections = []
        for section in paginated_sections.items:
            sections.append({'name': section.name, 'id': section.id, 'description': section.description})
        return jsonify({'garden': garden.name, 'garden_id': garden.id, 'sections': sections, 'page': paginated_sections.page, 'total_pages': paginated_sections.pages})
    else:
        return jsonify({'error': 'You can see your gardens details only'}), 403

# updates a garden if its yours
@app.route(app.config['API_PATH']+'/gardens/<int:garden_id>', methods=['PUT'])
@auth.login_required
def update_garden(garden_id):
    garden = Garden.query.get(garden_id)
    if garden is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in garden.owners if owner.id == g.user.id):
        name = request.json.get('name')
        description = request.json.get('description')
        latitude = request.json.get('latitude')
        longitude = request.json.get('longitude')
        added_owners = request.json.get('added_owners')
        deleted_owners = request.json.get('deleted_owners')
        if name is not None:
            garden.name = name
        if description is not None:
            garden.description = description
        not_added_owners = []
        if added_owners is not None:
            for username in added_owners:
                user = User.query.filter_by(username=username).first()
                if user is not None and not any(owner for owner in garden.owners if owner.username == username):
                        garden.owners.append(user)
                else:
                    not_added_owners.append(username)
        not_deleted_owners = []
        if deleted_owners is not None:
            for username in deleted_owners:
                user = User.query.filter_by(username=username).first()
                if user is not None and any(owner for owner in garden.owners if owner.username == username):
                        garden.owners.remove(user)
                else:
                    not_deleted_owners.append(username)
        db.session.commit()
        return jsonify({'garden': garden.name,'description': garden.description, 'not_added_owners': not_added_owners, 'not_deleted_owners': not_deleted_owners})
    else:
        return jsonify({'error': 'You can\'t modify other gardens'}), 403

# deletes a garden if its yours
@app.route(app.config['API_PATH']+'/gardens/<int:garden_id>', methods=['DELETE'])
@auth.login_required
def delete_garden(garden_id):
    garden = Garden.query.get(garden_id)
    if garden is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in garden.owners if owner.id == g.user.id):
        db.session.delete(garden)
        db.session.commit()
        return jsonify({'deleted': garden.id})
    else:
        return jsonify({'error': 'You can\'t delete other gardens'}), 403

# creates a section for a given garden_id if its yours
@app.route(app.config['API_PATH']+'/sections', methods=['POST'])
@auth.login_required
def create_section():
    name = request.json.get('name')
    garden_id = request.json.get('garden_id')
    description = request.json.get('description')
    if name is None or garden_id is None:
        return jsonify({'error': 'Missing arguments'}), 400
    garden = Garden.query.get(garden_id)
    if garden is None:
        return jsonify({'error': 'Can\'t create a section for a non-existent garden'}), 404
    if any(owner for owner in garden.owners if owner.id == g.user.id):
        section = Section(name=name, description=description, garden_id=garden_id)
        db.session.add(section)
        db.session.commit()
        return jsonify({'section': section.name, 'description': section.description, 'garden': garden.name})
    else:
        return jsonify({'error': 'You can create sections only for your gardens'}), 403

# returns the section details if its yours
@app.route(app.config['API_PATH']+'/sections/<int:section_id>')
@auth.login_required
def get_section(section_id):
    page = request.args.get('page', 1, type=int)
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in section.garden.owners if owner.id == g.user.id):
        paginated_sensors = section.sensors.paginate(page, app.config['SENSORS_PER_PAGE'], False)
        sensors = []
        for sensor in paginated_sensors.items:
            sensors.append({'name': sensor.name, 'id': sensor.id, 'location': sensor.location})
        return jsonify({'id': section.id, 'section': section.name, 'sensors': sensors, 'page': paginated_sensors.page, 'total_pages': paginated_sensors.pages})
    else:
        return jsonify({'error': 'You can only see the details of your sections'}), 403

# updates a section if its yours
@app.route(app.config['API_PATH']+'/sections/<int:section_id>', methods=['PUT'])
@auth.login_required
def update_section(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in section.garden.owners if owner.id == g.user.id):
        name = request.json.get('name')
        description = request.json.get('description')
        if name is not None:
            section.name = name
        if description is not None:
            section.description = description
        db.session.commit()
        return jsonify({'section': section.name, 'description': section.description})
    else:
        return jsonify({'error': 'You can\'t modify other sections'}), 403

# deletes a section if its yours
@app.route(app.config['API_PATH']+'/sections/<int:section_id>', methods=['DELETE'])
@auth.login_required
def delete_section(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in section.garden.owners if owner.id == g.user.id):
        db.session.delete(section)
        db.session.commit()
        return jsonify({'deleted': section.id})
    else:
        return jsonify({'error': 'You can\'t delete other sections'}), 403

# creates a sensor for a given section_id if its yours
@app.route(app.config['API_PATH']+'/sensors', methods=['POST'])
@auth.login_required
def create_sensor():
    name = request.json.get('name')
    location = request.json.get('location')
    section_id = request.json.get('section_id')
    if name is None or location is None or section_id is None:
        return jsonify({'error': 'Missing arguments'}), 400
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({'error': 'Can\'t create a sensor for a non-existent section'}), 404
    if any(owner for owner in section.garden.owners if owner.id == g.user.id):
        sensor = Sensor(name=name, location=location, section_id=section_id)
        g.user.sensors.append(sensor)
        db.session.add(sensor)
        db.session.commit()
        return jsonify({'sensor': sensor.name})
    else:
        return jsonify({'error': 'You can create sensors only for your sections'}), 403

# returns the sensor details if its yours
@app.route(app.config['API_PATH']+'/sensors/<int:sensor_id>')
@auth.login_required
def get_sensor(sensor_id):
    page = request.args.get('page', 1, type=int)
    sensor = Sensor.query.get(sensor_id)
    if sensor is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in sensor.section.garden.owners if owner.id == g.user.id):
        paginated_measures = sensor.measures.order_by(desc(text('timestamp'))).paginate(page, app.config['MEASURES_PER_PAGE'], False)
        measures = []
        for measure in paginated_measures.items:
            measures.append({'id': measure.id, 'timestamp': measure.timestamp, 'temperature': measure.temperature, 'air_humidity': measure.air_humidity, 'soil_humidity': measure.soil_humidity, 'light_intensity': measure.light_intensity,'water_level': measure.water_level, 'light_switch': measure.light_switch, 'pump': measure.pump})
        return jsonify({'sensor': sensor.name, 'measures': measures, 'section': sensor.section.id,'page': paginated_measures.page, 'total_pages': paginated_measures.pages})
    else:
        return jsonify({'error': 'You can only see the details of your sensors'}), 403

# updates a sensor if its yours
@app.route(app.config['API_PATH']+'/sensors/<int:sensor_id>', methods=['PUT'])
@auth.login_required
def update_sensor(sensor_id):
    sensor = Sensor.query.get(sensor_id)
    if sensor is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in sensor.section.garden.owners if owner.id == g.user.id):
        name = request.json.get('name')
        location = request.json.get('location')
        section_id = request.json.get('section_id')
        if name is not None:
            sensor.name = name
        if location is not None:
            sensor.location = location
        if section_id is not None:
            section = Section.query.get(section_id)
            if any(owner for owner in section.garden.owners if owner.id == g.user.id):
                sensor.section_id = section_id
            else:
                return jsonify({'error': 'Can\'t assign sensor to other section'}), 403
        db.session.commit()
        return jsonify({'sensor': sensor.name, 'location': sensor.location, 'section_id': sensor.section_id})
    else:
        return jsonify({'error': 'You can\'t modify other sensors'}), 403

# deletes a sensor if its yours
@app.route(app.config['API_PATH']+'/sensors/<int:sensor_id>', methods=['DELETE'])
@auth.login_required
def delete_sensor(sensor_id):
    sensor = Sensor.query.get(sensor_id)
    if sensor is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in sensor.section.garden.owners if owner.id == g.user.id):
        db.session.delete(sensor)
        db.session.commit()
        return jsonify({'deleted': sensor.id})
    else:
        return jsonify({'error': 'You can\'t delete other sensors'}), 403

# returns the measures details if its yours
@app.route(app.config['API_PATH']+'/measures/<int:measure_id>')
@auth.login_required
def get_measure(measure_id):
    measure = Measure.query.get(measure_id)
    if measure is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    if any(owner for owner in measure.sensor.section.garden.owners if owner.id == g.user.id):
        return jsonify({'id': measure.id, 'timestamp': measure.timestamp, 'temperature': measure.temperature, 'air_humidity': measure.air_humidity, 'soil_humidity': measure.soil_humidity, 'light_intensity': measure.light_intensity,'water_level': measure.water_level, 'light_switch': measure.light_switch, 'pump': measure.pump})
    else:
        return jsonify({'error': 'You can only see the details of your measures'}), 403

# returns all the sensors and the last 30 measures
@app.route(app.config['API_PATH']+'/measures')
@auth.login_required
def get_measures():
    page = request.args.get('page', 1, type=int)
    paginated_sensors = User.query.get(g.user.id).sensors.paginate(page, app.config['SENSORS_PER_PAGE'], False)
    sensors = []
    for sensor in paginated_sensors.items:
        measures = []
        last_measures = sensor.measures.limit(30).all()
        temperatures = []
        air_humidities = []
        soil_humidities = []
        water_levels = []
        pumps = []
        light_intensities = []
        light_switchs = []
        timestamps = []
        for measure in last_measures:
            # measures.append({'temperature': measure.temperature, 'air_humidity': measure.air_humidity, 'soil_humidity': measure.soil_humidity, 'water_level': measure.water_level, 'pump': measure.pump, 'light_intensity': measure.light_intensity, 'light_switch': measure.light_switch, 'timestamp': measure.timestamp})
            temperatures.append(measure.temperature)
            air_humidities.append(measure.air_humidity)
            soil_humidities.append(measure.soil_humidity)
            water_levels.append(measure.water_level)
            pumps.append(measure.pump)
            light_intensities.append(measure.light_intensity)
            light_switchs.append(measure.light_switch)
            timestamps.append(measure.timestamp)
        sensors.append({'sensor': sensor.name,'id': sensor.id, 'temperatures': temperatures, 'air_humidities': air_humidities, 'soil_humidities': soil_humidities, 'water_levels': water_levels, 'pumps': pumps, 'light_intensities': light_intensities, 'light_switchs': light_switchs, 'timestamps': timestamps})
    return jsonify(sensors)
    #{'sensors': sensors, page': paginated_sensors.page, 'total_pages': paginated_sensors.pages}

# measures file upload
@app.route(app.config['API_PATH']+'/upload_file/<int:section_id>', methods=['POST'])
def upload_file(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({'error': 'Id doesn\'t exist'}), 404
    sensors = section.sensors.all()
    print(sensors)
    file = str(request.files['document'].read(), 'utf-8')
    # print(file)
    parse_file = json.loads(file)
    for sensor in sensors:
        if parse_file[sensor.name]:
            for measure in parse_file[sensor.name]:
                new_measure = Measure(temperature=measure['temp'], air_humidity=measure['airH'], soil_humidity=measure['soilH'],
                water_level=measure['wLvl'], light_intensity=measure['luz'], light_switch=measure['led'], pump=measure['wPump'], 
                timestamp=datetime.strptime(measure['timestamp'], '%Y-%m-%d %H:%M:%S.%f'), sensor_id=sensor.id)

                db.session.add(new_measure)
                db.session.commit()
        else:
            print('No such sensor name')
    
    return jsonify({'success': 'File uploaded to section: %s' % section_id})

# returns all your garden coordinates
@app.route(app.config['API_PATH']+'/garden_coordinates')
@auth.login_required
def get_garden_coordinates():
    gardens = User.query.get(g.user.id).gardens
    garden_coordinates = []
    for garden in gardens:
        garden_coordinates.append({'name': garden.name, 'id': garden.id, 'latitude': garden.latitude, 'longitude': garden.longitude})
    return jsonify({'gardens': garden_coordinates})


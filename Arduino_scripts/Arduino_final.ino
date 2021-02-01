#include <ArduinoJson.h>
#include <SoftwareSerial.h>
#include <XBee.h>
#include <DHT.h>
#include <DHT_U.h>

// Sensor de humedad del aire y temperatura
#define DHTTYPE DHT11
const int DHTpin = 4;
DHT dht (DHTpin, DHTTYPE);

// Sensor de humedad del suelo
const int FCpin = A0;

// Sensor nivel de agua
const int wLvlpin = A1;

// Sensor luz
const int LDRpin = A2;

// Relé bomba
const int Pumppin = 5;

// Relé luz artificial
const int Ledpin = 6;

SoftwareSerial xbeeSerial(2,3);
XBee xbee = XBee();

// Todo para recibir
ZBRxResponse rx = ZBRxResponse();

// Todo para enviar
XBeeAddress64 destAddr64;
ZBTxRequest tx;
ZBTxStatusResponse txStatus = ZBTxStatusResponse();

String jsonString; // Usados para enviar el mensaje por xbee
int jsonLength;

// Variables para los sensores
float temp;
float airH;
int soilH;
int wLvl;
float luz; // En lumens
bool wPump = false;
bool led = false;

void setup() {
  Serial.begin(9600);
  xbeeSerial.begin(9600);
  xbee.setSerial(xbeeSerial);
  dht.begin();
  pinMode(Pumppin, OUTPUT);
  pinMode(Ledpin, OUTPUT);
  activateServices(false, false);
  Serial.println("Inicio: ");
}

void loop() {
  xbee.readPacket();

  if(xbee.getResponse().isAvailable()) {
    Serial.println("Mensaje recibido: ");
    if(xbee.getResponse().getApiId() == ZB_RX_RESPONSE){
      Serial.println("Mensaje de tipo RESPONSE");
      xbee.getResponse().getZBRxResponse(rx);
      Serial.println("Datos recibidos: ");
      
      char RxData[rx.getDataLength()];
      for (int i = 0; i < rx.getDataLength(); i++) { 
         Serial.write(rx.getData(i)); 
         RxData[i] = rx.getData(i);
        }
      Serial.println();
      
      destAddr64 = rx.getRemoteAddress64(); //Obtengo la direccion de la fuente
      
      jsonString = jsonEncoder(jsonDecoder(RxData));
      jsonLength = jsonString.length();
      
      char json[jsonLength];
      jsonString.toCharArray(json, jsonLength+1);
      
      tx = ZBTxRequest(destAddr64, (uint8_t*) json, sizeof(json)); //Creo el objeto que enviaré
      xbee.send(tx);
      resetVariables();
    }
    if(xbee.getResponse().getApiId() == ZB_TX_STATUS_RESPONSE){
      Serial.println("Mensaje de tipo STATUS-RESPONSE");
      xbee.getResponse().getZBTxStatusResponse(txStatus);
      if(txStatus.getDeliveryStatus() == SUCCESS){
        Serial.println("Mensaje enviado correctamente");
      } else {
        Serial.println("Mensaje no enviado");
      }
    }
  }
  /*
  // Añadido para hacer debug sin xbee
  if(Serial.available() > 0) {
    int keyboard_input = Serial.read() - 48;
    jsonString = jsonEncoder(keyboard_input);
    resetVariables();
   }*/
}

int jsonDecoder(char data_received []) {
  StaticJsonBuffer <110> jsonBuffer;
  Serial.println("Parseando JSON: ");
  JsonObject& root = jsonBuffer.parseObject(data_received);
      
  if (!root.success()) { // Test if parsing succeeds.
  Serial.println("parseObject() failed");
  }

  int act = root["act"];
  if(act==2){
    wPump = root["wPump"];
    led = root["led"];
  }
  return act;
}

String jsonEncoder(int mode) {
  if(mode == 1) { //act=1
    StaticJsonBuffer <JSON_OBJECT_SIZE(7)> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    readDHT();
    readFC11();
    readWaterLevel();
    readLDR();
    root["temp"]=temp;
    root["airH"]=airH;
    root["soilH"]=soilH;
    root["luz"]=luz;
    root["wLvl"]=wLvl;
    root["wPump"]=wPump;
    root["led"]=led;
    Serial.println("Muestro JSON a enviar: ");
    root.printTo(Serial);
    Serial.println();
    root.printTo(jsonString);
    return jsonString;
  }else if(mode == 2) { //act=2
    StaticJsonBuffer <JSON_OBJECT_SIZE(2)> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    root["wPump"]=wPump;
    root["led"]=led;
    activateServices(wPump, led);
    Serial.println("Muestro JSON a enviar: ");
    root.printTo(Serial);
    Serial.println();
    root.printTo(jsonString);
    return jsonString;
  } else {
    jsonString="Error, tipo de mensaje != 1 & !=2";
    return jsonString;
  }
}

void resetVariables() {
  jsonString=""; //Reseteo el String que recibe el mensaje
}

void readDHT() {
  airH = dht.readHumidity();
  temp = dht.readTemperature();

  if(isnan(airH) || isnan(temp)) {
    Serial.println("Failed to read from DHT sensor");
    return ;
  }
}

void readFC11() {
  soilH = analogRead(FCpin);
  soilH = map(soilH, 1023, 0, 0, 100);
}

void readWaterLevel() {
  wLvl = analogRead(wLvlpin);
  wLvl = map(wLvl, 1023, 0, 100, 0);
}

void readLDR() {
  // Calculos para sacar el valor en lumens
  int resistorValue = analogRead(LDRpin);
  float resistorVoltage = (float) resistorValue/1023*5; //MAX_ADC_READING y ADC_REF_VOLTAGE
  float ldrVoltage = 5 - resistorVoltage;
  float ldrResistance = ldrVoltage/resistorVoltage*5030; //REF_RESISTANCE 5.03kOhm
  luz = 12518931 * pow(ldrResistance, -1.405); //LUX_CALC_SCALAR y LUX_CALC_EXPONENT
}

void activateServices(boolean pumpValue, boolean ledValue) {
  Serial.println("Activando servicios");
  if (pumpValue) {
    digitalWrite(Pumppin, HIGH);
  } else {
    digitalWrite(Pumppin, LOW);
  }

  if(ledValue) {
    digitalWrite(Ledpin, HIGH);
  } else {
    digitalWrite(Ledpin, LOW);
  }
}

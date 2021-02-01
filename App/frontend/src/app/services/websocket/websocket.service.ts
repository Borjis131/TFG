import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: SocketIOClient.Socket;

  constructor() {}

  open(url: string, token: string) {
    // open connection with WSS and send the token -> secure: true
    this.socket = io(url, {transports: ['websocket'], query: {token: token}});
  }

  send(message: string) {
    this.socket.emit('my event', {'message': message});
  }

  onApplicationMessage(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('application-message', message => {
        observer.next(message);
      });
    });
  }

  onApplicationAlert(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('application-alert', alert => {
        observer.next(alert);
      });
    });
  }

  startSignalling(section: number) {
    this.socket.emit('start-signaling', section);
  }

  endSignalling(section: number) {
    this.socket.emit('end-signalling', section);
  }

  sendSignallingMessage(message: any, section: number) {
    this.socket.emit('signalling-message', {message: message, room: section});
  }

  onSignallingMessage(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('signalling-message', message => {
        observer.next(message);
      });
    });
  }

  sendDataRequest(section: any, sensor: string, message: any) {
    this.socket.emit('data-request', {section: section, sensor: sensor, message: message});
  }

  onDataResponse(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('data-response', message => {
        observer.next(message);
      });
    });
  }

  close() {
    this.socket.disconnect();
  }
}

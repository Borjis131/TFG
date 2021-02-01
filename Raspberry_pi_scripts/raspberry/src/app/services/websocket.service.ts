import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
private socket: any; //SocketIOClient.Socket;

  constructor() { }
  
  open(url: string, section_id: number) {
    this.socket = io(url, {transports: ['websocket'], secure: true, query: {section_id: section_id}});
  }
  
  onApplicationMessage(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('application-message', message => {
        observer.next(message);
      });
    });
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

  close() {
    this.socket.disconnect();
  }
}

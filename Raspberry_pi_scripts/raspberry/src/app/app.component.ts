import { Component, OnInit } from '@angular/core';
import { adapter } from 'webrtc-adapter';

import { WebsocketService } from './services/websocket.service';
import { URLS } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'raspberry';
  
  messages: any[] = [];
  
  section;
  
  localStream;
  pc;
  
  //WebRTC configuration
  pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
      }]
    };
  
  constructor(private websocket: WebsocketService) {
    this.section = {id: 1, name: 'Invernadero'};
    this.websocket.open(URLS.websocket, this.section.id);
    this.websocket.onApplicationMessage().subscribe(message=> {
      this.messages.push({'message': message});
      console.log(message);
      if (message.includes('Connected with id: ')) {
        this.section.websocketId = message.substring(19);
        console.log(this.section);
      }
    });
    this.websocket.onSignallingMessage().subscribe(message=> {
      console.log(`${message.sender}: ${message.message}`);
      this.receiveCall(message);
    });
  }
  
  ngOnInit() {
    this.start();
  }
  
  start() {
    navigator.mediaDevices.getUserMedia({video: true}).then(
      stream => {
        this.localStream = stream;
      },
      error => {
        console.log('navigator.getUserMedia error', error);
      });
  }
  
  receiveCall(message: any) {
    if(message.message === 'Call exchange channel opened') {
      this.createPeerConnection();
      this.pc.addStream(this.localStream);
      this.pc.createOffer({offerToReceiveVideo: 0})
        .then(description => this.createdOffer(description))
        .catch(error => {
          console.log(`Failed to create session description: ${error}.`);
        });
    } else if (message.message.type ==='answer') {
      console.log('Answer received');
      this.pc.setRemoteDescription(new RTCSessionDescription(message.message));
    } else if (message.message.type === 'candidate' && message.sender != this.section.websocketId) {
      let candidate = new RTCIceCandidate({
        sdpMLineIndex: message.message.label,
        candidate: message.message.candidate
      });
      this.pc.addIceCandidate(candidate);
      console.log('Candidate received');
    }
  }
  
  createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.addEventListener('icecandidate', event=> this.handleIceCandidate(event));
      this.pc.addEventListener('iceconnectionstatechange', event=> this.handleIceConnectionStateChange(event));
      this.localStream.getTracks().forEach(track=> { console.log('Track added' + track); this.pc.addTrack(track, this.localStream);});
      // removeStream from remote, doesnt needed
      
      console.log('PeerConnection created');
    }catch(e) {
      console.log('Failed to create PeerConnection, exception: '+e.message);
      return;
    }
  }
  
  handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if(event.candidate) {
      this.sendSignallingMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates');
    }
  }
  
  handleIceConnectionStateChange(event) {
    console.log('ICE state change event: ', event);
    if(this.pc.iceConnectionState === 'disconnected') {
      console.log('Disconnected');
      this.hangUp();
    }
  }
  
  createdOffer(description) {
    this.pc.setLocalDescription(description)
    .then(() => {
      console.log('Setting local description and sending it through websocket');
      this.sendSignallingMessage(description);
    }).catch(error => {
      console.log(`Failed to setLocalDescription with ${error}.`);
    });
  }
  
  sendSignallingMessage(message: any) {
    this.websocket.sendSignallingMessage(message, this.section.id);
  }
  
  hangUp() {
    if(this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
  
  close() {
    this.websocket.close();
  }
}

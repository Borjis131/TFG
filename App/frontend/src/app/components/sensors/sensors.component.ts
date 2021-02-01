import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import adapter from 'webrtc-adapter';

import { ApiService } from 'src/app/services/api/api.service';
import { WebsocketService } from 'src/app/services/websocket/websocket.service';
import { Sensor } from 'src/app/models/sensor';
import { Section } from 'src/app/models/section';

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.scss']
})
export class SensorsComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, 
              private websocket: WebsocketService, private modalService: BsModalService, private location: Location) { }

  private sensors: Sensor[];
  private section: Section;
  private inProgress: boolean;

  // pagination
  private totalItems: number;
  private itemsPerPage = 12;

  // video
  private video = false;
  remoteVideo;
  remoteStream;
  pc = null;
  pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };

  // signalling websocket
  private signalling;

  // modal before deleting
  modalRef: BsModalRef;
  private currentId: number;

  ngOnInit() {
    this.getSensors(this.route.snapshot.params.id);
  }

  // If user navigates to another page
  ngOnDestroy() {
    if(this.remoteStream) {
      const tracks = this.remoteStream.getTracks();
      tracks.forEach((track)=> {
        track.stop();
      });
    }

    // TODO: The connection remains active in the room
    if(this.signalling) {
      this.signalling.unsubscribe();
    }
  }

  getSensors(id: number, page?: string) {
    this.inProgress = true;
    this.api.getSection(id, page).subscribe(response => {
      this.sensors = response.sensors;
      this.section = {'id': response.id, 'name': response.section};
      this.totalItems = 12*response.total_pages;
      this.inProgress = false;
    });
  }

  pageChanged(event) {
    this.getSensors(this.route.snapshot.params.id, event.page);
  }

  getSensor(id: number) {
    this.router.navigate([`sensor/${id}`]);
  }

  showVideo() {
    this.video = !this.video;
    if(this.video) {
      this.remoteVideo = document.querySelector('video');
      this.websocket.startSignalling(this.section.id);
      /*
      this.remoteVideo = document.querySelector('video');
      // Remote video shows local video
      navigator.mediaDevices.getUserMedia({video: true}).then(
        stream => {
          this.remoteStream = stream;
          this.remoteVideo.srcObject = stream;
          console.log('Recieved local stream');
        },
        error => {
          console.log('navigator.getUserMedia error: ', error);
        });*/
      this.signalling = this.websocket.onSignallingMessage().subscribe(message => {
        console.log(`${message.sender}: ${message.message}`);
        if(message.message === 'Call exchange channel opened') {
          this.createPeerConnection();
        } else if(message.message.type === 'offer') {
          console.log('Offer received');
          console.log(message.message);
          this.pc.setRemoteDescription(new RTCSessionDescription(message.message));
          this.pc.createAnswer().then(description => this.createdAnswer(description))
            .catch(error => {
              console.log(`Failed to setLocalDescription with ${error}`);
            });
        } else if(message.message.type === 'candidate') {
          let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.message.label,
            candidate: message.message.candidate
          });
          this.pc.addIceCandidate(candidate);
        }
      });
    } else if(this.pc){
      this.hangUp();
    }
  }

  createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.addEventListener('icecandidate', event=> this.handleIceCandidate(event));
      this.pc.addEventListener('iceconnectionstatechange', event=> this.handleIceConnectionStateChange(event));
      this.pc.addEventListener('track', event=> this.gotRemoteStream(event));
      console.log('PeerConnection created');
    } catch (e) {
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
  }

  gotRemoteStream(event) {
    this.remoteStream = event.streams[0];
    this.remoteVideo.srcObject = this.remoteStream;
    console.log('Received remote stream');
  }

  createdAnswer(description) {
    this.pc.setLocalDescription(description);
    this.sendSignallingMessage(description);
  }

  sendSignallingMessage(message: any) {
    this.websocket.sendSignallingMessage(message, this.section.id);
  }

  hangUp() {
    this.websocket.endSignalling(this.section.id);
    this.signalling.unsubscribe();
    this.remoteVideo = null;
    if(this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  sensorsForm = new FormGroup({
    name: new FormControl(''),
    location: new FormControl('')
  });

  createSensor(name: string, location: string, section_id: number) {
    this.api.createSensor(name, location, section_id).subscribe(response => {
      this.getSensors(this.route.snapshot.params.id);
      this.sensorsForm.reset();
    });
  }

  modalDeleteSensor(template: TemplateRef<any>, id: number){
    this.currentId = id;
    this.modalRef = this.modalService.show(template);
  }

  deleteSensor(id: number) {
    this.api.deleteSensor(id).subscribe(response => {
      this.getSensors(this.route.snapshot.params.id);
    });
  }

  confirmDeletion() {
    this.deleteSensor(this.currentId);
    this.modalRef.hide();
    this.currentId = undefined;
  }

  cancelDeletion() {
    this.modalRef.hide();
    this.currentId = undefined;
  }
}

import { Component, OnInit } from '@angular/core';
import adapter from 'webrtc-adapter';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isDisabled = true;

  localVideo;
  localStream;
  localPeerConnection;

  remoteVideo;
  remoteStream;
  remotePeerConnection;

  constructor() { }

  ngOnInit() {
    /*
    const selector = document.querySelectorAll('video');
    this.localVideo = selector[0];
    this.remoteVideo = selector[1];*/
  }
  /*
  start() {
    navigator.mediaDevices.getUserMedia({video: true}).then(
      stream => {
        this.localStream = stream;
        this.localVideo.srcObject = stream;
        console.log('Recieved local stream');
        this.isDisabled = false;
      },
      error => {
        console.log('navigator.getUserMedia error: ', error);
      });
  }

  getRemoteStream(event) {
    const mediaStream = event.stream;
    this.remoteVideo.srcObject = mediaStream;
    this.remoteStream = mediaStream;
    console.log('Recieved remote stream');
  }

  call() {
    // servers = null;
    this.localPeerConnection = new RTCPeerConnection(null);
    console.log('Created local peer connection object localPeerConnection.');
    this.localPeerConnection.addEventListener('icecandidate', event => this.handleConnection(event));
    this.localPeerConnection.addEventListener('iceconnectionstatechanged', event => this.handleConnectionChange(event));

    this.remotePeerConnection = new RTCPeerConnection(null);
    console.log('Created remote peer connection object remotePeerConnection.');
    this.remotePeerConnection.addEventListener('icecandidate', event => this.handleConnection(event));
    this.remotePeerConnection.addEventListener('iceconnectionstatechange', event => this.handleConnectionChange(event));
    this.remotePeerConnection.addEventListener('addstream', event => this.getRemoteStream(event));

    // Add local stream to connection and create offer
    this.localPeerConnection.addStream(this.localStream);
    console.log('Added local stream to localPeerConnection');

    console.log('localPeerConnection create offer start.');
    // offerOptions = {offerToReceiveVideo: 1};
    this.localPeerConnection.createOffer({offerToReceiveVideo: 1})
      .then(description => this.createdOffer(description))
      .catch(error=>{
        console.log(`Failed to create session description: ${error}.`);
      });
  }

  handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = this.getOtherPeer(peerConnection);

      otherPeer.addIceCandidate(newIceCandidate)
        .then(() => {
          console.log(`${this.getPeerName(peerConnection)} addIceCandidate success.`);
        }).catch( error => {
          console.log(`${this.getPeerName(peerConnection)} failed to add ICE Candidate: ${error}.`);
        });

      console.log(`${this.getPeerName(peerConnection)} ICE candidate: ${event.candidate.candidate}.`);
    }
  }

  handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log('ICE state change event: ', event);
    console.log(`${this.getPeerName(peerConnection)} ICE state: ${peerConnection.iceConnectionState}.`);
  }

  createdOffer(description) {
    console.log(`Offer from localPeerConnection: ${description.sdp}`);
    console.log('localPeerConnection setLocalDescription start.');
    this.localPeerConnection.setLocalDescription(description)
      .then(() => {
        console.log('setLocalDescription for localPeerConnection');
      }).catch(error => {
        console.log(`Failed to setLocalDescription with ${error}`);
      });
    
    console.log('remotePeerConnection setRemoteDescription start.');
    this.remotePeerConnection.setRemoteDescription(description)
      .then(() => {
        console.log('setRemoteDescription for remotePeerConnection');
      }).catch(error => {
        console.log(`Failed to setRemoteDescription with ${error}`);
      });

    console.log('remotePeerConnection createAnswer start.');
    this.remotePeerConnection.createAnswer()
      .then(description => this.createdAnswer(description))
      .catch(error => {
        console.log(`Failed to setLocalDescription with ${error}`);
      });
  }

  createdAnswer(description) {
    console.log(`Answer from remotePeerConnection: ${description.sdp}.`);
    console.log('remotePeerConnection setLocalDescription start.');
    this.remotePeerConnection.setLocalDescription(description)
      .then(() => {
        console.log('setLocalDescription for remotePeerConnection');
      }).catch(error => {
        console.log(`Failed to setLocalDescription with ${error}`);
      });
    
    console.log('localPeerConnection setRemoteDescription start.');
    this.localPeerConnection.setRemoteDescription(description)
      .then(() => {
        console.log('setRemoteDescription for localPeerConnection');
      }).catch(error => {
        console.log(`Failed to setLocalDescription with ${error}`);
      });
  }

  getOtherPeer(peerConnection): any {
    return (peerConnection === this.localPeerConnection)?this.remotePeerConnection:this.localPeerConnection;
  }

  getPeerName(peerConnection): string {
    return (peerConnection === this.localPeerConnection)?'localPeerConnection':'remotePeerConnection';
  }

  hangUp() {
    this.localPeerConnection.close();
    this.remotePeerConnection.close();
    this.localPeerConnection = null;
    this.remotePeerConnection = null;
    this.isDisabled = true;

    const tracks = this.localStream.getTracks();
    tracks.forEach((track)=> {
      track.stop();
    });

    console.log('Ending call.');
  }*/
}

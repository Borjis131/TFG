import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WebsocketService } from './services/websocket/websocket.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { URLS } from 'src/environments/environment';
import { User } from 'src/app/models/user';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  currentUser: User;
  messages: any[] = [];
  notReaded: number;
  alerts: any[] = [];

  constructor(private router: Router, private authService: AuthenticationService, private websocket: WebsocketService) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if(this.currentUser) {
        this.websocket.open(URLS.websocket, this.currentUser.token);
        this.websocket.onApplicationMessage().subscribe((message)=> {
          this.messages.push({'text': message, 'readed': false});
          this.notReaded = 0;
          for(message of this.messages) {
            if(message.readed == false) {
              this.notReaded++
            }
          }
        });
        this.websocket.onApplicationAlert().subscribe((alert)=> {
          this.alerts.push(alert);
        });
      }
    });
   }

   readMessage(message) {
     message.readed = true;
     this.notReaded--;
     this.notReaded==0?this.notReaded=undefined:this.notReaded;
   }

   logout() {
    this.messages = [];
    this.alerts = [];
    this.notReaded = undefined;
    this.authService.logout(); 
    this.websocket.close(); 
    this.router.navigate(['login']);
   }
}

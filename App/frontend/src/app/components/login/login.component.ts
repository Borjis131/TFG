import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: [ './login.component.scss' ]
})
export class LoginComponent implements OnInit {
  
  returnUrl: string;

  constructor(private authService: AuthenticationService, private router: Router, private route: ActivatedRoute) {
    if (this.authService.currentUserValue) { 
      this.router.navigate(['/']);
  }
   }

  loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  registerForm = new FormGroup({
    email: new FormControl('', Validators.email),
    username: new FormControl(''),
    password1: new FormControl('', Validators.minLength(5)),
    password2: new FormControl('', Validators.minLength(5))
  })

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  login(username: string, password: string) {
    this.authService.login(username, password)
      .pipe(first())
      .subscribe(
        data => {
          this.router.navigate([this.returnUrl]);
        },
        error => {
          console.log(error);
        }
      );
  }

  register(username: string, email: string, password: string) {
    this.authService.register(username, email, password).subscribe(
      (res: Response) => {
        if(res) {
          this.login(username, password);
        }
      },
      error => {
        console.log(error);
      }
      );
  }

}

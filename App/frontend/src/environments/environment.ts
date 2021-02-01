// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false
};

const server = 'http://localhost:5000';
const serverHTTPS = 'https://localhost:5000';
const api_version = '/api/v1.0';

export const URLS = {
  login: `${server}${api_version}/token`,
  register: `${server}${api_version}/users`,
  gardens: `${server}${api_version}/gardens`,
  sections: `${server}${api_version}/sections`,
  sensors: `${server}${api_version}/sensors`,
  analytics: `${server}${api_version}/measures`,
  coordinates: `${server}${api_version}/garden_coordinates`,
  websocket: `${server}`
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

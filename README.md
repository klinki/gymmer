# Gymmer

## Gym training app

Entities in system:
- Exercise
- Exercise Group
  - Exercises grouped by body parts
- Exercise Execution
  - Exercise + additional parameters (weight, repetitions, number of series, variant, other params...)
- Training plan (Routine)
  - Training plan is basically named list of exercises.
- Training
  - Training is list of exercise executions at given time
  - Has start and end time

## Screens

- [ ] Exercise
  - [x] Exercise List
  - [ ] Exercise Detail
  - [ ] Exercise History
- [ ] Training Plans
  - [x] Training Plan List
  - [x] Training Plan Edit
  - [ ] Training Plan History
- [ ] Training
  - [x] Training Detail
  - [x] Exercise Execution
  - [ ] Training History



This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

import {Component, OnInit} from '@angular/core';
import {Container} from '../../models/container.model';
import {ActivatedRoute} from '@angular/router';
import {ProjectService} from '../../services/project.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})
export class SetupComponent implements OnInit {

  container: Container;
  formGroup: FormGroup;
  outputConfig: any;

  constructor(private route: ActivatedRoute, private projectService: ProjectService) {
    this.container = route.snapshot.data.container;
  }

  ngOnInit(): void {
    this.initFormControls();
    this.projectService.addContainer();
    this.outputConfig = {};
  }

  submit(): void {
    this.container.config.forEach((group) => {
      group.fields.forEach((input) => {
        const controlName = group.label + '_' + input.id;
        const value = this.formGroup.get(controlName).value;

        switch (input.destination) {
          case 'docker-compose':
            this.addToDockerCompose(value, input);
            break;
          case 'environment':
            this.addToEnvironment(value, input);
            break;
          case 'volumes':
            this.addToVolumes(value, input);
            break;
          case 'ports':
            this.addToPorts(value, input);
            break;
        }

        this.outputConfig['image'] = this.container.docker + ':' + this.container.version;
      });
    });

    console.log(this.outputConfig);
    console.log(YAML.stringify(this.outputConfig));
  }

  private initFormControls(): void {
    this.formGroup = new FormGroup({});

    this.container.config.forEach(group => {
      group.fields.forEach(input => {
        const formControl = new FormControl('');
        const controlName = group.label + '_' + input.id;

        formControl.setValidators(Validators.required);

        this.formGroup.addControl(controlName, formControl);
      });
    });
  }

  private addToDockerCompose(value: string, input: any): void {
    if (!value) {
      value = input.value;
    }

    const notOverridableFolder: Array<string> = ['volumes', 'environment', 'ports'];
    if (notOverridableFolder.includes(input.base)) {
      return;
    }

    this.outputConfig[input.base] = value;
  }

  private addToEnvironment(value: string, input: any): void {
    if (!this.outputConfig['environment']) {
      this.outputConfig['environment'] = [];
    }

    if (!value) {
      value = input.value;
    }

    this.outputConfig['environment'].push(input.base + '=' + value);
  }

  private addToVolumes(value: string, input: any): void {
    if (!this.outputConfig['volumes']) {
      this.outputConfig['volumes'] = [];
    }

    if (!value) {
      value = input.value;
    }

    this.outputConfig['volumes'].push(value + ':' + input.base);
  }

  private addToPorts(value: string, input: any): void {
    if (!this.outputConfig['ports']) {
      this.outputConfig['ports'] = [];
    }

    if (!value) {
      value = input.value;
    }

    this.outputConfig['ports'].push(value + ':' + input.base);
  }
}

import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KpInputComponent} from "@k-project/common-ui";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CalculateComponent} from "../../feature-calculate/calculate/calculate.component";
import {Task} from "../../interface/task.interface";


@Component({
    selector: 'kp-main-page',
    imports: [CommonModule, KpInputComponent, ReactiveFormsModule, CalculateComponent],
    templateUrl: './main-page.component.html',
    styleUrl: './main-page.component.scss',
    standalone: true
})
export class MainPageComponent {

    isProcess = signal(false)
    task = signal<Task | null>(null)

    taskForm = new FormGroup({
        differential: new FormControl<string>('', [Validators.required]),
        initial: new FormControl<string>('', [Validators.required]),
        section: new FormControl<string>('', [Validators.required]),
        accuracy: new FormControl<number | null>(null, [Validators.required]),
    })


    constructor() {
        this.taskForm.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(value => {
                if (!value) return

                const val: Task = {
                    differential: value.differential!,
                    initial: value.initial!,
                    section: value.section!,
                    accuracy: value.accuracy!,
                }

                this.task.set(val)
            })
    }

    onProcess() {
        if (this.taskForm.invalid) return
        this.isProcess.set(true)
    }

    onEnter(toggle: boolean) {
        let example: Task
        if (toggle) {
            example = {
                differential: 't+2x(t)^2',
                initial: 'x(0)=0',
                section: '[0,1/2]',
                accuracy: 0.1,
            }
        } else {
            example = {
                differential: '2x(t)',
                initial: 'x(0)=1',
                section: '[0,1/4]',
                accuracy: 0.1,
            }
        }
        this.task.set(example);

        this.taskForm.patchValue({...example})
    }

    onDelete() {
        this.isProcess.set(false)
        this.taskForm.reset()
    }
}

import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms"
import { takeUntilDestroyed } from "@angular/core/rxjs-interop"

@Component({
  selector: "kp-input",
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./kp-input.component.html",
  styleUrl: "./kp-input.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KpInputComponent),
      multi: true,
    },
  ],
  standalone: true
})
export class KpInputComponent implements ControlValueAccessor {
  innerInput = new FormControl<string>("")
  type = input<string>('text')

  constructor() {
    this.innerInput.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.onChange(value ?? "")
      this.onTouched()
    })
  }

  writeValue(value: string) {
    this.innerInput.patchValue(value)
  }

  onChange(value: string) {}

  onTouched() {}

  registerOnChange(fn: any) {
    this.onChange = fn
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn
  }
}

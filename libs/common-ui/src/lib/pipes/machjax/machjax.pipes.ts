import {Pipe} from "@angular/core";

@Pipe({
    name: 'machjax',
    pure: true,
})
export class MachjaxPipe {
    transform(value: string) {
        return `\\( ${value} \\)`;
    }
}
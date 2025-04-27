import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MainPageComponent} from "@k-project/main";

@Component({
    imports: [RouterModule, MainPageComponent],
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'k-project';
}

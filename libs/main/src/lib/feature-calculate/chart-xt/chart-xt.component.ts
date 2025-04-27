import {ChangeDetectionStrategy, Component, input, Input, OnInit, viewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {BaseChartDirective} from "ng2-charts";
import {Chart, ChartConfiguration, ChartData, ChartOptions, ChartType, registerables} from "chart.js";

@Component({
  selector: 'kp-chart-xt',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './chart-xt.component.html',
  styleUrl: './chart-xt.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartXtComponent implements OnInit {

  func = input.required<(t: number) => number>()

  t0 = input<number>(0)
  t1 = input<number>(1)

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    elements: {
      line: {
        tension: 0.4,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 't' },
      },
      y: {
        title: { display: true, text: 'x' },
      }
    }
  };


  ngOnInit() {
    Chart.register(...registerables);

    const func = this.func();

    const steps = 10;
    const dt = (this.t1() - this.t0()) / steps;
    const labels: number[] = [];
    const data: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = this.t0() + i * dt;
      const y = func(t);

      console.log(`t = ${t}, y = ${y}`);

      labels.push(Number(t.toFixed(3)));
      data.push(y);
    }

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'x(t)',
          data,
          borderColor: '#FF7663',
          backgroundColor: '#FF7663',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
        },
      ],
    };
  }

}

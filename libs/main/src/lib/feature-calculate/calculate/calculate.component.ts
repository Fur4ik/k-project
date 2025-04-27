import {ChangeDetectionStrategy, Component, input, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Task} from "../../interface/task.interface";
import {all, create} from "mathjs";
import {ChartXtComponent} from "../chart-xt/chart-xt.component";

@Component({
    selector: 'kp-calculate',
    imports: [CommonModule, ChartXtComponent],
    templateUrl: './calculate.component.html',
    styleUrl: './calculate.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculateComponent implements OnInit {
    task = input.required<Task>()

    section = signal<[number, number]>([0, 0])
    initial = signal<number>(0)
    epsilon = signal<number>(0)
    xt = signal<(t: number) => number>(() => 0);

    fCompiled!: (scope: { t: number; x: number }) => number;
    fDerivativeCompiled!: (scope: { t: number; x: number }) => number;

    ngOnInit() {
        const task = this.task()
        if (!task) return

        this.parseValue()
        this.initialValue(task.initial)

        const x0 = this.initial()
        const normalizeDiff = task.differential.replace(/x\s*\(\s*t\s*\)/g, 'x')

        const math = create(all, {});
        const fExpr = math.parse(normalizeDiff);
        const derivativeExpr = math.derivative(fExpr, 'x');

        this.fCompiled = fExpr.compile().evaluate.bind(fExpr);
        this.fDerivativeCompiled = derivativeExpr.compile().evaluate.bind(derivativeExpr);

        const v0 = (t: number) => x0 + t;
        const u0 = (t: number) => x0;

        this.iteration(v0, u0)
    }

    iteration(
        v0: (t: number) => number,
        u0: (t: number) => number,
    ): void {
        const [t0, t] = [...this.section()]
        const accuracy = this.task().accuracy

        const [qn, pn, psin, phin] = [...this.calculateCoefficients(v0, u0)]

        const sigma0 = this.calculateSigma0Fun(qn, psin, t0)
        const ro0 = this.calculateRo0Fn(pn, phin, t0)

        const vn = this.calculateVn(v0, sigma0)
        const un = this.calculateUn(u0, ro0)
        const epsilonN = this.calculateEpsilon(vn, un)

        if (epsilonN(t) > accuracy) {
            console.log('epsilonN(t) > accuracy')
            this.iteration(vn, un)
            return
        } else {
            console.log('epsilonN(t) < accuracy')
            this.epsilon.set(Math.abs(Number(epsilonN(t).toFixed(5))))
            const xt = this.calculateXt(vn, un)
            this.xt.set(xt)
        }
    }

    initialValue(initial: string) {
        const parts = initial.split('=')

        if (parts.length !== 2) {
            this.initial.set(0)
            return
        }

        initial = parts[1].toString()

        if (initial.includes('/')) {
            const [numerator, denominator] = initial.split('/').map(Number)
            this.initial.set(denominator !== 0 ? numerator / denominator : 0)
            return
        }

        this.initial.set(Number(initial))
    }

    parseValue() {
        const task = this.task()
        if (!task) return

        const [leftRaw, rightRaw] = task.section.slice(1, -1).split(',')

        const parseNumber = (value: string) => {
            if (value.includes('/')) {
                const [numerator, denominator] = value.split('/').map(Number)
                return denominator !== 0 ? numerator / denominator : 0
            }
            return Number(value) || 0
        }

        this.section.set([parseNumber(leftRaw.trim()), parseNumber(rightRaw.trim())])
    }


    calculateCoefficients(
        vn: (t: number) => number,
        un: (t: number) => number
    ) {
        const f = this.fCompiled;
        const fDerivative = this.fDerivativeCompiled;

        const qn = (t: number): number => {
            const vn_t = vn(t);
            const un_t = un(t);
            const fvn = f({t, x: vn_t});
            const fun = f({t, x: un_t});
            return ((fvn - fun) / (vn_t - un_t)) || 0;
        };
        const pn = (t: number): number => {
            return fDerivative({t, x: un(t)});
        };
        const psin = (t: number): number => {
            const h = 1e-6;
            const derivativeVnApprox = (vn(t + h) - vn(t)) / h;
            const vn_t = vn(t);
            const fvn = f({t, x: vn_t});
            const result = derivativeVnApprox - fvn;
            return Math.abs(result) < 1e-9 ? 0 : Number(result.toFixed(10));
        }
        const phin = (t: number): number => {
            const h = 1e-6;
            const derivativeUnApprox = (un(t + h) - un(t)) / h;
            const un_t = un(t);
            const fvn = f({t, x: un_t});
            const result = -(derivativeUnApprox - fvn);
            return Math.abs(result) < 1e-9 ? 0 : Number(result.toFixed(10));
        }
        return [qn, pn, psin, phin];
    }

    isAccuracy() {
        return this.task().accuracy >= this.epsilon()
    }

    calculateVn(
        vn: (t: number) => number,
        sigmaN: (t: number) => number,
    ) {
        return function (t: number) {
            return vn(t) - sigmaN(t)
        }
    }

    calculateUn(
        un: (x: number) => number,
        roN: (t: number) => number,
    ) {
        return function (t: number) {
            return un(t) + roN(t)
        }
    }

    calculateXt(
        vn: (t: number) => number,
        un: (x: number) => number
    ) {
        return function (t: number) {
            return (vn(t) + un(t)) / 2;
        }
    }

    calculateEpsilon(
        vn: (t: number) => number,
        un: (t: number) => number
    ) {
        return function (t: number) {
            return vn(t) - un(t);
        }
    }

    calculateSigma0Fun(
        q0: (tau: number) => number,
        psi0: (tau: number) => number,
        t0: number
    ) {
        const intQ0 = this.createIntegralFunction(q0, t0);
        return function (t: number): number {
            const expIntQ0 = Math.exp(intQ0(t));
            const integralPsi0 = integrate((tau) => {
                return psi0(tau) * Math.exp(-intQ0(tau));
            }, t0, t);
            return expIntQ0 * integralPsi0;
        };
    }

    calculateRo0Fn(
        p0: (tau: number) => number,
        phi0: (tau: number) => number,
        t0: number
    ) {
        const intP0 = this.createIntegralFunction(p0, t0);
        return function (t: number): number {
            const expIntP0 = Math.exp(intP0(t));
            const integralPhi0 = integrate((tau) => {
                return phi0(tau) * Math.exp(-intP0(tau));
            }, t0, t);
            return expIntP0 * integralPhi0;
        };
    }

    createIntegralFunction(f: (t: number) => number, t0: number): (t: number) => number {
        const cache = new Map<number, number>();
        return function (t: number): number {
            if (cache.has(t)) return cache.get(t)!;
            const value = integrate(f, t0, t);
            cache.set(t, value);
            return value;
        }
    }

}

function integrate(
    f: (t: number) => number,
    a: number,
    b: number,
): number {
    if (a === b) return 0;
    if (a > b) return -integrate(f, b, a);
    const stepSize = 0.01;
    const actualSteps = Math.ceil((b - a) / stepSize);
    const h = (b - a) / actualSteps;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < actualSteps; i++) {
        sum += f(a + i * h);
    }
    return sum * h;
}
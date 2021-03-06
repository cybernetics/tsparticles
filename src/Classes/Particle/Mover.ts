import { Utils } from "../Utils/Utils";
import type { Container } from "../Container";
import { HoverMode } from "../../Enums/Modes/HoverMode";
import type { IParticle } from "../../Interfaces/IParticle";

export class Mover {
    private readonly container: Container;
    private readonly particle: IParticle;

    constructor(container: Container, particle: IParticle) {
        this.container = container;
        this.particle = particle;
    }

    public move(delta: number): void {
        const container = this.container;
        const options = container.options;
        const particle = this.particle;

        if (options.particles.move.enable) {
            const slowFactor = this.getProximitySpeedFactor();
            const deltaFactor = options.fpsLimit > 0 ? (60 * delta) / 1000 : 3.6;
            const baseSpeed = particle.moveSpeed ?? container.retina.moveSpeed;
            const moveSpeed = baseSpeed / 2 * slowFactor * deltaFactor;

            particle.position.x += particle.velocity.horizontal * moveSpeed;
            particle.position.y += particle.velocity.vertical * moveSpeed;
        }

        /* parallax */
        this.moveParallax();
    }

    private moveParallax(): void {
        const container = this.container;
        const options = container.options;

        if (!options.interactivity.events.onHover.parallax.enable) {
            return;
        }

        const particle = this.particle;
        const parallaxForce = options.interactivity.events.onHover.parallax.force;
        const mousePos = container.interactivity.mouse.position;

        if (!mousePos) {
            return;
        }

        const windowDimension = {
            height: window.innerHeight / 2,
            width: window.innerWidth / 2,
        };
        const parallaxSmooth = options.interactivity.events.onHover.parallax.smooth;

        /* smaller is the particle, longer is the offset distance */
        const tmp = {
            x: (mousePos.x - windowDimension.width) * (particle.size.value / parallaxForce),
            y: (mousePos.y - windowDimension.height) * (particle.size.value / parallaxForce),
        };

        particle.offset.x += (tmp.x - particle.offset.x) / parallaxSmooth; // Easing equation
        particle.offset.y += (tmp.y - particle.offset.y) / parallaxSmooth; // Easing equation
    }

    private getProximitySpeedFactor(): number {
        const container = this.container;
        const options = container.options;
        const particle = this.particle;
        const active = Utils.isInArray(HoverMode.slow, options.interactivity.events.onHover.mode);

        if (!active) {
            return 1;
        }

        const mousePos = this.container.interactivity.mouse.position;

        if (!mousePos) {
            return 1;
        }

        const particlePos = {
            x: particle.position.x + particle.offset.x,
            y: particle.position.y + particle.offset.y
        };

        const dist = Utils.getDistanceBetweenCoordinates(mousePos, particlePos);
        const radius = container.retina.slowModeRadius;

        if (dist > radius) {
            return 1;
        }

        const proximityFactor = (dist / radius) || 0;
        const slowFactor = options.interactivity.modes.slow.factor;

        return proximityFactor / slowFactor;
    }
}
